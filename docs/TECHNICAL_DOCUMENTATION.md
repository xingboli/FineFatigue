# FineFatigue 技术文档

> 本文基于当前仓库代码整理，面向接手维护、实验运行与数据处理人员。它描述的是已经实现的行为，而不是产品路线图。最后核对代码实现基线：`bb0ec60`；后续提交仅为文档变更时，应以实际 Git history 为准。

## 1. 系统定位与边界

FineFatigue 是一个面向移动浏览器的疲劳/精细运动实验数据采集应用。它采集浏览器提供的真实 `DeviceMotion` 数据，完成一轮固定的“基准测验 → 疲劳负荷 → 复测 → 主观自评”流程，另提供独立的空间记忆任务与标准化指针追踪任务。

系统用于研究数据采集与整理，**不提供医学诊断、临床阈值、常模解释或治疗建议**。主观疲劳自评会与会话关联保存，但不参与客观疲劳指数的计算。

系统采用单页 React 前端与同源 Express 服务端。服务端适合实验室 LAN/Tailscale 中的单实例运行，不是多租户、分布式、高并发或临床级数据平台。

## 2. Runtime Architecture

FineFatigue 采用一个代码库加 runtime feature gating，而不是维护两套 UI。这样可以让传感器适配、任务计算、LocalStorage 和报告流程保持一致，同时用构建配置明确限制 Demo 的后端能力。

```text
                         Shared React Application
                                  │
                       src/config/runtime.ts
                           │              │
                    VITE_DEMO_MODE     default Full
                           │              │
             Online Static Demo     Local Full / Research
                           │              │
                    GitHub Pages       Express server.mjs
                    /FineFatigue/      /api/* + dist/
                           │              │
                    Browser-only      JSON store / Auth / Admin
                    LocalStorage      LAN sync / optional MiMo
```

`src/config/runtime.ts` 暴露 `DEMO_MODE`、`RUNTIME_MODE` 和 `EXPERIMENT_TIMINGS`。`.env.demo` 设置 `VITE_DEMO_MODE=true`；`vite.config.ts` 在 Demo mode 使用 `base=/FineFatigue/`，默认 Full 使用 `/`。`scripts/serve-demo.mjs` 只为本地预览提供 `/FineFatigue/` 子路径，不提供 `/api/*`。

| 能力 | Demo | Full |
| --- | --- | --- |
| 实验 UI、Canvas、真实点击 | 有 | 有 |
| DeviceMotion IMU | 支持设备并授权时有 | 支持设备并授权时有 |
| LocalStorage | 有 | 有 |
| Full research timings | 无，缩短用于 walkthrough | 有 |
| 认证、LAN 同步、管理员、CSV | 无 | 有 |
| MiMo | 无，使用本地规则 | 可选服务端能力 |

Demo 不是模拟传感器模式。`App.tsx` 的当前入口实例化的是 `RealHardwareSensorAdapter`；仓库中保留的 `src/services/sensorSimulator.ts` 没有沿当前入口导入或调用，不得据此在文档或演示中宣称存在可用的模拟 IMU。

### 2.1 Local Full request path

```text
手机 / 平板浏览器（Tailscale HTTPS）
  ├─ DeviceMotion → RealHardwareSensorAdapter → React 评测组件
  ├─ LocalStorage：会话、原始记录、任务结果、认证令牌、同步清单
  └─ Fetch /api/*（同源）
                   │
                   ▼
Express（server.mjs，0.0.0.0:PORT）
  ├─ 认证与内存会话
  ├─ 账号、同步、CSV 导出、AI 建议 API
  └─ data/finefatigue-store.json（单个本地 JSON 文件）
                   │
                   └─ 可选：小米 MiMo OpenAI 兼容 API（仅恢复建议）
```

- Vite 在开发时提供纯前端页面；`npm run dev` 不启动 API。
- `npm run build` 生成 `dist/`；`npm start` 用 Express 同时提供 `dist/` 与 `/api/*`。
- 为了让移动端浏览器获得 `DeviceMotion` 权限，实际实验应从 HTTPS 页面进入。当前推荐由 Tailscale Serve 将 Tailnet HTTPS 地址反代到 `http://127.0.0.1:3000`。
- 前后端使用相对路径 `/api/*`，因此生产环境不能把静态前端部署到另一个域名后仍期望认证与同步可用。

