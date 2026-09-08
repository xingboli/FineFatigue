# Reproducibility and Provenance

FineFatigue 当前是一个数据采集与结果表达应用，不是带有训练/测试拆分和统计推断流水线的机器学习仓库。本文件规定如何复现软件运行、采集条件和后续分析边界。

## 1. Reproduction goals

需要区分三种复现目标：

1. **软件复现**：同一 commit、lockfile 和运行画像能构建并启动相同应用。
2. **采集复现**：同一 Full 协议、任务顺序、时长和设备记录能产生可比较的原始事件。
3. **分析复现**：外部统计脚本以固定输入、清晰排除规则和预注册模型生成表格/图形。

仓库直接支持前两类；当前没有内置的训练、数据拆分、随机种子管理或显著性检验流水线。

## 2. Required provenance record

每次研究采集至少保存以下信息：

| Item | Current status | Requirement |
|---|---|---|
| Git commit | 不写入每条结果 | 采集日志必须记录 |
| Package version | 当前 `package.json` 为 `0.0.0` | 记录实际 package version |
| Runtime mode | 当前 schema 不统一保存 | 必须外部记录 `full`/`demo` |
| Protocol version | 当前无统一字段 | 记录协议文档版本/日期 |
| Schema/task version | Cognition 和 Star 有 taskVersion；主评测无统一字段 | 逐任务记录 |
| Date/time | 各结果保存 timestamp | 同步记录时区和采集批次 |
| Device/OS/browser | 当前结果不统一保存 | 外部采集表记录型号、系统、浏览器版本 |
| Hand/posture/environment | 当前代码不强制 | 按研究协议记录并标注偏离 |

“当前未保存”意味着需要在实验记录中补齐，不意味着可以从结果文件中推断。

## 3. Software reproduction

事实来源和冻结顺序：

1. `package.json`：脚本、依赖入口和当前版本。
2. `package-lock.json`：依赖解析版本。
3. `src/config/runtime.ts`：Demo/Full 时长与试次数。
4. `src/types/index.ts`、storage/service 文件：数据结构和持久化行为。
5. `docs/EXPERIMENT_PROTOCOL.md`：正式采集顺序与有效性规则。

推荐使用 Node.js 18+（README 的项目要求），在目标 commit 上执行：

```powershell
npm ci
npm run lint
npm run build
npm run build:demo
node --check server.mjs
```

Full 用 `npm start`，Demo 用 `npm run preview:demo`。部署者应记录命令、Node/npm 版本、退出码、构建警告和浏览器访问结果。

## 4. Collection pipeline mapping

| Stage | Implementation source | Input | Output |
|---|---|---|---|
| Runtime selection | `src/config/runtime.ts` | `VITE_DEMO_MODE` | mode-specific parameters |
| Sensor permission/stream | `src/services/sensorAdapter.ts` | DeviceMotion | real IMU events/status |
| Calibration | `CalibrationStep.tsx` | IMU events | in-memory gravity/calibration |
| Stability | `HandStabilityStep.tsx`, `signalProcessing.ts` | calibrated IMU stream | raw/derived stability metrics |
| Tapping | `FingerTappingStep.tsx`, `tappingAnalysis.ts` | tap events | tap records and rates |
| Reaction | `ReactionStep.tsx` | click timestamps/trial state | reaction trials/metrics |
| Tracing | `SpiralTracingStep.tsx`, canvas, tracing analysis | pointer path | tracing metrics |
| Challenge | `FatigueChallengeStep.tsx` | actual taps/time | challenge duration/taps |
| Report | `fatigueScoring.ts` | baseline/post metrics | dimensions/index/level |
| Cognition | `MemoryGame`, `CognitionStorage` | real card clicks | schema v2 memory result |
| Star Catcher | `StarCatcherGame.tsx` | pointer path/target | task-versioned game result |
| Persistence | `src/services/storage.ts` and cloud services | completed records | localStorage or Full sync |

## 5. External analysis boundary

仓库没有训练集/测试集拆分、受试者级交叉验证、重复随机种子、样本量计算、缺失值策略、统计模型或置信区间实现。任何论文或报告都必须在仓库外冻结：纳入/排除标准、受试者级 split、预处理、主要终点、效应量、统计检验、多重比较和敏感性分析。不能把应用中的疲劳指数直接当作已验证分类器。

## 6. Versioning checklist

在一次可发布采集前记录：

- Git commit 和工作树是否干净；
- `package-lock.json` 是否与 `npm ci` 一致；
- Full/Demo runtime 参数快照；
- 协议版本和数据字典版本；
- 浏览器、设备、OS、权限和 HTTPS 条件；
- 是否使用本地保存或服务器同步；
- 数据导出日期、文件校验值和去标识化状态；
- 任何手动重试、无效段、退出或设备切换。
