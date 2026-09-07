/**
 * Central runtime-mode configuration.
 *
 * Full Mode  : `npm run build` / `npm run dev` — app expects the Express LAN
 *              server (`npm start`) for auth, sync, admin and AI endpoints.
 * Demo Mode  : `npm run build:demo` — pure static build for GitHub Pages.
 *              Server-dependent capabilities are disabled BEFORE any request
 *              is issued; all browser-local features keep working.
 *
 * The flag is injected at build time by vite.config.ts via
 * `define: { __DEMO_MODE__: ... }` (demo build uses `--mode demo`).
 * Never gate features on `window.location.hostname` — always import DEMO_MODE
 * from this module so there is a single source of truth.
 */

declare const __DEMO_MODE__: boolean;

export const DEMO_MODE: boolean =
  typeof __DEMO_MODE__ !== 'undefined' ? __DEMO_MODE__ : false;

export const APP_MODE_NAME = DEMO_MODE ? 'demo' : 'full';

/** Public source repository (linked from the Demo Mode banner). */
export const GITHUB_REPO_URL = 'https://github.com/xingboli/FineFatigue';

/** Message shown where a server-only capability is used in Demo Mode. */
export const DEMO_DISABLED_NOTICE = {
  zh: '在线演示模式不提供该功能。账号、云同步与管理员功能需要在本地完整版（npm start 局域网服务）中使用。',
  en: 'Not available in the online demo. Accounts, cloud sync and administration require the local full version (npm start LAN server).'
} as const;
