# FineFatigue 开发与维护说明

## 1. 运行结构

```text
移动端浏览器
  ├─ React UI / DeviceMotion / LocalStorage
  └─ 同源 fetch: /api/*
           │
           ▼
Express（server.mjs）
  ├─ 认证、会话、管理员 API
  ├─ 合并同步与 CSV 导出
  ├─ MiMo API 代理
  └─ data/finefatigue-store.json
           │
           ▼
Tailscale Serve HTTPS（可选的 Tailnet 访问入口）
```

浏览器不会直接持有 MiMo 密钥；仅服务端从 `.env` 读取密钥并向 MiMo 发起请求。

## 2. 主要目录和职责

| 位置 | 职责 |
| --- | --- |
| `src/App.tsx` | 顶层状态、页面切换、IMU 订阅、评测完成后的同步触发。 |
| `src/components/assessment/` | 评测向导与每个采集步骤。`AssessmentWizard.tsx` 固定整个实验顺序。 |
| `src/components/cognition/` | 空间记忆卡片、实际点击流程和认知结果展示。`MemoryGame.tsx` 管理随机牌组、配对锁定，逐次采集墙钟时间与单调任务相对时间。 |
| `src/components/charts/` | 波形、频谱、敲击、反应、描摹可视化。 |
| `src/pages/CognitionMemoryPage.tsx` | 认知任务说明、开始/返回、结果历史和详情入口。 |
| `src/pages/` | 概览、监视、报告、历史、设置与管理员界面。 |
| `src/services/sensorAdapter.ts` | 真实 `DeviceMotion` 采集与权限状态；没有模拟回退。 |
| `src/services/storage.ts` | 浏览器 LocalStorage 的会话、自评、设置读写。 |
| `src/services/cognitionStorage.ts` | 浏览器 LocalStorage 的认知任务完整结果读写；容量/写入失败时向调用方抛出可提示的错误。 |
| `src/services/authService.ts` | 浏览器登录令牌及认证状态。 |
| `src/services/cloudSyncService.ts` | 受试者向 `/api/sync` 的同步、备份导入导出；网络失败后最多进行 3 次指数退避重试，并在浏览器恢复在线时重试。 |
| `src/services/aiMotivationService.ts` | AI 建议请求及本地规则降级。 |
| `src/utils/cognitionMetrics.ts` | 从实际配对尝试计算准确率、响应时间、前后半程变化和透明的任务指标。 |
| `src/utils/` | 指标计算、信号处理及疲劳评分。 |
| `server.mjs` | Express API、账户密码哈希、内存会话、JSON 存储、CSV 导出、MiMo 代理、静态站点服务。 |

## 3. 前后端交互

前端只请求相对路径 `/api/*`，因此生产环境应由同一个 Express 服务同时托管前端 `dist/` 与 API。

| 方法与路径 | 调用方 | 作用 |
| --- | --- | --- |
| `GET /api/health` | 运维检查 | 返回服务可用状态。 |
| `POST /api/auth/login` | 账号面板 | 登录或注册；注册请求使用 `mode: "register"`。 |
| `GET /api/auth/me`、`POST /api/auth/logout` | 认证服务 | 恢复或结束浏览器会话。 |
| `POST /api/sync` | 受试者同步服务 | 合并会话、自评、认知任务结果与设置；需要受试者 Bearer token。 |
| `GET /api/admin/accounts` | 管理员页 | 获取受试者账户摘要。 |
| `PATCH /api/admin/accounts/:id` | 管理员页 | 审核/停用、报酬记录、密码重置。 |
| `GET /api/admin/export/sessions.csv` | 管理员页 | 导出会话 CSV。 |
| `GET /api/admin/export/users.csv` | 管理员页 | 导出受试者 CSV。 |
| `GET /api/admin/export/cognition.csv` | 管理员页 | 导出认知任务汇总指标 CSV。 |
| `GET /api/admin/export/cognition-raw.csv` | 管理员页 | 导出认知任务逐选择/逐尝试原始长表 CSV。 |
| `GET /api/admin/export/raw.csv` | 管理员页 | 导出完整评测的 IMU、敲击、反应、描摹和频谱原始长表 CSV。 |
| `GET /api/admin/export/games.csv` | 管理员页 | 导出 Star Catcher 标准化追踪任务的逐点原始轨迹 CSV。 |
| `POST /api/ai/motivation` | 疲劳关怀服务 | 服务端调用 MiMo，返回结构化建议。 |