### 2.2 Runtime timing parameters

参数由 `EXPERIMENT_TIMINGS` 提供，Demo 只为课堂 walkthrough 和展示缩短时长；Full 才是当前 Research Mode 的正式实验实现。

| 参数 | Demo | Full |
| --- | ---: | ---: |
| Calibration | 1.5 s | 3 s |
| Stability | 5 s | 15 s |
| Tapping | 8 s | 15 s |
| Challenge options | 10 / 20 s | 30 / 60 s |
| Reaction valid trials | 5 | 30 |
| Reaction delay | 0.7–1.8 s | 2–10 s |
| Star Catcher | 10 s | 25 s |

## 3. 仓库与模块职责

| 路径 | 职责 |
| --- | --- |
| `src/App.tsx` | 顶层路由状态、硬件适配器单例、IMU 订阅、任务结束后的保存与同步触发。 |
| `src/config/runtime.ts`、`.env.demo`、`vite.config.ts` | Demo/Full runtime gating、实验计时和静态资源 base 配置。 |
| `src/components/assessment/` | 校准、稳定性、敲击、反应、螺旋、疲劳负荷和主观自评的交互步骤。 |
| `src/components/charts/` | 波形、频谱、反应时、螺旋等图表和 Canvas 绘制。 |
| `src/components/cognition/` | 4×4 空间记忆配对任务与结果页。 |
| `src/components/games/StarCatcherGame.tsx` | 固定轨迹追踪/No-Go 任务。虽沿用 Star Catcher 名称，但不是随机小游戏。 |
| `src/pages/` | 概览、传感器监视、报告、历史、设置、管理员、认知页。 |
| `src/services/sensorAdapter.ts` | 真实浏览器 IMU 接入，不含模拟回退。 |
| `src/services/storage.ts`、`cognitionStorage.ts` | LocalStorage 序列化、读写和配额错误处理。 |
| `src/services/authService.ts` | 浏览器认证状态与 Bearer 请求头。 |
| `src/services/cloudSyncService.ts` | 按受试者增量同步、本地备份、离线重试。 |
| `src/utils/` | 信号处理、敲击/描摹/认知指标、疲劳指数规则。 |
| `src/types/index.ts` | 前后端共享的核心记录结构。 |
| `server.mjs` | Express API、认证、JSON 存储、CSV 导出、可选 MiMo 代理和 SPA 回退。 |
| `data/` | 运行时创建的数据文件；已被 Git 忽略。 |

## 4. 真实传感器采集

### 4.1 接入流程

`RealHardwareSensorAdapter` 监听浏览器 `devicemotion` 事件：

1. 用户通过界面按钮触发 `connect()`；iOS 等浏览器上会在该用户手势中调用 `DeviceMotionEvent.requestPermission()`。
2. 没有 API、拒绝权限或没有实际事件时，状态为不可用/未连接；**不会生成模拟数据或替代波形**。
3. 收到事件后，使用 `accelerationIncludingGravity`；若其不存在则使用 `acceleration`。
4. 加速度由 m/s² 除以 `9.80665` 转为 g；`rotationRate.alpha/beta/gamma` 映射为 `gx/gy/gz`，缺失旋转率以 0 保存。
5. 以 `Date.now()` 写入每一条 `IMUDataPoint.timestamp`，并由相邻事件时间差给出传感器监视页的即时采样率估计。

实际事件率由设备、浏览器、系统权限和省电策略决定；项目不强制为 50 Hz。`SensorStatus.samplingRate` 是即时估计，稳定性分析中的 `measuredSamplingRate` 则由整段记录的时间间隔中位数计算。

### 4.2 校准和稳定性分析

校准阶段连续采样约 3 秒，至少需要 30 个 IMU 样本。它保存三轴平均重力向量、样本数、起止墙钟时间和实测采样率。稳定性步骤直接订阅传感器服务并连续记录，不依赖 React 的单点显示状态作为数据源。

`analyzeHandStability()` 的计算顺序：

