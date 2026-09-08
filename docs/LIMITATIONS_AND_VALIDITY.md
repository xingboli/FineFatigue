# Limitations and Validity

本文档从研究效度角度描述当前系统能支持和不能支持的结论。真实传感器输入、可追溯原始事件和可运行的软件，不等于构念效度、临床效度或跨人群泛化。

## 1. Evidence status by module

| Module | Raw measurement | Derived feature | Current heuristic | Literature-supported construct | FineFatigue metric status |
|---|---|---|---|---|---|
| IMU stability | DeviceMotion acceleration/rotation events | de-gravity RMS, spectrum, entropy | stability score formula and display clamp | hand motion stability / tremor-related movement construct | Not validated for this battery |
| Finger tapping | tap timestamps and target side | rate, ITI, rhythm CV, segment change | three equal-duration segments and fatigue index weight | repetitive motor speed/rhythm, motor slowing | Not validated for this battery |
| Reaction | click/trial timestamps, early flags | mean/median, lapse, reciprocal RT | early retry, >=500 ms lapse, composite weight | sustained attention / vigilance | Not validated for this battery |
| Spiral tracing | pointer path and template | RMSE, speed, smoothness, pauses | geometry acceptance and display clamp | fine motor precision/control | Not validated for this battery |
| Subjective | 1–10 rating, sensations, note | level/record linkage | UI range and text limit | perceived fatigue | Face-level capture only; no criterion validity shown |
| Cognition memory | card interactions and elapsed times | accuracy, speed, stability scores | schema v2 formulas | spatial memory / response speed | Independent task; not part of fatigue index |
| Star Catcher | pointer path and target | RMSE, on-target, lag | score and task thresholds | continuous visuomotor tracking | Independent task; not part of fatigue index |

文献可支持任务构念和一般行为学解释；不能单凭文献证明本项目的权重、阈值、实现细节或最终分数已经验证。

## 2. Main confounders

当前代码和现有仓库证据没有量化以下因素的影响：

- 设备 IMU 品牌、轴向、传感器噪声、采样率和浏览器事件调度；
- Android/iOS、浏览器版本、权限流程、触摸延迟、屏幕刷新率和 OS 后台策略；
- 优势手、手指长度、握持/支撑、姿势、桌面高度和环境振动；
- 学习效应、任务熟悉度、练习次数、动机、注意力、睡眠和主观努力；
- 年龄、基线运动能力、疾病/药物、疼痛或其他健康因素；
- 网络同步失败、浏览器存储配额、刷新导致的未完成数据丢失；
- Demo 与 Full 的时长、试次数和等待分布不同。

这些是需要测量、随机化、分层或在限制中披露的混杂项，不能通过当前分数自动校正。没有 FineFatigue 专门实验数据时，不应给出它们造成的误差百分比。

## 3. External validity and prohibited claims

FineFatigue 当前不是：

- 医疗器械或安全认证系统；
- Parkinson 或其他疾病的诊断工具；
- 面向普通人群的普适疲劳检测器或临床 cutoff；
- 已证明跨设备、跨浏览器、跨国家/年龄/疾病人群等价的测量电池；
- 自动推断病情严重程度、工作安全或个体风险的系统。

可以支持的保守表述是：在明确的运行模式、设备和协议条件下，系统记录真实交互，并计算若干与运动稳定性、重复运动、反应警觉和精细控制相关的候选行为指标；在同一受试者的前后任务中可用于探索性比较。不能据此声称已完成诊断、疲劳因果识别或临床替代验证。

## 4. Score and protocol limitations

当前 25/30/20/25 权重、等级阈值、范围裁剪和部分质量门槛是工程设计。Full 是研究采集画像，Demo 是缩短的公开演示；Demo 数据不能不加标签地并入 Full 分析。反应时的提前点击重试、敲击三等长分段、描摹显示裁剪和 Star/Cognition 独立性都必须在分析计划中显式处理。

稳定性原始分数、描摹原始轨迹和游戏路径应保留用于复核；只分析展示分数会丢失裁剪信息。Calibration 当前只在内存中使用，报告没有完整校准元数据，因而跨设备复核能力有限。

## 5. Missing evidence

目前仓库没有足够证据回答：

- 目标人群需要多少样本、重复测量信度是多少；
- 不同设备/浏览器之间的测量误差和等价性；
- 前后测变化是否特异于疲劳而非练习、时间或动机；
- 指标与主观疲劳、临床量表或外部生理金标准的相关/一致性；
- 权重和等级阈值是否在独立样本中稳定；
- 是否存在受试者泄漏、设备泄漏或选择性报告；
- Cognition/Star 是否应纳入未来的主分析。

代码中也没有样本量计算、预注册统计模型、受试者级 split、重复种子、缺失值处理或多重比较控制。按照实验审计标准，关于“软件可运行和能采集候选指标”的工程证据可以建立；关于“有效、可靠、可泛化、可诊断”的主要研究主张当前只能判定为 `Cannot determine / Partly supported`。

## 6. Minimum next evidence

在提出强研究结论前，至少需要：

1. 冻结 Full 协议和设备/浏览器矩阵，记录每条结果的 provenance。
2. 预注册主要终点、排除规则、受试者级拆分、样本量和统计模型。
3. 做同一设备重复测量与跨设备/跨浏览器可靠性实验。
4. 使用疲劳操纵和不含疲劳的时间/练习对照，区分替代解释。
5. 与主观评分、外部量表或适当参考标准进行收敛/区分效度验证。
6. 在独立受试者和独立设备上验证权重、阈值和泛化，并报告失败率、缺失率、效应量和不确定性。