管理员与受试者接口使用 `Authorization: Bearer <token>`。令牌只存在服务端内存 12 小时；服务重启后所有登录会话失效，用户需要重新登录。

## 4. 数据存储与备份

- 浏览器：会话、自评、认知任务结果、标准化追踪任务结果、设置、活动报告、认证令牌及同步状态保存在 LocalStorage。同步清单按登录受试者 ID 记录已确认的记录 ID；首次同步上传本机记录，后续仅上传新记录。
- 服务端：`data/finefatigue-store.json` 保存账户、密码哈希、会话、自评、认知任务结果、设置和报酬记录；先写入临时文件后再重命名。
- 服务端数据目录默认不入 Git。部署或迁移前应在服务停止后复制该 JSON 文件，并限制文件系统访问权限。
- CSV 可导出选定的会话派生字段、受试者管理字段、认知汇总指标、完整评测原始长表、认知原始长表或追踪任务逐点轨迹；完整会话中的波形与描摹点、完整认知任务的点击/尝试数组保存在相应 JSON 记录内。

服务端 JSON 不提供加密、版本迁移、数据库锁或多进程并发控制。不要让多个 `npm start` 实例共享同一个数据文件。

## 5. 配置和部署要点

参见根目录 `.env.example`。必须重点保护：

- `ADMIN_USERNAME` / `ADMIN_PASSWORD`：管理员账户；未配置则管理员不能登录。
- `MIMO_API_KEY`：仅服务端使用，绝不能以 `VITE_*` 变量或前端代码暴露。
- `PORT`：默认 `3000`；修改后同步更新 Tailscale Serve 的代理目标。

推荐部署步骤：先执行 `npm run build`，再使用 `npm start`。若通过 Tailscale Serve 暴露，确认其根路径指向运行中的 `http://127.0.0.1:<PORT>`，并以 `tailscale serve status` 复核。修改 `.env`、更新代码或更新构建后，都需要重启服务。

## 6. Runtime 变更规则

### 6.1 修改实验参数时

必须同时核对：

- `src/config/runtime.ts`
- 对应的 assessment components
- `docs/EXPERIMENT_PROTOCOL.md`
- `docs/DATA_SPECIFICATION.md`
- `docs/TESTING.md`
- `docs/FATIGUE_ASSESSMENT_RATIONALE.md`

Demo timing 只用于 walkthrough；不要为了让 Demo 通过而修改 Full 的研究参数，也不要把两种 runtime 的数据描述为等价。

### 6.2 修改 Demo 时

至少检查：

- `npm run build:demo` 和 `/FineFatigue/` base。
- `npm run preview:demo` 的静态资源、SPA fallback 和页面刷新。
- Demo banner、LocalStorage 保存与清除行为。
- 认证、同步、管理员和服务端 AI UI 是否仍被隐藏，浏览器是否没有依赖 `/api/*` 才能启动。
- GitHub Pages workflow 是否仍上传 `dist/`，且没有把 `dist/` 或 `.env` 加入 Git。

### 6.3 修改 Full 时

至少检查：

- `npm run build`、`npm start` 和 `GET /api/health`。
- 注册/审核/登录/退出、受试者同步、管理员、CSV 和可选 MiMo 路径。
- `.env.example`、`data/finefatigue-store.json`、Tailscale Serve 目标和 JSON 备份策略。

### 6.4 修改 Shared UI 或服务时

必须分别验证 Demo 和 Full。任何跨 runtime 的 feature gating 都要沿着 `import → component → service → runtime condition → actual call path` 检查，不能只搜索文件名或凭存在的 legacy 文件判断功能可用。