1. 使用校准所得重力向量（若未提供，才以当前段三轴均值估计）。
2. 分别从 `ax/ay/az` 去除重力；向量模长用于 `motionRMS`。
3. 依据真实时间戳、相邻有效间隔的中位数作线性重采样。
4. 对去重力后的 **三条轴分别** 去均值、做 0–12 Hz 离散频率扫描，三轴功率相加。这样不会把单轴正负振动取模长后误整流为二倍频。
5. 输出主频、总功率、归一化谱熵、原始与展示用的稳定性得分，以及完整原始波形。展示分数限制在 0–100，原始值同时保留。

稳定性分数当前公式为：

```text
stabilityScoreRaw = 100 - (motionRMSRaw × 380 + spectralEntropyRaw × 15)
stabilityScore = clamp(round(stabilityScoreRaw), 0, 100)
```

此分数是当前项目的透明规则指标，不是经过临床验证的量表。

## 5. 实验与独立任务实现

### 5.1 主评测会话

`AssessmentWizard` 固定顺序为：

```text
校准
→ 测验 1：稳定性 → 交替敲击 → 反应时 → 螺旋描摹
→ 疲劳负荷挑战
→ 测验 2：稳定性 → 交替敲击 → 反应时 → 螺旋描摹
→ 主观疲劳自评
→ 报告
```

- **交替敲击**：Full 默认记录 15 秒内每一次左右靶点击、墙钟时间、相邻间隔和相对时间；Demo 记录 8 秒。分析把实际录制时长等分为三段，输出总体频率、平均 ITI、节律 CV 和三段频率。字段名 `first5sRate` / `middle5sRate` / `last5sRate` 为历史兼容名称，在 Demo 中代表实际 8 秒录制的三个等时段。`performanceDecrement = max(0, (firstSegmentRate-lastSegmentRate)/firstSegmentRate × 100)`；负值不会被解释为疲劳改善。
- **反应时**：30 个有效试次；每轮随机等待 2–10 秒后显示刺激。抢跑保存为 `isEarly=true`、RT=0，并重复该有效试次。有效试次保存墙钟时间、RT；结果包含平均/中位/最快/最慢、抢跑比例、≥500 ms 的 lapse 数和平均 reciprocal reaction time。其间隔设计参考 PVT 风格，但项目没有实现完整临床 PVT 协议或常模。
- **阿基米德螺旋**：模板为 3.5 圈、301 个点。画板每次开始清空旧笔画，当前实现只接受一笔；完成门槛为从近中心向外覆盖至少约 90% 的模板进度。原始指针点完整保存。派生 `pathRMSE` 在展示层限制为 3–30 px，`smoothness` 限制为 35–96，原始轨迹仍可供后续重新计算。
- **疲劳挑战**：保存实际经过时间和实际敲击数，而非仅使用 UI 预设时长。
- **主观自评**：1–10 分、等级、感受标签、可选备注与 `linkedSessionId`。它被写入会话和独立自评记录，明确不进入客观指数。

### 5.2 疲劳指数

`src/utils/fatigueScoring.ts` 使用四个规则维度并加权：

| 维度 | 权重 | 主要比较量 |
| --- | ---: | --- |
| 手部稳定性 | 25% | 稳定性分下降、运动 RMS 增幅。 |
| 运动耐力 | 30% | 敲击频率下降、performance decrement 与节律 CV 增加。 |
| 反应能力 | 20% | 负荷后中位反应时增加。 |
| 精细运动控制 | 25% | 描摹 RMSE 增幅、平滑度下降。 |

最终组合值被限制在 5–96 并映射为 Low/Mild/Moderate/High。参数与限制均为产品当前规则，不代表效度已验证；变更任何权重、阈值或限制都应同时修改实验方案、数据字典和版本字段。

### 5.3 认知与记忆

这是与主评测并列、无需 IMU 的独立 4×4 空间配对任务：8 对静态符号在每次开始时随机排列。每两次选择构成一次 `MemoryAttempt`；错误配对展示后翻回，并在动画期间锁定输入。

每次选择保存墙钟 `timestamp`、单调任务相对 `elapsedMs`、位置、卡片/配对 ID、是否首选和匹配状态；每次尝试保存两张卡、起止时间、响应时间和匹配结果。结果的 `schemaVersion=2`，`taskVersion=spatial-memory-matching-4x4-v1`。

