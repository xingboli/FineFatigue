# Data Specification

本文档以当前 TypeScript 类型、存储服务和 Express CSV 接口为事实来源。字段含义优先服从代码；“建议”部分不是当前已实现字段。

## 1. Data hierarchy

```text
Participant
└─ Session
   ├─ Assessment phase: baseline / post-fatigue
   │  └─ Task: calibration, stability, tapping, reaction, tracing
   ├─ Fatigue challenge
   └─ Subjective rating

Independent task stores
├─ Cognition memory result
└─ Star Catcher result
```

Participant 是账户或受试者标识；Session 是一次完整评测报告；phase 区分负荷前后；task 保存原始事件和派生指标。Cognition 与 Star Catcher 当前独立保存，不自动并入主报告。

## 2. Time and provenance

除明确标注外，`timestamp`、`startedAt`、`completedAt` 和 tap/pointer 时间戳都是 `Date.now()` 的 Unix epoch milliseconds（墙上时钟）。相邻 IMU 事件的间隔用于估计实际采样率；代码不承诺固定硬件采样率。

Cognition 同时使用 `performance.now()` 记录单调递增的 `elapsedMs`，用于反应时和阶段切分；`Date.now()` 只用于持久化事件时间。实验分析应优先用 elapsed 字段计算时长，避免墙上时钟调整造成偏差。Tracing 和 Star Catcher 的点时间戳是墙上时钟，任务 elapsed 由组件运行时计算。

当前持久化结果没有统一的 `runtimeMode`、设备、浏览器、协议版本或应用 Git commit 字段。研究采集时应在外部记录这些 provenance；未来可增加显式元数据，但不能把建议字段误写成当前 schema。

## 3. IMU and calibration

### `IMUDataPoint`

| Field | Type | Unit | Origin | Kind | Description |
|---|---|---|---|---|---|
| `timestamp` | number | epoch ms | DeviceMotion event | raw event | Browser event time |
| `ax`, `ay`, `az` | number | g | accelerationIncludingGravity, fallback acceleration | raw event | Linear axes including gravity when available |
| `gx`, `gy`, `gz` | number | deg/s | rotationRate alpha/beta/gamma | raw event | Missing rotation values become 0 |

`RealHardwareSensorAdapter` converts m/s² to g with 9.80665 and does not synthesize samples when the device is unavailable. Calibration 在内存中记录 `gravityVector`、`sampleCount`、`measuredSamplingRate`、`startedAt`、`completedAt`，但当前不会嵌入保存的 `AssessmentReportData`。

### `SensorStatus`

`connected`、`type`（`real` 或 `simulator`）、`samplingRate`、`packetsReceived`、`latencyMs`、可选 `calibrated`、`supported`、`permission` 描述连接状态。当前 App 使用真实适配器；仓库中的 `sensorSimulator.ts` 未被当前 App 引用，不能当作受支持的研究输入源。

## 4. Stability

`StabilityMetrics` 的实际字段包括：

| Field | Unit | Kind | Description |
|---|---|---|---|
| `motionRMS`, `motionRMSRaw` | g | derived | 去重力后三轴运动幅度；Raw 保留未裁剪值 |
| `dominantFrequency` | Hz | derived | 0–12 Hz 扫描的主频 |
| `totalPower0_12Hz` | relative power | derived | 0–12 Hz 频带功率 |
| `spectralEntropy`, `spectralEntropyRaw` | normalized | derived | 频谱熵；Raw 为未展示裁剪值 |
| `stabilityScore`, `stabilityScoreRaw` | 0–100 / raw | derived/display | 原始分数由运动 RMS 和熵计算，展示分数裁剪到 0–100 |
| `measuredSamplingRate` | Hz | derived | 由真实事件间隔估计 |
| `spectrum[]` | `{freq, power}[]` | derived | 分析频谱 |
| `waveforms[]` | axis samples | derived | 分析用波形 |

算法从校准重力或样本均值估计重力，扣除重力后分析三轴中心化数据；研究报告应同时保存 raw 和 display 字段。

## 5. Tapping

### `TapRecord`

| Field | Type | Unit | Description |
|---|---|---|---|
| `timestamp` | number | epoch ms | Tap wall-clock time |
| `target` | `left \| right` | — | 目标侧 |
| `interval` | number | ms | 与前一次 tap 的间隔 |
| `timeFromStart` | number | ms | 相对任务开始时间 |

### `TappingMetrics`

