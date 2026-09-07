# FineFatigue 疲劳评测设计理论依据与方法学说明

> 本文说明 FineFatigue 当前测试组合、各任务对应的疲劳相关能力，以及“基线测验—疲劳负荷—复测—主观自评”流程的方法学依据。内容以当前系统实现和公开研究文献为基础。

---

## 1. 项目设计结论

FineFatigue 采用的是一套**基于表现易疲劳性（performance fatigability）的多维数字化评测框架**。

疲劳并不是一个能够由单一传感器直接读取的物理量。现代疲劳研究通常将其区分为两个相互关联的部分：

1. **主观疲劳（perceived fatigue / perceived fatigability）**：个体主观感受到的疲惫、费力、精力下降；
2. **表现易疲劳性（performance fatigability）**：个体在明确任务和负荷条件下出现的、可以客观量化的表现下降。

Enoka 与 Duchateau 提出的疲劳框架明确指出，人类疲劳表现来自主观疲劳与客观表现易疲劳性的共同作用；后续更新框架进一步将运动任务和认知任务中的 performance fatigability 纳入统一解释体系。[1,2]

因此，FineFatigue 不依赖某一个单独指标判断疲劳，而是从**运动稳定性、重复运动能力、持续警觉、精细运动控制**四个行为维度进行测量，并同时保存主观疲劳评分。

系统主流程采用：

**基线测验 → 标准化疲劳负荷 → 同任务复测 → 主观疲劳自评**

这一设计的核心不是比较不同人的绝对分数，而是观察**同一个人在负荷前后是否发生稳定、方向明确的表现变化**：

\[
\Delta X = X_{post}-X_{pre}
\]

因此，FineFatigue 的理论核心可以概括为：

> **通过标准化任务把疲劳对不同功能系统造成的性能下降“显影”，再通过负荷前后的个体内变化量对疲劳状态进行多维表征。**

---

## 2. 为什么必须采用多维测试，而不是单一指标

疲劳具有明显的**任务依赖性（task-dependent）**。不同类型的疲劳负荷会优先影响不同能力：持续清醒和睡眠不足首先影响警觉与注意；重复运动负荷主要影响运动速度、节律和稳定性；精细动作负荷则会反映到轨迹误差、平滑性及微小震颤等指标中。[1–3]

因此，单一反应时、单一 IMU 指标或单一主观评分都不足以完整描述疲劳表现。

FineFatigue 将客观行为拆分为四个互补维度：

| 测试模块 | 对应能力 | 核心观测量 | 设计目的 |
|---|---|---|---|
| 手部稳定性 / IMU | 运动稳定性 | motion RMS、频谱功率、主频、频谱熵 | 观察微动和运动控制稳定性的变化 |
| 交替敲击 | 重复运动能力 | tapping rate、ITI、节律 CV、performance decrement | 观察运动速度、节律和 motor slowing |
| 随机间隔反应时 | 持续警觉 | median RT、lapse、false start、reciprocal RT | 观察警觉下降与注意脱落 |
| 阿基米德螺旋描摹 | 精细运动控制 | path RMSE、smoothness、原始轨迹 | 观察轨迹精度和平滑性变化 |
| 主观疲劳自评 | 主观疲劳体验 | 1–10 分及主观标签 | 描述 perceived fatigue，与客观表现并行 |

四类客观任务分别建立了不同的观测通道，使系统能够判断疲劳主要表现在哪个功能维度，而不是只输出一个无法解释来源的单值结果。

---

# 3. 手部稳定性测试：量化疲劳后的运动稳定性变化

## 3.1 设计逻辑

FineFatigue 使用移动设备 IMU 获取加速度与角速度信息，在静止保持任务中提取去重力后的微小运动，并进行时域和频域分析。

手部保持并非真正的“完全静止”。人体运动系统始终存在微小的生理性震颤与姿势调整；当局部肌肉和运动控制系统受到负荷时，这些微运动的幅度和频谱结构会发生变化。因此，IMU 可以作为运动稳定性变化的数字化观测工具。