派生指标包括准确率、每对移动次数、反应时分布、前后半程准确率/错误率/平均反应时，以及：

```text
memoryScore = accuracy × 100
responseSpeedScoreRaw = 100 - meanResponseTime / 30
cognitiveStabilityScoreRaw = 100
  - max(0, reactionTimeChange) × 50
  - max(0, errorRateChange) × 100
```

展示分数会限制在 0–100，原始公式结果仍被保存。上述指标仅描述该任务表现。

### 5.4 Star Catcher 标准化追踪

虽然导航项仍称 Star Catcher，当前实现是固定 25 秒的李萨如目标追踪任务：

- 黄色目标以固定方程运动，红色中心圆为固定 No-Go 区。
- Canvas 指针移动时保存每个原始点：指针坐标、墙钟时间、同一时刻目标坐标、No-Go 状态。
- 输出追踪 RMSE、在靶比例、在 ±600 ms（40 ms 步长）搜索的相位滞后、No-Go 进入次数和停留时间。
- 标准化得分为 `max(0, 100 - RMSE - 10 × noGoEntries)`，但主要研究导出应使用原始轨迹与明确的派生指标，而非旧的“捕星分数”兼容字段。

该任务不写入主评测会话，也不进入疲劳指数；它独立保存、同步和导出。

## 6. 本地数据与存储配额

浏览器使用 LocalStorage，不使用 IndexedDB 或 Service Worker。主要键如下：

| 键 | 内容 |
| --- | --- |
| `finefatigue_sessions_v1` | 主评测会话，含基线/复测及其原始数组。 |
| `finefatigue_subjective_v1` | 独立主观自评记录。 |
| `finefatigue_cognition_memory_v1` | 认知结果、逐选择与逐尝试数组。 |
| `finefatigue_games_v2` | 追踪任务结果和逐点路径。 |
| `finefatigue_settings_v1` | 本机设置。 |
| `finefatigue_active_report_v1` | 当前报告副本。 |
| `finefatigue_auth_v2` | 当前用户资料和 Bearer token。 |
| `finefatigue_sync_manifest_v1` | 按受试者 ID 保存的已确认记录 ID。 |
| `finefatigue_cloud_sync_state_v1`、`finefatigue_device_id_v1` | 同步状态与本机标识。 |

会话、主观自评、认知和游戏写入会将浏览器配额异常封装/上抛；界面可提示先导出原始 JSON、清理旧站点数据后重试。`resetAllData()` 会清除主会话、自评、当前报告和游戏记录；认知记录由 `CognitionStorage.clearResults()` 单独清除。清除浏览器数据不是删除服务端数据。

## 7. 认证、同步与服务端持久化

### 7.1 账户与会话

- 受试者用标识符和至少 8 位密码注册；标识符标准化后产生稳定 `USR-...` ID。
- 密码使用 Node `crypto.scryptSync` 加随机 16-byte hex salt 存为 `{salt, hash}`；明文不写服务端 JSON。
- 新账户默认 `pending`，管理员改为 `active` 后才能登录；`disabled` 用户不能继续同步。
- 管理员账号由 `.env` 的 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 提供。管理员密码在当前实现中直接从环境变量比较，部署时必须保护 `.env`。
- 成功登录后，服务端创建 32-byte base64url token，保存于进程内 `Map`，有效期 12 小时。浏览器将 token 放进 LocalStorage，后续请求以 `Authorization: Bearer <token>` 发送。
- 服务重启会清空所有 token；用户需要重新登录。该 token 不是 JWT，没有跨进程共享、撤销列表、刷新机制或登录限流。

### 7.2 同步语义

登录受试者完成记录后调用 `markPending()`，2.5 秒后尝试同步；失败会保留本机数据并最多指数退避重试 3 次（2.5、5、10 秒），浏览器恢复在线时再次尝试。

同步流程：

1. 读取当前用户的同步清单；首次没有清单时，所有本机记录均为待上传。
2. `POST /api/sync` 只发送未确认 ID 的 sessions、subjective、cognition、games；设置每次会一并发送。
3. 服务端按记录 ID 合并并返回该账户的完整数据集。
4. 浏览器覆盖/合并本地集，并把服务端返回的 ID 写入该受试者同步清单。

