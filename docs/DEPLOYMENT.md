# Deployment Guide

FineFatigue 有两个运行画像：GitHub Pages 上的静态 Online Demo，以及本地/局域网的 Full / Research Mode。二者共享前端代码，但后端能力、时长和数据边界不同。

## 1. Static Online Demo

### 1.1 Local build and preview

```powershell
npm ci
npm run build:demo
npm run preview:demo
```

Demo 通过 `.env.demo` 设置 `VITE_DEMO_MODE=true`，Vite 的 base 为 `/FineFatigue/`。本地预览服务默认监听 `http://127.0.0.1:4174/FineFatigue/`，只提供静态文件和 SPA fallback，不提供 `/api`。

Demo 适合公开演示、课堂和流程检查：任务仍要求真实用户交互，IMU 仍来自浏览器真实 DeviceMotion 事件。它提供一键受试者/管理员**演示身份**切换、只读示例历史与管理员账户摘要，以展示页面权限和数据形态；这不是真实认证、不会请求 API、不能同步、修改账户或导出 CSV。缩短的任务时长也不应与 Full / Research 数据混合分析。

### 1.2 GitHub Pages flow

工作流 `.github/workflows/deploy-pages.yml` 的实际流程是：

```text
push main
  → GitHub Actions
  → npm ci
  → npm run build:demo
  → 上传 dist artifact
  → deploy-pages
  → https://xingboli.github.io/FineFatigue/
```

仓库设置中应选择 `Settings → Pages → GitHub Actions`。发布前检查 Actions 的 build 和 deploy job 都成功，再检查线上入口、资源路径、刷新和移动布局。`dist/` 不提交到 Git；部署产物由 Actions 生成。

## 2. Local Full / Research Mode

### 2.1 Start

在本地配置 `.env`（参考 `.env.example`），然后：

```powershell
npm ci
npm run lint
npm run build
npm start
```

`npm start` 启动 Express，并同时提供 `dist` 静态资源和 `/api/*`。`npm run dev` 只启动 Vite 前端，不能代替 Full 服务端。

推荐的局域网访问路径是：

```text
手机浏览器
  → Tailscale HTTPS / 局域网安全入口
  → 127.0.0.1:3000
  → Express
  → dist + /api
```

如果直接使用局域网 HTTP，移动端传感器权限和浏览器安全策略可能阻止 DeviceMotion；正式研究应使用受信任的 HTTPS 部署并记录证书/网络条件。

### 2.2 Environment

以 `.env.example` 为准，不把密钥提交到仓库。当前配置项包括运行端口、管理员初始化信息、参与者注册策略及可选 MiMo/AI 配置。AI 配置是可选能力；没有配置时应使用本地规则或明确失败提示。不要把真实账户密码、token、生产密钥或数据文件写入 `.env.example`、日志或 Git。

## 3. Data backup and recovery

Full 服务将数据写入 `data/finefatigue-store.json`。该目录被 Git 忽略，备份必须由部署者单独管理。当前实现使用临时文件再 rename 的单文件写入方式，但没有数据库事务、跨进程文件锁、加密存储、自动迁移、异地灾备或自动备份保证。

备份前先停止服务，只复制明确的数据文件到受控目录。例如 PowerShell：

```powershell
Copy-Item -LiteralPath 'data/finefatigue-store.json' -Destination 'D:\FineFatigue-backups\finefatigue-store-YYYYMMDD-HHmmss.json'
```

恢复时：

1. 停止唯一的 Full 服务实例。
2. 先保留当前文件副本，再将已确认的备份复制回 `data/finefatigue-store.json`。
3. 启动服务并访问 `/api/health`。
4. 分别用管理员和参与者账户验证登录、会话列表和必要的 CSV 导出。
5. 记录恢复时间、备份文件校验信息和验证结果。

只运行一个写入实例；多实例同时写同一个 JSON 文件不在当前实现的安全保证范围内。

## 4. Security and operational boundary

本部署方式面向受控本地/局域网研究场景，不应直接暴露到公网。服务端 token 在内存中有效 12 小时，参与者密码使用 scrypt 哈希；这不等于完整的生产级身份与数据安全方案。上线前应另行评估 HTTPS、访问控制、备份加密、审计、数据保留和删除策略。
