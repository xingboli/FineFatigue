# FineFatigue

FineFatigue 是一个面向手部疲劳与精细运动实验的数据采集 Web 应用。它在手机或平板浏览器中读取真实的 `DeviceMotion` IMU 事件，组织“基准测验 → 疲劳诱发 → 复测 → 主观自评”的完整流程，生成可回顾的会话报告，并在局域网/Tailscale 环境中提供账号、同步、管理与 CSV 导出能力。

本项目用于实验采集与研究辅助，不用于临床诊断或医疗决策。

## Online Demo

在线演示：<https://xingboli.github.io/FineFatigue/>

Online Demo 是同一代码库的纯静态 Demo 构建，面向课堂、展示和快速体验。它不需要 Node.js、Express、数据库或任何后端 API；实验交互仍使用真实的浏览器点击、Canvas 和设备传感器数据，结果只保存在当前浏览器的 LocalStorage。Demo 会缩短计时以便快速体验，但不会生成虚假 IMU 或预填测试结果。

| 功能 | Online Demo | Local Full |
| --- | --- | --- |
| 前端实验与 Canvas 交互 | ✅ | ✅ |
| IMU | 设备支持时 ✅ | ✅ |
| LocalStorage、本地历史与报告 | ✅ | ✅ |
| 用户注册/登录 | ❌ | ✅ |
| 云同步与数据库 | ❌ | ✅ |
| 管理员后台与 CSV 汇总 | ❌ | ✅ |
| 服务端 MiMo AI 建议 | ❌（本地规则建议） | ✅（可选） |

Demo 和 Full 共享同一套 React/Vite 实现，但实验计时不同。Demo 的缩短参数只用于课堂 walkthrough 和快速展示；正式研究应使用 Local Full。

| 运行参数 | Online Demo | Local Full / Research |
| --- | ---: | ---: |
| 静止校准 | 1.5 秒 | 3 秒 |
| 手部稳定性 | 5 秒 | 15 秒 |
| 交替敲击 | 8 秒 | 15 秒 |
| 疲劳挑战 | 10 / 20 秒 | 30 / 60 秒 |
| 反应试次 | 5 个有效试次 | 30 个有效试次 |
| 随机等待 | 0.7–1.8 秒 | 2–10 秒 |
| Star Catcher | 10 秒 | 25 秒 |

如果设备或浏览器不支持真实运动传感器，页面会明确提示；可使用支持 IMU 的手机通过 HTTPS 打开相关功能。认知与记忆、敲击、反应、螺旋描摹和 Star Catcher 等不依赖 IMU 的浏览器端交互仍可直接体验。

## 已实现功能

- 真实 IMU 采集：通过浏览器 `DeviceMotion` 读取加速度和角速度；设备不支持或未授权时明确显示“IMU 传感器不可用”，不会生成模拟波形或伪造传感器数据。
- 标准评测流程：基于实际静止采样的传感器校准、4 项基准测验、重复运动负荷挑战、4 项负荷后复测、主观疲劳自评与报告生成。稳定性分析保留完整原始波形，并按真实时间戳估计采样率和重力基线。
- 4 个客观维度：手部稳定性、运动耐力/敲击、视觉反应、螺旋描摹精细控制。主观自评被保存为独立多维实验变量，不参与客观疲劳指数计算。
- 会话管理：本地保存会话、历史回看、报告 JSON 导出和浏览器打印。
- 认知与记忆测试：提供独立的 4×4 空间记忆配对任务，使用本地静态符号随机排布；逐次保存真实点击和配对尝试（含单调任务时间），记录正确/错误、响应时间和前后半程变化，不生成虚构受试者记录，也不作医学诊断。
- 账号与同步：受试者可注册密码账号；新账号需要管理员批准后才能登录。首次同步上传本机记录，之后按登录受试者增量同步会话、自评、认知和追踪结果；网络失败时会重试并保留本地数据。
- 管理员端：受试者审核/停用、参与次数查看、密码重置、报酬金额与状态记录，以及会话、完整评测原始长表、受试者、认知汇总/原始和追踪原始 CSV 导出。
- 中英文界面与 Star Catcher 独立标准化追踪任务：固定轨迹/时长/禁区，保存原始指针轨迹及 RMSE、在靶时间、相位滞后和禁区事件。
- 疲劳关怀：服务端可调用小米 MiMo `mimo-v2.5-pro` 生成非诊断性的恢复建议；接口不可用时前端保留本地规则建议作为降级路径。