包括 `totalTaps`、`tapRate`、`meanITI`、`rhythmCV`、`first5sRate`、`middle5sRate`、`last5sRate`、`performanceDecrement` 和完整 `taps[]`。有效 ITI 为大于 40 ms 且小于 2000 ms；实际录制时长被切成三个等长区间。三个字段名是历史命名，不能据此声称固定 5 s 分段。

## 6. Reaction

`ReactionTrial` 字段为 `trialNumber`、`timestamp`（epoch ms）、`reactionTimeMs`、`isEarly`。提前点击被记为 `isEarly=true`、反应时 0，并重复该 trial，不计为有效试次；Full 需 30 个有效试次，Demo 需 5 个。

`ReactionMetrics` 保存 `trials`、`meanReactionMs`、`medianReactionMs`、`bestReactionMs`、`worstReactionMs`、`missRate`、`lapseCount`、`meanReciprocalReaction`。当前 `missRate` 定义为提前试次数除以全部试次，`lapseCount` 是有效反应时大于等于 500 ms 的数量。

## 7. Spiral tracing and challenge

`TracingMetrics` 保存 `pathRMSE`（px）、`meanSpeed`、`smoothness`、`pauseCount`、`pathInterruptions`、`userPoints[]`、`templatePoints[]`。用户轨迹点为 `{x,y,timestamp,pressure?}`；完成条件包括单笔、点数大于 15、覆盖率至少 90%、靠近中心等几何检查。RMSE 和 smoothness 的展示值有裁剪，原始轨迹才是复核依据。该任务没有固定时长。

疲劳挑战保存实际挑战时长和 `challengeTaps`；Full 为 30/60 s，Demo 为 10/20 s。代码不硬拒绝非交替点击。

## 8. Main assessment report

`AssessmentReportData` 字段：`id`、`subjectId`、`timestamp`、`dateString`、`fatigueIndex`、`fatigueLevel`、`dimensions`（`handStability`、`reactionAbility`、`motorEndurance`、`fineMotorControl`）、`baseline`、`postFatigue`、`challengeDurationSec`、`challengeTaps`、可选 `subjectiveFatigue`。

四维权重为稳定性 25%、运动耐力 30%、反应 20%、精细运动 25%；综合分和等级是工程规则，主观评分不进入客观疲劳指数。评测向导顺序见 `EXPERIMENT_PROTOCOL.md`。

## 9. Subjective fatigue

`SubjectiveFatigueRecord` 为 `id`、`timestamp`、`rating`（1–10）、`level`、`sensations`、可选 `note`（最多 150 字符）和可选 `linkedSessionId`。它同时写入 Session 相关数据和独立主观记录；它不是 IMU 或行为指标。

## 10. Cognition memory

`CognitionMemoryResult` 当前 `schemaVersion=2`，`taskVersion=spatial-memory-matching-4x4-v1`。它保存 ISO `timestamp`、`startedAt`、`completedAt`、`totalDuration`、配对/尝试计数、accuracy、movesPerPair、响应时间统计、前后半段 accuracy/errorRate/meanRT、变化量、memory/response-speed/cognitive-stability 分数，以及 `interactions[]` 和 `attempts[]`。

`MemoryInteractionEvent` 同时有墙上时钟 `timestamp` 和单调 `elapsedMs`，另有 `interactionIndex`、card/pair/attempt/position、首次选择和 matched。`MemoryAttempt` 记录卡片/配对、墙上时钟开始结束、elapsed 开始结束、`responseTimeMs` 和 `matched`。8 个符号组成 16 张卡/8 对，实际点击决定结果；随机布局使每次测试顺序不同。

## 11. Star Catcher

`StarCatcherResult` 当前 `taskVersion=lissajous-tracking-v3`，保存 `score`、`combo`、`starsCollected`、`totalStars`、`hitRate`、`averageReactionMs`、`controlAccuracy`、`movementSmoothness`、`fineMotorScore`、`durationSec`、`trackingRMSEPx`、`onTargetPercent`、`phaseLagMs`、`noGoEntries`、`noGoDwellMs` 和 `path[]`。

`path[]` 每点为 `{x,y,timestamp,targetX,targetY,inNoGo}`，约 30 Hz 采样，包含指针停留期间的样本。`inNoGo`、`noGoEntries` 和 `noGoDwellMs` 仅保留旧数据结构兼容性；当前任务没有禁区，分别固定为 `false`、`0`、`0`。Star Catcher 当前独立保存、同步和导出，不进入 `AssessmentReportData` 或四维疲劳指数。

## 12. Storage and server representation

浏览器本地存储键：