服务端碰到同一 ID、但 JSON 内容不同的记录时，时间戳较新的版本保留原 ID，另一版本生成 `<原ID>-CONFLICT-<sha256前10位>` 副本。这个策略避免静默丢记录，但不提供人工冲突审计界面、记录级编辑或删除语义。

服务端将整个账户对象保存在 `data/finefatigue-store.json`，写入采用“写 `.tmp` 后 rename”的单文件替换方式。它不具备数据库事务、加密、文件锁或多实例并发控制；**绝不能让多个服务进程共享该文件**。备份应在停止服务后复制该 JSON，并按研究数据保护要求限制系统权限。

## 8. API 参考

所有 API 均为同源 JSON，除 CSV 外。需要认证的端点使用 `Authorization: Bearer <token>`。

| 方法与路径 | 认证 | 实现用途 |
| --- | --- | --- |
| `GET /api/health` | 无 | 服务存活检查。 |
| `POST /api/auth/login` | 无 | `mode=login` 登录，`mode=register` 注册待审核受试者。 |
| `GET /api/auth/me` | 登录 | 验证并恢复当前会话。 |
| `POST /api/auth/logout` | 登录 | 移除当前内存 token。 |
| `POST /api/sync` | 受试者 | 合并并返回 sessions、subjective、cognition、games、settings。 |
| `GET /api/admin/accounts` | 管理员 | 返回账户状态、各类记录计数与报酬信息。 |
| `PATCH /api/admin/accounts/:id` | 管理员 | 修改账号状态、报酬、备注或重置密码。 |
| `GET /api/admin/export/sessions.csv` | 管理员 | 主会话的派生指标长宽混合汇总。 |
| `GET /api/admin/export/raw.csv` | 管理员 | 主评测 IMU、敲击、反应、描摹、频谱的长表原始数据。 |
| `GET /api/admin/export/users.csv` | 管理员 | 账户状态、次数、报酬字段。 |
| `GET /api/admin/export/cognition.csv` | 管理员 | 认知任务汇总指标。 |
| `GET /api/admin/export/cognition-raw.csv` | 管理员 | 认知逐选择与逐尝试长表。 |
| `GET /api/admin/export/games.csv` | 管理员 | 追踪逐点路径和任务级指标。 |
| `POST /api/ai/motivation` | 当前未加认证 | 调用可选 MiMo 生成非诊断性恢复建议。 |

当前请求体大小上限为 2 MB。长 IMU/轨迹记录、多会话首次同步或大型导入可能超过这一上限，届时会失败且保留本地记录；这是现有部署限制，应在扩大采集量前评估。

## 9. CSV 数据说明

- CSV 以 UTF-8 BOM 返回，便于常见中文表格软件直接打开。
- 使用受试者编号而非明文密码，但该编号仍可识别研究对象；导出属于受控研究数据。
- `raw.csv` 的 `record_type` 为 `imu`、`tap`、`reaction`、`trace` 或 `spectrum`；不适用字段留空。每一行有 `participant_code`、`session_id`、`phase`、`record_index`，反应记录包含 `is_early`。
- `cognition-raw.csv` 的 `record_type` 为 `selection` 或 `attempt`；保存 schema/task version 和墙钟/相对时间。
- `games.csv` 每个指针点一行，并重复该任务的 RMSE、在靶比例、相位滞后和 No-Go 汇总字段，方便无需 join 的轨迹分析。

导出没有去标识化流水线、访问审计、字段选择或加密压缩。研究人员应自行建立数据版本、导出审批、访问控制和脱敏流程。

## 10. AI 建议实现

`POST /api/ai/motivation` 使用 `MIMO_API_KEY` 调用 `MIMO_BASE_URL/chat/completions`，默认模型为 `mimo-v2.5-pro`，要求返回固定 JSON 结构。服务端只把客观疲劳值、主观评分、语言和等级作为提示输入，并明确要求非诊断性文案。

没有 API Key、上游异常或返回格式不符时，服务端返回错误；前端预期使用本地规则引擎作为降级。当前应将远程建议视为可选体验，而不是实验采集的依赖项。维护者还应注意：前端 `aiMotivationService` 的字段映射曾与服务端 `{ message: ... }` 响应存在不一致风险，变更该接口时必须做端到端验证。