## 7. 后续开发注意事项

1. **保持真实采集原则。** 不要为“好看”或开发便利在真实实验页面回填 IMU 模拟波形。无事件时必须保持不可用或未采集状态。
2. **不要把主观自评纳入当前客观指数。** 评分逻辑在 `src/utils/fatigueScoring.ts`；如实验方案变化，应同时更新类型、导出字段、报告文案与协议文档。
3. **保护身份与数据。** 新接口必须保留相应认证/角色校验；导出与日志不要包含明文密码、令牌或 API Key。
4. **同步为增量合并而非事务。** 浏览器首次同步会上传本机记录，成功后按受试者 ID 保存已确认 ID，后续仅上传新记录。服务端按记录 ID 与时间戳合并；同 ID 内容不同会保留较旧版本为 `-CONFLICT-...` 副本。没有服务器端删除语义，修改同步数据模型时需先设计迁移和删除策略。
5. **评测顺序具有实验含义。** 调整 `AssessmentWizard` 步骤会改变数据可比性；同时更新 PRD、用户指南、会话类型和 CSV 字段。
6. **认知数据必须来自交互。** 保留 `MemoryGame` 对随机牌组、一次两张选择和错误配对期间输入锁定的约束；不要在仪表盘、历史或导出中制造演示记录。逐次点击必须同时保留墙钟时间与单调相对时间，原始长表导出不得只保留聚合分数。
7. **认知指标公式可复算。** `memoryScore = accuracy × 100`；`responseSpeedScoreRaw = 100 - meanResponseTime / 30`，界面分数再限制到 0–100；`cognitiveStabilityScoreRaw = 100 - max(0, reactionTimeChange) × 50 - max(0, errorRateChange) × 100`，界面分数同样限制到 0–100。原始字段保留在 JSON 与汇总 CSV 中。修改公式时需同步更新 `cognitionMetrics.ts`、CSV 字段、结果说明与实验协议。
8. **移动浏览器差异明显。** iOS 授权必须由用户手势触发，设备/浏览器/省电策略会影响事件频率。测试应覆盖目标手机与 HTTPS 访问路径。
9. **Star Catcher 是固定追踪任务。** 它记录李萨如目标轨迹、指针原始点、RMSE、在靶时间、相位滞后与 No-Go 事件；不要再将它标注为“平滑度”或以随机捕星分数作为实验指标。

## 8. 已知限制与待处理事项

- 当前数据层是单机 JSON，未实现数据库、备份自动化、并发写入控制、静态文件持久化服务或灾难恢复。
- 服务端内存会话会在重启后失效；未实现密码找回、登录限流、审计日志、HTTPS 以外的传输策略或细粒度管理员角色。
- 删除历史记录只修改浏览器缓存；下一次同步可能从服务端合并回已同步记录。若需要真正删除，应新增受控的服务端删除 API 和审计策略。
- 管理员导出的数据带有受试者编号，属于假名化而不是自动匿名化；导出前应根据实验伦理要求处理。
- `CloudSyncModal` 的界面名称仍使用“云端同步”，但当前实现是同源 LAN 服务同步，不连接第三方云数据库。
- `src/services/aiMotivationService.ts` 当前按扁平字段读取 AI 响应，而 `server.mjs` 返回 `{ message: { ... } }` 结构。服务端 MiMo 调用可成功返回结构化内容，但前端字段映射需要对齐后再将远程建议视为稳定的 UI 功能；不可用时本地规则仍是预期降级路径。
- Star Catcher 不纳入主评测会话和疲劳指数，但会独立保存、随受试者同步，并可由管理员导出逐点轨迹 CSV。
- 认知任务目前使用浏览器 LocalStorage 和单机同步 JSON；没有服务端实时审计、独立删除接口、常模数据库或医学解释。管理员现可导出逐次点击/尝试原始长表，但没有独立的服务端删除或版本迁移机制。