| Key | Content |
|---|---|
| `finefatigue_sessions_v1` | 主评测会话/报告 |
| `finefatigue_settings_v1` | 用户设置；resetAllData 不删除 |
| `finefatigue_active_report_v1` | 当前活动报告 |
| `finefatigue_subjective_v1` | 主观疲劳记录 |
| `finefatigue_games_v2` | 游戏结果，包括独立任务数据 |
| `finefatigue_cognition_memory_v1` | 完整认知记忆结果 |

认证/同步相关键还包括 `finefatigue_auth_v2`、`finefatigue_cloud_sync_state_v1`、`finefatigue_device_id_v1`、`finefatigue_sync_manifest_v1`。Full 服务端使用 `data/finefatigue-store.json`，包含账户、会话、认知和游戏等集合；服务端 CSV 路由提供 sessions、raw、users、cognition、cognition-raw、games 导出。具体 CSV 列以 `server.mjs` 的生成函数为准，新增字段必须同步更新导出与本文件。

同步请求包含认证 token 和客户端数据集合/manifest；服务端按当前实现合并并返回同步状态。当前没有数据库事务、字段迁移或加密 at rest。

### 12.1 Full server account shape

服务端顶层结构为 `{ accounts: { [accountId]: account } }`。每个 account 当前包含：

| Group | Fields |
|---|---|
| `user` | `id`, `name`, `email`, `role`, `participantCode`, `avatar`, `lastLogin`, private `loginKey` |
| credentials | `password.salt`, `password.hash`；不应导出给客户端 |
| collections | `sessions[]`, `subjective[]`, `cognition[]`, `games[]` |
| settings | `settings` object |
| study/admin | `compensation.amount`, `compensation.note`, `compensation.status`, `status`, `createdAt`, `updatedAt` |

`accountPayload` 返回公开 user profile、四类数据集合、settings 和 `syncedAt`，不会返回 password 记录。管理员账户由环境变量创建的内存 profile 表示，不作为 participant account 写入同一结构。

### 12.2 Current CSV columns

以下是 `server.mjs` 当前导出路由的列顺序：

- `sessions.csv`：`participant_code`, `session_id`, `timestamp`, `fatigue_index`, `fatigue_level`, `challenge_duration_sec`, `challenge_taps`, `baseline_stability_score`, `post_stability_score`, `baseline_motion_rms_g`, `post_motion_rms_g`, `baseline_tap_rate_hz`, `post_tap_rate_hz`, `baseline_reaction_median_ms`, `post_reaction_median_ms`, `baseline_tracing_rmse_px`, `post_tracing_rmse_px`, `subjective_rating`, `subjective_level`, `subjective_sensations`, `subjective_note`。
- `raw.csv`：`participant_code`, `session_id`, `phase`, `record_type`, `record_index`, `timestamp`, `ax`, `ay`, `az`, `gx`, `gy`, `gz`, `target`, `interval_ms`, `time_from_start_ms`, `trial_number`, `reaction_time_ms`, `is_early`, `x`, `y`, `pressure`, `frequency_hz`, `power`；`record_type` 为 `imu`、`tap`、`reaction`、`trace` 或 `spectrum`。
- `users.csv`：`participant_code`, `status`, `experiment_count`, `subjective_count`, `cognition_test_count`, `tracking_test_count`, `compensation_amount`, `compensation_status`, `compensation_note`, `created_at`, `last_login`。
- `cognition.csv`：`participant_code`, `cognition_session_id`, `timestamp`, `total_duration_ms`, `total_pairs`, `total_attempts`, `correct_attempts`, `incorrect_attempts`, `accuracy`, `mean_response_time_ms`, `median_response_time_ms`, `moves_per_pair`, `first_half_accuracy`, `second_half_accuracy`, `first_half_mean_rt_ms`, `second_half_mean_rt_ms`, `reaction_time_change`, `error_rate_change`, `memory_score`, `response_speed_score_raw`, `response_speed_score`, `cognitive_stability_score_raw`, `cognitive_stability_score`。
- `cognition-raw.csv`：包含 `participant_code`, `cognition_session_id`, `schema_version`, `task_version`, `record_type`, `record_index`，以及 selection/attempt 对应的卡片、配对、位置、时间、匹配和响应字段。
- `games.csv`：`participant_code`, `game_id`, `timestamp`, `point_index`, `x`, `y`, `target_x`, `target_y`, `in_no_go`, `tracking_rmse_px`, `on_target_percent`, `phase_lag_ms`, `no_go_entries`, `no_go_dwell_ms`。

CSV 是当前导出接口的扁平化视图；原始 JSON 数组和嵌套对象仍应以本地/服务端 JSON 为复核源。
