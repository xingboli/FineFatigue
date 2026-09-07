import React from 'react';
import { ExternalLink, Info, Timer } from 'lucide-react';
import { DEMO_MODE } from '../../config/runtime';
import { useI18n } from '../../i18n/context';

export const DemoModeBanner: React.FC = () => {
  const { locale } = useI18n();

  if (!DEMO_MODE) return null;

  const zh = locale === 'zh';
  return (
    <div className="mb-5 rounded-2xl border border-cyan-200 bg-cyan-50/90 px-4 py-3 text-cyan-950 shadow-xs sm:px-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-2xs">
          <Info className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">{zh ? '在线演示模式' : 'Online Demo Mode'}</span>
            <span className="rounded-full border border-cyan-300 bg-white/80 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-cyan-800">
              Demo
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-cyan-900/80">
            {zh
              ? '数据仅保存在当前浏览器，不会上传服务器。完整研究版本支持受试者账号、数据同步和集中管理。'
              : 'Data stays in this browser and is not uploaded. The Local Full version adds participant accounts, sync, and centralized administration.'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-cyan-800">
            <span className="inline-flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" />
              {zh ? '快速体验已启用：流程时长已缩短' : 'Quick Demo enabled: shorter protocol timings'}
            </span>
            <a
              className="inline-flex items-center gap-1 hover:text-cyan-950 hover:underline"
              href="https://github.com/xingboli/FineFatigue"
              target="_blank"
              rel="noreferrer"
            >
              {zh ? '查看 GitHub 源码' : 'View source on GitHub'}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