本模块回答的问题是：

> **经过疲劳负荷后，受试者维持稳定姿势的能力是否下降？**

## 3.2 指标含义

系统保留：

- **motion RMS**：反映整体微运动强度；
- **主频与功率谱**：描述运动能量在不同频率上的分布；
- **频谱熵**：描述运动频谱的复杂度与离散程度；
- **原始三轴波形**：用于后续重新分析。

这些指标共同描述手部姿势维持过程中微运动的强度和结构。

## 3.3 文献依据

Morrison 等研究发现，局部肌肉疲劳可以引起生理性震颤和肌肉活动增加，说明疲劳能够通过运动系统的微小振动表现出来。[7,8]

Moyen-Sylvestre 等在重复上肢任务中进一步使用 IMU 加速度与角速度频谱分析，发现疲劳前后多个身体节段的频谱功率发生系统性变化，并明确指出低成本惯性传感器能够用于表征重复任务中的肌肉疲劳相关运动变化。[9]

因此，本项目使用移动端 IMU 观察负荷前后的微动与频谱变化，具有明确的生物力学与数字运动测量依据。

FineFatigue 将该模块定义为：

> **局部运动稳定性与疲劳相关运动控制变化指标。**

---

# 4. 交替敲击测试：量化重复运动能力和 motor slowing

## 4.1 设计逻辑

快速重复手指运动是研究运动易疲劳性的经典任务之一。

当受试者持续以较高速度完成重复动作时，运动系统需要不断维持动作启动、节律控制与运动输出。随着任务持续，常见表现包括：

- 敲击速度下降；
- 相邻敲击时间间隔增加；
- 节律变得不稳定；
- 任务后段表现低于任务开始阶段。

这种现象称为 **motor slowing / motor fatigability**。

因此，本项目使用左右目标交替敲击，直接记录每次点击的时间信息，从行为层面对重复运动能力进行量化。

## 4.2 指标含义

FineFatigue 提取：

- **tapping rate**：单位时间内完成动作的速度；
- **inter-tap interval（ITI）**：相邻动作间隔；
- **ITI coefficient of variation（CV）**：节律稳定程度；
- **前段、中段、后段敲击频率**：描述任务内表现变化；
- **performance decrement**：量化任务后段相对于前段的速度下降。

这些指标同时描述“能做多快”和“能否持续稳定地做”。

## 4.3 文献依据

Bächinger 等通过重复最大速度手指运动证明，随着重复动作持续，健康成人会出现明确的运动减慢，并将这一 performance fatigability 与运动皮层抑制调控变化联系起来。[4]

Madrid 等同样在持续 finger tapping 任务后观察到最大敲击速度下降及运动皮层抑制性回路变化，进一步证明 finger tapping 能够作为 motor fatigability 的实验表征。[5]

Bohannon 与 Wang 使用智能手机应用采集 finger tapping，证明移动触屏能够稳定获取手指敲击表现，并具有可接受的测量可靠性。[6]

因此，本项目将交替敲击用于：

> **测量重复运动速度、节律稳定性以及负荷前后的 motor fatigability。**

---

# 5. 随机间隔反应时测试：量化持续警觉和注意脱落

## 5.1 设计逻辑

疲劳最稳定、最经典的认知行为表现之一是**持续警觉能力下降**。

人在疲劳、持续清醒或睡眠不足条件下，并不只是所有反应统一变慢，更典型的现象是反应表现开始出现波动：大多数刺激仍能正常反应，但会突然出现明显延迟甚至短暂注意脱落。

Psychomotor Vigilance Test（PVT）正是基于这一现象建立的经典疲劳与睡眠研究范式。

PVT 使用不可预测的随机刺激间隔，让受试者持续等待刺激并尽快反应，从而同时测量：

- 持续警觉；
- 反应速度；
- 注意脱落；
- 冲动性提前反应。