## 技术栈

- 前端：React 19、TypeScript、Vite、Tailwind CSS、lucide-react、Motion
- 浏览器能力：DeviceMotion、LocalStorage、Canvas、Fetch API
- 服务端：Node.js、Express、dotenv、Node `crypto`
- 数据存储：服务端本地 JSON 文件；浏览器 LocalStorage 缓存
- 网络部署：可通过 Tailscale Serve 将服务以 Tailnet HTTPS 地址暴露给已加入 Tailnet 的设备

## 项目目录

```text
.
├─ src/
│  ├─ components/       # 评测步骤、认知卡片、图表、通用组件、布局、小游戏
│  ├─ pages/            # 概览、评测、认知记忆、传感器监视、报告、历史、设置、管理员页
│  ├─ services/         # IMU、认证、同步、认知本地存储、AI 建议
│  ├─ utils/            # 信号处理、疲劳评分与认知任务指标计算
│  ├─ types/            # 前后端共用的核心数据类型
│  └─ i18n/             # 中英文文案与语言上下文
├─ public/              # 静态资源
├─ server.mjs           # Express API、认证、同步、导出和静态文件服务
├─ data/                # 运行时创建的服务端数据文件（已忽略，不提交）
├─ .env.example         # 环境变量模板
├─ .env.demo            # GitHub Pages Demo 构建开关
├─ .github/workflows/   # GitHub Pages 自动部署
└─ docs/                # 产品、用户、工程与科研文档
```

## 环境要求

- Node.js 18 或更高版本（服务端使用内置 `fetch`）
- npm
- 支持 `DeviceMotion` 的移动端浏览器；iOS/Safari 通常需要在按钮触发后授权“运动与方向”权限
- 真实 IMU 采集建议使用 HTTPS。通过 Tailscale Serve 访问时可满足这一要求。

## 安装与启动

```bash
npm install
copy .env.example .env
# 编辑 .env，填入真实管理员凭据和（可选）MiMo API Key
npm run build
npm start
```

`npm start` 启动 Express 服务，默认监听 `0.0.0.0:3000`，并提供已经构建的 `dist/` 静态文件及 `/api/*` 接口。

本地前端开发可使用：

```bash
npm run dev
```

注意：`npm run dev` 只启动 Vite 前端开发服务器，不提供认证、同步、管理员或 AI API；需要联调这些功能时，请先构建并使用 `npm start`。

### Demo 构建与本地预览

```bash
npm run build:demo
npm run preview:demo
```

Demo 构建使用 Vite `demo` mode，自动把静态资源 base 设置为 `/FineFatigue/`，适配本仓库的 GitHub Pages 项目路径；Full 构建仍使用 `/`，不改变现有本地部署方式。

## 环境变量

将 `.env.example` 复制为 `.env`。`.env` 已被 Git 忽略，不能提交真实密钥或密码。

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `ADMIN_USERNAME` | 是（管理员功能） | 管理员登录名。 |
| `ADMIN_PASSWORD` | 是（管理员功能） | 管理员密码；建议使用长且唯一的密码。 |
| `MIMO_API_KEY` | 否 | 小米 MiMo API 密钥。未设置时，AI 接口返回不可用，前端使用本地规则建议。 |
| `MIMO_BASE_URL` | 否 | 默认 `https://api.xiaomimimo.com/v1`。 |
| `MIMO_MODEL` | 否 | 默认 `mimo-v2.5-pro`。 |
| `PORT` | 否 | 服务监听端口，默认 `3000`。 |