## 11. 配置、启动与部署

### 11.1 环境变量

复制 `.env.example` 为 `.env` 并填写真实值。`.env*` 与 `data/` 被 `.gitignore` 排除；不得提交、截图或发送真实密码/令牌/密钥。

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `ADMIN_USERNAME` | 无安全默认值 | 管理员登录名。 |
| `ADMIN_PASSWORD` | 无安全默认值 | 管理员密码。 |
| `MIMO_API_KEY` | 无 | MiMo 服务端密钥；未设置时 AI API 返回 503。 |
| `MIMO_BASE_URL` | `https://api.xiaomimimo.com/v1` | MiMo OpenAI 兼容 API 基地址。 |
| `MIMO_MODEL` | `mimo-v2.5-pro` | MiMo 模型名。 |
| `PORT` | `3000` | Express 监听端口。 |

修改 `.env` 后需要重启 `npm start`。

### 11.2 常用命令

```bash
npm install
npm run lint       # tsc --noEmit
npm run build      # Vite 生产构建到 dist/
npm run build:demo # Vite Demo 构建，base=/FineFatigue/
npm start          # Express：静态文件 + API
npm run dev        # 仅 Vite 前端开发服务器
npm run preview    # Vite 构建预览；不提供 API
npm run preview:demo # Demo 子路径静态预览
```

建议部署顺序：配置 `.env` → `npm install` → `npm run lint` → `npm run build` → `npm start` → 用 `GET /api/health` 验证 → 设置/检查 Tailscale Serve 指向 `127.0.0.1:<PORT>` → 用真实手机在 HTTPS 地址完成授权与采样验收。

## 12. 验证与维护检查清单

每次改动后，至少执行：

```bash
npm run lint
npm run build
node --check server.mjs
git diff --check
git status --short
```

与 IMU 相关的改动必须在目标手机、目标浏览器、实际 Tailscale HTTPS 地址上人工验证：允许权限后包计数增长、移动时波形变化、校准通过、稳定性记录实际样本数/采样率正确；无权限或无事件时必须显示不可用而不是填充数据。

与数据链路相关的改动至少验证：注册→管理员批准→登录→完成一条记录→同步→管理员导出 CSV；再验证第二次同步只上传新记录，以及同 ID 且内容不同的服务器冲突副本行为。不要将真实实验数据、`.env` 或 `data/finefatigue-store.json` 加入 Git。

## 13. 已知限制与后续维护重点

1. **数据可靠性不等于实验效度。** 代码记录真实浏览器事件与原始数组，但采样率、设备方向、传感器质量、触控延迟和环境条件尚未标准化或自动审计。
2. **主评分仍是启发式规则。** 疲劳指数、稳定性/描摹限制和认知展示分数没有在代码中附带效度、重复性或常模证据。
3. **单机 JSON 存储。** 没有数据库、迁移、加密、备份自动化、并发控制、服务端删除、审计日志或灾难恢复。
4. **同步删除不传播。** 浏览器删除本地记录后，下次同步可能从服务器重新合并回来；需要真正删除时，必须新增受控服务端删除 API、权限与审计设计。
5. **同步清单不可恢复语义有限。** 清除 LocalStorage 会丢失已确认 ID，下一次会重新上传本机剩余记录；服务端合并会去重，但不应把它视为完整备份策略。
6. **API 请求限制。** 当前 JSON body 限制 2 MB，长时高频 IMU 或大量历史首次同步需要分批协议或改用文件/对象存储。
7. **认证安全基础。** 会话在内存中、无 HTTPS 之外的额外传输保护、无 CSRF/限流/密码找回/管理员审计；使用 Tailscale 仅降低网络暴露，不替代安全设计。
8. **AI 不是关键路径。** MiMo 调用无队列、限流、监测或持久化；它不能影响实验分数，也不能输出诊断。
9. **前端包提示。** 当前生产 JavaScript 压缩后约超过 Vite 500 kB 提示阈值；构建成功，但后续可按实际加载性能决定是否代码分割。

维护任何数据结构时，优先保持旧字段兼容、增加 `schemaVersion`/`taskVersion`、更新 CSV 与本文档，并在小规模真实设备试运行后再用于正式采集。