FineFatigue 的随机间隔反应任务直接采用这一核心范式思想。

## 5.2 指标含义

当前任务保存：

- **平均反应时**；
- **中位反应时**；
- **最快/最慢反应**；
- **≥500 ms lapse 数量**；
- **false start / 抢跑**；
- **reciprocal reaction time**。

其中中位反应时能够描述总体速度，lapse 反映注意脱落，false start 描述提前反应控制，reciprocal RT 能降低极端慢反应对统计结果的影响。

## 5.3 文献依据

PVT 是持续清醒和睡眠不足研究中使用最广泛的行为警觉测验之一。研究表明，睡眠不足会造成 PVT 反应速度下降、lapse 增多以及 time-on-task performance decrement。[11]

Basner 等验证的短版 PVT-B 进一步证明，即使将任务缩短至约 3 分钟，仍然能够保持对总睡眠剥夺和部分睡眠限制的显著敏感性。[12]

NASA 等研究团队已经对触屏 PVT 进行专门验证，结果表明触摸屏设备可以实现有效的 PVT 式测量，并能够捕获持续清醒条件下的警觉性恶化。[13,14]

因此，本项目的反应时任务被定义为：

> **PVT-inspired brief vigilance task，用于量化疲劳相关的持续警觉下降、反应变慢和注意脱落。**

这是 FineFatigue 对认知疲劳最直接的客观测量通道。

---

# 6. 阿基米德螺旋描摹：量化精细运动控制

## 6.1 设计逻辑

精细运动任务要求视觉反馈、手眼协调、连续轨迹规划以及稳定的小幅手部运动共同参与。

当运动控制状态下降时，受试者仍然可能完成动作，但完成轨迹会出现：

- 偏离目标路径；
- 局部抖动；
- 速度波动；
- 曲线不平滑；
- 修正动作增多。

阿基米德螺旋具有连续、规则、曲率逐渐变化的几何结构，非常适合把这些细小运动误差转换成可量化的数字轨迹。

因此，FineFatigue 通过触摸屏记录完整螺旋轨迹，以测量疲劳负荷前后的精细运动控制变化。

## 6.2 指标含义

本项目主要使用：

- **path RMSE**：轨迹相对于标准螺旋的空间误差；
- **smoothness**：动作平滑程度；
- **完整 x–y–time 原始轨迹**：保留速度、加速度、jerk 和震颤等后续分析可能性。

RMSE 描述“画得准不准”，smoothness 描述“控制得稳不稳”。两者共同构成精细运动控制的数字化表征。

## 6.3 文献依据

数字化 Archimedes spiral drawing 已被广泛用于精细运动、震颤与运动障碍量化。Wang 等 2025 年的 scoping review 汇总了 120 项研究，指出数字螺旋能够提供客观的 fine motor function 测量，并总结了轨迹偏差、平滑度、速度、频谱等常用数字指标。[15]

该综述同时显示，数字螺旋测试已经形成较丰富的可靠性、效度和反应性证据，说明连续数字轨迹能够有效刻画传统肉眼评分难以识别的细微运动变化。[15]

因此，本项目将螺旋描摹定义为：

> **疲劳负荷前后精细运动精度与运动平滑性的量化测试。**

---

# 7. 主观疲劳自评：测量 perceived fatigue

## 7.1 设计逻辑

客观表现下降与主观疲劳感并不完全等价。

一个受试者可以主观感觉非常疲劳，但短时间内仍然维持任务表现；也可能主观疲劳感并不明显，但客观警觉和运动表现已经下降。因此，现代疲劳框架明确把 perceived fatigability 与 performance fatigability 分开测量。[1,2]

FineFatigue 在客观测试之后独立采集 1–10 分主观疲劳评分，其作用是回答：

> **受试者自己感觉有多疲劳？**

而客观任务回答的是：

> **受试者的功能表现实际发生了多少变化？**

## 7.2 文献依据

