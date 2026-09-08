# Testing and Acceptance

本文档记录 FineFatigue 的可重复验证入口、验收范围和当前证据状态。状态只使用以下含义：

- `PASS`：本次已执行并观察到预期结果。
- `FAIL`：本次已执行且结果不符合预期。
- `NOT RUN`：计划存在，但本次未执行。
- `NOT VERIFIED`：已有代码或静态证据，但尚未完成所需运行/人工验证。
- `BLOCKED`：因明确的环境、权限或设备条件无法执行。

## 1. 测试边界

仓库没有 `npm test` 脚本，也没有可声称覆盖全部业务逻辑的正式单元测试套件。下面的检查覆盖构建、静态服务、Full API 健康检查和人工验收清单；不能把它们表述为完整的临床、跨设备或统计验证。

## 2. 可重复命令

在仓库根目录执行：

```powershell
npm ci
npm run lint
npm run build
npm run build:demo
node --check server.mjs
git diff --check
```

`npm run dev` 只启动 Vite 前端开发服务，不提供 Full Mode 的 Express API。Full Mode 使用：

```powershell
npm start
```

Demo 静态预览使用：

```powershell
npm run preview:demo
```

## 3. 构建与服务验收

本次收尾检查记录日期为 2026-09-08。`npm ci` 输出了 npm 对 esbuild install script 的待审核提示，但命令成功退出；Full/Demo 构建均有非阻塞的主 bundle 大于 500 kB 警告。

| 检查 | 预期 | 当前记录 |
|---|---|---|
| `npm ci` | 按 lockfile 安装依赖成功 | `PASS` |
| `npm run lint` | TypeScript 检查退出码为 0 | `PASS` |
| `npm run build` | Full 构建成功 | `PASS` |
| `npm run build:demo` | Demo 构建成功，产物使用 `/FineFatigue/` base | `PASS` |
| `node --check server.mjs` | 服务端语法检查成功 | `PASS` |
| `git diff --check` | 无空白错误 | `PASS` |
| Demo preview | `/FineFatigue/` 入口、资源和未知前端路径回退均成功 | `PASS`（HTTP smoke check） |
| Demo `/api/health` | 静态预览不提供 API；返回 404 属于预期隔离 | `PASS` |
| Full `/api/health` | Express 返回健康状态 | `PASS` |
| Full root/fallback | 根页面和未知前端路径均返回 SPA | `PASS` |

GitHub Pages 还需区分三层证据：本地 `build:demo`、GitHub Actions 的构建/部署 job、线上 `https://xingboli.github.io/FineFatigue/` 的浏览器访问。任一层通过都不能替代另外两层。

## 4. Demo 人工验收清单

以下检查应在桌面浏览器和至少一个可用移动浏览器各执行一次；当前没有把未执行项目标成通过：

| 项目 | 预期 | 状态 |
|---|---|---|
| 访问 `/FineFatigue/` | 首屏可加载 | `NOT VERIFIED` |
| 刷新和前端深链接 | 页面不白屏，静态服务回退到入口页 | `NOT VERIFIED` |
| 资产路径 | JS/CSS 使用 `/FineFatigue/` 前缀且加载成功 | `NOT VERIFIED` |
| 真实 IMU | 支持设备并授权时读取真实 DeviceMotion；不支持/拒绝时明确提示 | `NOT VERIFIED` |
| 无伪造 IMU | 不以模拟数据替代真实传感器 | `NOT VERIFIED` |
| Demo 身份与权限 UI | 不显示真实登录/云同步/API 依赖；可切换受试者和管理员演示视图，示例数据只读 | `NOT VERIFIED` |
| Demo 示例数据 | 受试者显示静态历史与认知样例；管理员显示账户摘要；样例不写入 LocalStorage、同步或导出 | `NOT VERIFIED` |
| Demo 任务 | 任务顺序和缩短时长与运行配置一致 | `NOT VERIFIED` |
| 本地存储 | 结果可在同一浏览器本地保存和读取 | `NOT VERIFIED` |
| 清理行为 | 清除站点数据后本地记录消失；设置键按实现保留规则处理 | `NOT VERIFIED` |

## 5. Full 功能矩阵

| 区域 | 应验证的行为 | 当前状态 |
|---|---|---|
| 认证 | 注册、待审核、登录、登出、当前用户、错误凭据 | `NOT VERIFIED` |
| 同步 | 认证后上传/合并/读取会话和游戏数据 | `NOT VERIFIED` |
| 管理 | 管理员登录、账户列表/审核、CSV 导出、权限拒绝 | `NOT VERIFIED` |
| AI motivation | 本地规则；Full 可请求 `/api/ai/motivation` 并处理失败 | `NOT VERIFIED` |
| 文件存储 | 写入、重启后读取、并发/异常写入行为 | `NOT VERIFIED` |

## 6. 任务级人工矩阵

每个任务至少检查正常完成、退出/取消、刷新、低质量输入、存储失败、窄屏/移动布局。当前代码审计确认了入口和无效输入规则，但本次未完成全量人工矩阵，因此统一记录为 `NOT VERIFIED`。

| 任务 | 正常 | 取消/退出 | 刷新 | 无效输入 | 存储异常 | 移动布局 |
|---|---|---|---|---|---|---|
| Calibration | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` |
| Hand Stability | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` |
| Finger Tapping | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` |
| Reaction | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` |
| Spiral Tracing | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` |
| Fatigue Challenge | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` |
| Subjective Rating | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` |
| Cognition Memory | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` |
| Star Catcher | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` | `NOT VERIFIED` |

Star Catcher 的人工验收还应检查：任务期间不展示完整未来目标路径；指针静止时路径样本仍随固定频率增长；结束后再显示完整目标/实际双轨迹；旧 No-Go 字段不出现在 UI。

## 7. 设备与浏览器矩阵

| 环境 | 普通 UI | IMU 输入 | 备注 |
|---|---|---|---|
| Windows + Chrome | `NOT VERIFIED` | `NOT VERIFIED` / 通常不适用 | 可用于静态流程和 Full API 检查 |
| Android + Chrome | `NOT VERIFIED` | `NOT VERIFIED` | 需 HTTPS、权限和真实 DeviceMotion |
| iOS + Safari | `NOT VERIFIED` | `NOT VERIFIED` | 需用户手势触发权限请求；需单独检查 |

## 8. 已知检查项

前端 `aiMotivationService` 期望扁平的 `title/message/action/fallback` 字段，而 `server.mjs` 当前返回 `{ message: { ... } }` 包装对象。该接口映射问题属于已知 TODO，本次文档收尾不改变业务逻辑；Full AI 功能在修复并回归前不能标为 `PASS`。