修改 `.env` 后必须重启 `npm start`，新环境变量才会被加载。

## 常用命令

```bash
npm run dev          # Vite 前端开发服务器；不提供 API
npm run lint         # TypeScript 类型检查
npm run build        # Full 生产构建到 dist/
npm run build:demo   # GitHub Pages 纯静态 Demo 构建
npm start            # 启动 LAN Full 服务（需先构建）
npm run preview      # Vite 构建产物预览；不提供 API
npm run preview:demo # /FineFatigue/ 子路径静态 Demo 预览
```

## GitHub Pages 自动部署

`.github/workflows/deploy-pages.yml` 会在 `main` 分支更新或手动触发时执行：安装依赖、运行 `npm run build:demo`、上传 `dist/` 并通过官方 Pages Actions 发布。无需把 `dist/` 提交到仓库。

首次启用时，在 GitHub 仓库的 **Settings → Pages** 中将 **Source** 设置为 **GitHub Actions**，并确认 Actions 具有 Pages 写入权限。部署完成后访问：<https://xingboli.github.io/FineFatigue/>。

## 局域网 / Tailscale 运行说明

1. 在作为服务端的电脑上完成构建并执行 `npm start`。
2. 将 Tailscale Serve 的根路径反向代理到 `http://127.0.0.1:3000`。现有部署可用 `tailscale serve status` 检查代理目标。
3. 让受试者设备加入同一 Tailnet，使用该设备的 Tailscale HTTPS 地址访问应用。
4. 在手机上打开“传感器监视”，点击“启用手机 IMU”，在系统弹窗中允许运动权限；移动设备后才会显示真实数据。

“认知与记忆”任务不依赖 IMU，可在同一 HTTPS 页面直接完成；结束后的结果先保存在该浏览器，登录的受试者可通过“云端同步”同步至当前 LAN 服务。

服务健康检查为 `GET /api/health`。浏览器前端、认证和同步均使用同源 `/api/*` 路径，因此不要将前端单独部署到与 Express 服务不同的域名。

## 文档

文档按职责组织，README 只作为入口：

### Product

- [产品需求文档](docs/PRD.md)
- [用户使用说明](docs/USER_GUIDE.md)

### Engineering

- [完整技术文档](docs/TECHNICAL_DOCUMENTATION.md)
- [后续开发与维护说明](docs/MAINTENANCE.md)
- [测试与验收 SOP](docs/TESTING.md)
- [部署与备份说明](docs/DEPLOYMENT.md)

### Research

- [正式实验协议](docs/EXPERIMENT_PROTOCOL.md)
- [数据字典与导出规范](docs/DATA_SPECIFICATION.md)
- [疲劳评测设计理论依据与方法学说明](docs/FATIGUE_ASSESSMENT_RATIONALE.md)
- [可复现性记录](docs/REPRODUCIBILITY.md)
- [限制与效度边界](docs/LIMITATIONS_AND_VALIDITY.md)

## 数据与安全提示

- 服务端会在 `data/finefatigue-store.json` 保存受试者账户、密码哈希、会话、自评、认知任务结果、设置和报酬管理记录；该目录被 `.gitignore` 排除。
- 浏览器 LocalStorage 也会缓存当前设备上的会话、自评、认知与追踪任务结果、设置、登录令牌和按受试者划分的同步清单。清除浏览器站点数据会删除这些本地缓存。
- 认知测试的完整本地/同步记录包含交互事件和配对尝试。管理员可分别导出便于训练的汇总 CSV 与逐选择/逐尝试的原始长表 CSV；结果页也可下载本次原始 JSON。所有导出仍属于研究数据，应按实验伦理与数据管理要求保留。