van Hooff 等研究对单项问题“How fatigued do you currently feel?”进行了收敛效度与区分效度验证，结果显示该单项疲劳测量与多项疲劳量表具有较强相关性，可用于描述即时疲劳状态。[16]

因此，本项目将主观自评独立保存，而不让它直接替代客观表现，是与现代 fatigue / fatigability 理论一致的设计。

---

# 8. 空间记忆任务：补充认知疲劳维度

## 8.1 设计逻辑

疲劳和睡眠不足不仅影响反应速度，也会影响新信息编码、短时记忆和工作记忆表现。

FineFatigue 的 4×4 空间配对任务要求受试者记忆卡片位置、维持空间信息并根据前一次错误不断更新记忆，因此能够形成以下数字指标：

- 匹配准确率；
- 错误数量；
- 完成每一对目标所需移动次数；
- 反应时间；
- 前半程与后半程表现变化。

该任务由此构成一个独立的视觉空间记忆与认知稳定性测试。

## 8.2 文献依据

Lim 与 Dinges 的 meta-analysis 对 70 项短期睡眠剥夺研究进行整合，发现睡眠剥夺对简单注意、复杂注意、工作记忆、加工速度和短时记忆等多个认知域均存在不利影响，其中简单注意 lapse 的效应尤其明显。[17]

Newbury 等针对睡眠剥夺与记忆的 meta-analysis 进一步证明，学习前睡眠剥夺会显著损害新信息记忆形成，效应达到中等水平。[18]

因此，FineFatigue 将空间配对任务作为：

> **疲劳相关认知状态、视觉空间记忆与错误控制的补充数字探针。**

---

# 9. 连续追踪 + No-Go：量化持续视觉运动控制与抑制能力

## 9.1 设计逻辑

瞬时反应时测试主要观察单次刺激后的快速反应，但真实任务中的疲劳往往表现为**持续操作质量下降**。

FineFatigue 的固定轨迹追踪任务要求受试者连续跟随动态目标，同时避开 No-Go 区域。这一任务同时包含：

1. **continuous visuomotor tracking**：持续视觉—运动闭环控制；
2. **response inhibition**：在特定区域抑制原有追踪动作。

系统记录 tracking RMSE、在靶比例、相位滞后、No-Go 进入次数与停留时间，从而形成连续性能监测通道。

## 9.2 文献依据

2025 年针对睡眠剥夺与 inhibitory control 的 meta-analysis 纳入 24 项研究、712 名健康受试者，结果显示睡眠剥夺会对 Go/No-Go 与 Stop-Signal 测得的抑制控制产生中等程度的负面影响。[19]

2026 年 Meyer 等直接比较 Moving Target Tracking Task 与 PVT，发现总睡眠剥夺后连续目标追踪误差显著恶化，尤其 tracking error 的波动对睡眠剥夺表现出明显敏感性。[20]

因此，本项目的 Star Catcher 标准化任务实际承担的是：

> **持续视觉运动控制 + 抑制控制的场景化疲劳测试。**

它补充了 PVT 类瞬时反应测试无法连续观察性能波动的问题。

---

# 10. 四维客观疲劳表征的统一逻辑

FineFatigue 的四个主测试并不是四个彼此独立的小游戏，而是一套对不同疲劳表现通道进行采样的标准化 behavioral battery。

其关系如下：

```text
                    疲劳 / 负荷状态
                          │
          ┌───────────────┼───────────────┐
          │               │               │
      运动系统         警觉系统        精细控制系统
          │               │               │
    ┌─────┴─────┐         │               │
    │           │         │               │
手部稳定性   交替敲击   随机反应时      螺旋描摹
    │           │         │               │
微动/RMS     速度/ITI    RT/lapse       RMSE/平滑度
频谱变化     节律下降    注意脱落        轨迹控制
```

四个维度分别回答：

