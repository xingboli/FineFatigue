# Experiment Protocol

本协议用于 Full / Research Mode 的可重复采集。Online Demo 是缩短参数的公开演示，不应作为本协议的等价执行。

## 1. Scope and preparation

### 1.1 Required conditions

- 使用支持浏览器 DeviceMotion 的真实移动设备和受支持浏览器；桌面浏览器可用于 UI/API 检查，但通常不具备所需 IMU 输入。
- 使用 HTTPS 或受信任的安全上下文，按浏览器提示授予运动传感器权限。
- 为受试者准备唯一 `subjectId`；Full 同步场景还需要参与者账户和网络连接。离线本地保存不要求网络。
- 记录实验日期、设备型号、操作系统、浏览器版本、App Git commit、运行模式和协议版本。

### 1.2 Not standardized by current code

当前代码没有强制规定环境噪声、手机型号、优势手、桌面高度、坐姿、握持方式、年龄范围、室温或省电状态。研究者应把这些作为协议变量或限制条件记录，不能把代码默认行为写成已标准化实验条件。正式研究建议固定设备/手别/姿势/环境，并在采集表中记录偏离。

## 2. Full runtime parameters

| Item | Full / Research |
|---|---:|
| Calibration | 3 s |
| Stability baseline / post | 15 s each |
| Tapping baseline / post | 15 s each |
| Reaction | 30 valid trials; random wait 2–10 s |
| Fatigue challenge | 30 s or 60 s |
| Star Catcher | 25 s |

疲劳挑战的 30/60 s 选项来自运行配置；报告保存实际 `challengeDurationSec` 和实际点击数。

## 3. Fixed assessment order

评测向导按以下顺序执行：

1. Calibration
2. Baseline Hand Stability
3. Baseline Finger Tapping
4. Baseline Reaction
5. Baseline Spiral Tracing
6. Fatigue Challenge
7. Post-fatigue Hand Stability
8. Post-fatigue Finger Tapping
9. Post-fatigue Reaction
10. Post-fatigue Spiral Tracing
11. Subjective Rating
12. Report

不能跳过基线/后测配对，也不能把 Cognition 或 Star Catcher 结果当作主评测四维报告的一部分；它们是独立任务。

## 4. Task procedures

### 4.1 Calibration

目的：估计静止设备/手部的重力向量和实际采样率。Full 采集 3 s；需要至少 30 个真实 IMU 样本，否则校准结果丢弃。保持设备和手部尽量稳定，开始后等待完成。结果仅在当前评测内存中使用，当前报告不保存完整 calibration 对象。

### 4.2 Hand Stability

目的：测量去重力后的三轴微动和频谱特征。Full 基线和后测各 15 s，开始前有 3-2-1 倒计时；每段至少需要 30 个样本，否则该段丢弃。设备/手持姿势、优势手和支撑方式由研究协议固定并记录，当前应用不强制规定。输出包括 raw RMS、频谱、熵、采样率和展示分数。

### 4.3 Finger Tapping

目的：测量重复运动速度、节律和前后变化。Full 每段 15 s；界面要求交替敲击，但代码不硬拒绝非交替序列。至少需要 2 次 tap 才能分析，否则该段丢弃。记录每个 tap 的目标、epoch 时间、相对时间和间隔；派生 tap rate、ITI、rhythm CV 及三等长区间变化。`first5sRate` 等字段名是历史命名。

### 4.4 Reaction

目的：测量随机等待后的视觉反应和注意 lapse。Full 需要 30 个有效 trial，等待 2–10 s。提前点击会被记录并重复该 trial；只有有效反应达到 30 个才完成。保存均值、中位数、最好/最差、提前点击率、>=500 ms lapse 数量和平均 reciprocal reaction。研究环境应避免视觉/声音提示的外部干扰。

### 4.5 Spiral Tracing

目的：测量精细运动精度、速度、平滑度和停顿。模板为约 3.5 圈的 Archimedean spiral；单笔完成，至少 15 个点、覆盖率至少 90%，并需满足中心接近条件。没有固定时长；以 raw pointer path 为复核依据。未满足几何条件时不应把展示分数当作有效完成。

### 4.6 Fatigue Challenge

目的：施加重复点击负荷，为后测提供统一的任务负荷。Full 选择 30 s 或 60 s，记录实际经过时长和 tap 数；当前代码不硬性验证左右交替。中止通过评测向导的“退出评测”完成；任务本身没有独立取消按钮。

### 4.7 Subjective Rating

目的：独立记录 perceived fatigue。完成后输入 1–10 评分，可选 sensations 和最多 150 字符备注。主观评分并入保存记录，但不进入当前客观四维疲劳指数。

## 5. Completion, abort and persistence

完成后保存 baseline、post-fatigue、challenge 和 subjective 数据，计算四维变化与工程疲劳指数。用户可在向导使用“退出评测”中止；刷新页面或取消会丢失 React 内存中的未完成向导状态，当前没有断点续测。

若任务未达到有效输入阈值，应重做该段或按研究协议记录缺失，不得用模拟数据填补。若浏览器拒绝 IMU 权限或设备不支持，应记录为缺失/阻塞。

## 6. Demo Mode boundary

Demo 使用真实交互，但参数缩短：校准 1.5 s、稳定性 5 s、敲击 8 s、反应 5 个有效试次且等待 0.7–1.8 s、挑战 10/20 s、Star Catcher 10 s。Demo 无 Full 账户、云同步、管理后台或服务端 API；它用于演示和流程 smoke check，不用于与 Full 数据直接合并的正式统计分析。

当前保存记录没有统一 `runtimeMode` 字段，因此研究导出必须从采集日志/运行配置补记模式；未来应将运行模式和协议版本写入每次结果元数据。
