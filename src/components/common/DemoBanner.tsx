import React, { useState } from 'react';
import { FlaskConical, Github, ChevronDown, ChevronUp } from 'lucide-react';
import { DEMO_MODE, GITHUB_REPO_URL } from '../../config/runtime';
import { useI18n } from '../../i18n/context';

/**
 * Visible marker for the static Demo Mode build (GitHub Pages).
 * Explains the data-privacy model and links back to the full-version repo.
 * Rendered only when DEMO_MODE is true, so Full Mode is untouched.
 */
export const DemoBanner: React.FC = () => {
  const { locale } = useI18n();
  const [expanded, setExpanded] = useState(false);

  if (!DEMO_MODE) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 select-none">
      <div className="px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[10px] font-bold uppercase tracking-wide">
            <FlaskConical className="w-3 h-3" />
            {locale === 'zh' ? '在线演示模式' : 'Online Demo'}
          </span>
          <span className="truncate">
            {locale === 'zh'
              ? '数据仅保存在当前浏览器，不会上传服务器。'
              : 'Data stays in this browser only; nothing is uploaded to a server.'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors font-semibold"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{locale === 'zh' ? '源码' : 'Source'}</span>
          </a>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="p-1 rounded-lg hover:bg-amber-100 transition-colors"
            aria-label={locale === 'zh' ? '更多信息' : 'More info'}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-3 sm:px-6 pb-2.5 text-[11px] leading-relaxed text-amber-800 max-w-3xl">
          <p>
            {locale === 'zh'
              ? '完整研究版本支持受试者账号、云端同步和管理员集中管理（本地局域网部署）。演示模式已缩短实验时长，正式研究版本使用标准实验时长；所有测量仍来自真实交互与设备传感器，不使用模拟数据。'
              : 'The full research version adds participant accounts, cloud sync and centralized administration (LAN deployment). This demo shortens experiment durations for a quick tour; the formal research protocol uses standard durations. All measurements still come from real interaction and device sensors — no simulated data.'}
          </p>
          <p className="mt-1 font-mono text-[10px] text-amber-700">
            {locale === 'zh' ? '本地完整版：npm run build && npm start' : 'Local full version: npm run build && npm start'}
          </p>
        </div>
      )}
    </div>
  );
};