- **稳不稳**：运动稳定性能否维持；
- **快不快、能否持续**：重复动作速度和节律能否维持；
- **醒不醒、是否漏反应**：持续警觉是否下降；
- **准不准、顺不顺**：精细运动控制是否下降。

因此，FineFatigue 的核心不是寻找一个“神奇疲劳传感器”，而是通过多个标准化任务测量疲劳在行为层面的不同输出。

---

# 11. 为什么采用“前测—疲劳负荷—复测”

FineFatigue 使用同一受试者自身作为基线。

这是整个实验设计中最重要的一层控制。

反应速度、敲击能力、手部稳定性和绘图能力都存在显著个体差异。直接规定“RT 大于某个数值就是疲劳”会受到年龄、设备、触屏延迟、惯用手、训练程度和个人运动能力影响。

而在同一受试者、同一设备、同一测试流程下比较负荷前后的变化，可以显著降低固定个体差异的干扰。

因此，本项目的基本分析对象是：

\[
\Delta RT,\quad
\Delta Tapping,\quad
\Delta Stability,\quad
\Delta Spiral
\]

而不是孤立地解释某一次测试的绝对值。

这种设计与 performance fatigability 的定义完全一致：**疲劳相关信息体现在任务表现相对于参考状态的下降。**[1,2]

---

# 12. 当前综合疲劳指数的角色

FineFatigue 当前将四个客观维度汇总为统一的疲劳指数：

- 手部稳定性：25%；
- 运动耐力：30%；
- 反应能力：20%；
- 精细运动控制：25%。

该综合指标承担的是**多维信息汇总和 Demo 结果表达**功能。

其理论含义是：

> **把多个具有明确疲劳相关机制的客观行为维度映射到同一个结果界面，使用户能够快速看到负荷后总体表现变化及各维度贡献。**

文献依据支持的是四个维度的选择和各指标的行为学含义；当前 25/30/20/25 权重属于 FineFatigue 的系统设计参数，并不表示医学界存在“疲劳由四类能力按该比例组成”的临床常模。

因此，对综合指标的准确表述是：

> **FineFatigue 通过四类客观任务形成多维疲劳表征，并使用透明的工程权重将各维度变化汇总为统一疲劳指数；原始指标与各维度变化同时完整保存，保证综合结果具有可解释性和可追溯性。**

---

# 13. 整套系统的理论闭环

FineFatigue 的完整设计逻辑可以归纳为六步：

### 第一步：建立个人基线

先测量受试者在未接受项目疲劳负荷时的运动、警觉和精细控制表现。

### 第二步：施加标准化负荷

通过固定的疲劳挑战使受试者产生可重复的 performance load。

### 第三步：重复相同测试

使用完全相同的任务重新测量，保证前后指标可以直接比较。

### 第四步：计算个体内变化

以 post–pre 的变化量作为疲劳相关性能变化的核心信息。

### 第五步：多维度解释

判断变化主要出现在运动稳定性、运动耐力、持续警觉还是精细运动控制。

### 第六步：与主观疲劳并行

同时保存受试者主观疲劳评分，从而得到“感觉有多累”和“实际性能下降多少”两个互补视角。

最终形成：

```text
主观疲劳感
     │
     ├───────────────┐
     │               │
     ▼               ▼
Perceived fatigue   Performance fatigability
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
   运动稳定性         运动耐力          认知/精细控制
       │                 │                 │
      IMU              Tapping       Reaction + Spiral
                         │
                         ▼
               负荷前后多维变化
                         │
                         ▼
                  FineFatigue 报告
```

---

# 14. 结论

FineFatigue 的测试设计并非由多个独立小游戏拼接而成，而是建立在现代 fatigue / fatigability 理论上的**多维行为评测体系**。

系统以 performance fatigability 为客观测量核心，以 perceived fatigue 为主观补充，通过标准化负荷前后重复测量，将疲劳可能引起的功能变化投影到多个可以被手机直接记录的数字行为指标中。

其中：

