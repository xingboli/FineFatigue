import React from 'react';
import { ReactionTrial } from '../../types';
import { useI18n } from '../../i18n/context';

interface ReactionTrialChartProps {
  trials: ReactionTrial[];
  medianReactionMs?: number;
  height?: number;
}

export const ReactionTrialChart: React.FC<ReactionTrialChartProps> = ({
  trials,
  medianReactionMs = 284,
  height = 140
}) => {
  const { locale } = useI18n();
  if (!trials || trials.length === 0) {
    return (
      <div className="h-36 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs font-mono">
        {locale === 'zh' ? '暂无测试数据' : 'No trial data available'}
      </div>
    );
  }

  const maxVal = Math.max(450, ...trials.map(t => t.reactionTimeMs));
  const minVal = Math.min(...trials.map(t => t.reactionTimeMs));

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-semibold text-slate-700">
          {locale === 'zh' ? '单轮反应潜伏期柱状图' : 'Reaction Latency per Trial'}
        </span>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-slate-500">
            {locale === 'zh' ? '中位数: ' : 'Median: '}
            <strong className="text-slate-800">{medianReactionMs} ms</strong>
          </span>
          <span className="text-emerald-600">
            {locale === 'zh' ? '最佳: ' : 'Best: '}
            <strong className="font-semibold">{minVal} ms</strong>
          </span>
        </div>
      </div>

      <div className="relative flex items-end gap-2 w-full pt-4 pb-2" style={{ height: `${height}px` }}>
        {/* Median dashed reference line */}
        <div
          className="absolute inset-x-0 border-t border-cyan-500/60 border-dashed z-10 pointer-events-none"
          style={{ bottom: `${(medianReactionMs / maxVal) * 100}%` }}
        >
          <span className="absolute right-0 -top-4 text-[10px] font-mono text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
            {locale === 'zh' ? '中位值' : 'Median'} {medianReactionMs}ms
          </span>
        </div>

        {trials.map(t => {
          const heightPct = Math.min(100, Math.max(12, (t.reactionTimeMs / maxVal) * 100));
          const isBest = t.reactionTimeMs === minVal;
          const isSlow = t.reactionTimeMs > medianReactionMs + 40;

          return (
            <div key={t.trialNumber} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              <span className="text-[10px] font-mono text-slate-500 mb-1">
                {t.reactionTimeMs}ms
              </span>

              <div
                className={`w-full rounded-t-md transition-all duration-300 relative ${
                  isBest
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : isSlow
                    ? 'bg-amber-400 hover:bg-amber-500'
                    : 'bg-cyan-500 hover:bg-cyan-600'
                }`}
                style={{ height: `${heightPct}%` }}
              />

              <span className="text-[10px] font-mono text-slate-400 mt-2">
                T{t.trialNumber}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