- **IMU 稳定性测试**负责观察局部运动稳定性和微动频谱变化；
- **交替敲击测试**负责观察重复运动速度、节律和 motor slowing；
- **随机间隔反应时测试**借鉴 PVT 范式，负责观察持续警觉下降和注意 lapse；
- **阿基米德螺旋描摹**负责观察精细运动精度和平滑性；
- **主观自评**独立测量 perceived fatigue；
- **空间记忆任务**补充视觉空间记忆与认知状态；
- **连续追踪 / No-Go**补充持续视觉运动控制和抑制控制。

整套设计形成了清晰的理论链条：

> **疲劳是不可直接观测的状态 → 疲劳会改变具体功能表现 → 标准化任务使这些变化可观测 → 移动设备记录行为与传感器数据 → 负荷前后差值量化 performance fatigability → 多维指标共同构成疲劳数字表型。**

这就是 FineFatigue 当前测试组合的设计依据。

---

# 参考文献

1. Enoka RM, Duchateau J. **Translating Fatigue to Human Performance.** *Medicine & Science in Sports & Exercise*. 2016;48(11):2228–2238. doi:10.1249/MSS.0000000000000929. PMID:27015386.  
   https://doi.org/10.1249/MSS.0000000000000929

2. Behrens M, Gube M, Chaabene H, et al. **Fatigue and Human Performance: An Updated Framework.** *Sports Medicine*. 2023;53(1):7–31. doi:10.1007/s40279-022-01748-2. PMID:36258141.  
   https://pubmed.ncbi.nlm.nih.gov/36258141/

3. Kluger BM, Krupp LB, Enoka RM. **Fatigue and fatigability in neurologic illnesses: proposal for a unified taxonomy.** *Neurology*. 2013;80(4):409–416. doi:10.1212/WNL.0b013e31827f07be. PMID:23339207.  
   https://doi.org/10.1212/WNL.0b013e31827f07be

4. Bächinger M, Lehner R, Thomas F, et al. **Human motor fatigability as evoked by repetitive movements results from a gradual breakdown of surround inhibition.** *eLife*. 2019;8:e46750. doi:10.7554/eLife.46750. PMID:31524600.  
   https://pubmed.ncbi.nlm.nih.gov/31524600/

5. Madrid A, et al. **Effects of a Finger Tapping Fatiguing Task on M1-Intracortical Inhibition and Central Drive to the Muscle.** *Scientific Reports*. 2018;8:9326. doi:10.1038/s41598-018-27691-9. PMID:29921946.  
   https://doi.org/10.1038/s41598-018-27691-9

6. Bohannon RW, Wang I. **Measurement of finger tapping performance using a smartphone application: a pilot study.** *Journal of Physical Therapy Science*. 2021;33(8):618–620. doi:10.1589/jpts.33.618. PMID:34393374.  
   https://pubmed.ncbi.nlm.nih.gov/34393374/

7. Morrison S, Kavanagh J, Obst SJ, Irwin J, Haseler LJ. **The effects of unilateral muscle fatigue on bilateral physiological tremor.** *Experimental Brain Research*. 2005;167(4):609–621. doi:10.1007/s00221-005-0050-x. PMID:16078030.  
   https://pubmed.ncbi.nlm.nih.gov/16078030/

8. Morrison S, Sosnoff JJ. **The impact of localized fatigue on contralateral tremor and muscle activity is exacerbated by standing posture.** *Journal of Electromyography and Kinesiology*. 2010;20(6):1211–1218. doi:10.1016/j.jelekin.2010.07.002. PMID:20673732.  
   https://pubmed.ncbi.nlm.nih.gov/20673732/

9. Moyen-Sylvestre B, Goubault É, Begon M. **Power Spectrum of Acceleration and Angular Velocity Signals as Indicators of Muscle Fatigue during Upper Limb Low-Load Repetitive Tasks.** *Sensors*. 2022;22(20):8008. doi:10.3390/s22208008.  
   https://pmc.ncbi.nlm.nih.gov/articles/PMC9608815/

10. Lim J, Dinges DF. **Sleep deprivation and vigilant attention.** *Annals of the New York Academy of Sciences*. 2008;1129:305–322. doi:10.1196/annals.1417.002. PMID:18591490.  
    https://doi.org/10.1196/annals.1417.002

11. Basner M, Dinges DF. **Maximizing sensitivity of the Psychomotor Vigilance Test (PVT) to sleep loss.** *Sleep*. 2011;34(5):581–591. doi:10.1093/sleep/34.5.581. PMID:21532951.  
    https://pubmed.ncbi.nlm.nih.gov/21532951/

12. Basner M, Mollicone D, Dinges DF. **Validity and Sensitivity of a Brief Psychomotor Vigilance Test (PVT-B) to Total and Partial Sleep Deprivation.** *Acta Astronautica*. 2011;69(11–12):949–959. doi:10.1016/j.actaastro.2011.07.015. PMID:22025811.  
    https://pubmed.ncbi.nlm.nih.gov/22025811/

13. Arsintescu L, Mulligan JB, Flynn-Evans EE. **Evaluation of a Psychomotor Vigilance Task for Touch Screen Devices.** *Human Factors*. 2017;59(4):661–670. doi:10.1177/0018720816688394. PMID:28095256.  
    https://pubmed.ncbi.nlm.nih.gov/28095256/

14. Arsintescu L, Kato KH, Cravalho PF, et al. **Validation of a touchscreen psychomotor vigilance task.** *Accident Analysis & Prevention*. 2019;126:173–176. doi:10.1016/j.aap.2017.11.041. PMID:29198969.  
    https://pubmed.ncbi.nlm.nih.gov/29198969/

15. Wang S, Schwirtlich T, McLaughlin D, Beestrum M, Heinemann AW. **Clinical Applications and Measurement Properties of the Digitized Archimedes Spiral Drawing Test: A Scoping Review.** *Movement Disorders Clinical Practice*. 2025;12(11):1742–1755. doi:10.1002/mdc3.70278. PMID:40776580.  
    https://pubmed.ncbi.nlm.nih.gov/40776580/

16. van Hooff MLM, Geurts SAE, Kompier MAJ, Taris TW. **“How fatigued do you currently feel?” Convergent and discriminant validity of a single-item fatigue measure.** *Journal of Occupational Health*. 2007;49(3):224–234. doi:10.1539/joh.49.224. PMID:17575403.  
    https://pubmed.ncbi.nlm.nih.gov/17575403/

17. Lim J, Dinges DF, et al. **A Meta-Analysis of the Impact of Short-Term Sleep Deprivation on Cognitive Variables.** *Psychological Bulletin*. 2010;136(3):375–389. doi:10.1037/a0018883. PMID:20438143.  
    https://pubmed.ncbi.nlm.nih.gov/20438143/

18. Newbury CR, Crowley R, Rastle K, Tamminen J. **Sleep deprivation and memory: Meta-analytic reviews of studies on sleep deprivation before and after learning.** *Psychological Bulletin*. 2021;147(11):1215–1240. doi:10.1037/bul0000348. PMID:35238586.  
    https://pubmed.ncbi.nlm.nih.gov/35238586/

19. Choong SY, Byrne JEM, Drummond SPA, et al. **A meta-analytic investigation of the effect of sleep deprivation on inhibitory control.** *Sleep Medicine Reviews*. 2025;80:102042. doi:10.1016/j.smrv.2024.102042. PMID:39700763.  
    https://pubmed.ncbi.nlm.nih.gov/39700763/

20. Meyer M, Lejeune L, Zuba D, et al. **Sleep deprivation: sensitivity comparison between a visuomotor tracking task and the psychomotor vigilance test (PVT).** *Psychological Research*. 2026;90(3):75. doi:10.1007/s00426-026-02289-3. PMID:41999492.  
    https://pubmed.ncbi.nlm.nih.gov/41999492/
