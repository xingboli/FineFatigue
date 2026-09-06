import React, { useState } from 'react';
import { BarChart3, LineChart, TrendingDown, TrendingUp, Calendar, Clock, ChevronRight, Activity } from 'lucide-react';
import { AssessmentReportData, SubjectiveFatigueRecord } from '../../types';
import { useI18n } from '../../i18n/context';

interface HistoryTimeComparisonChartProps {
  sessions: AssessmentReportData[];
  subjectiveRecords?: SubjectiveFatigueRecord[];
  onSelectSession?: (session: AssessmentReportData) => void;
}

type ChartType = 'line' | 'bar';
type MetricKey = 'overall' | 'stability' | 'tapping' | 'reaction';

export const HistoryTimeComparisonChart: React.FC<HistoryTimeComparisonChartProps> = ({
  sessions,
  subjectiveRecords = [],
  onSelectSession
}) => {
  const { locale } = useI18n();
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [metricKey, setMetricKey] = useState<MetricKey>('overall');

  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs font-mono">
        {locale === 'zh' ? '暂无历史测试数据，完成评估后将自动生成时间对比' : 'No historical session data available'}
      </div>
    );
  }

  // Sort sessions chronologically (oldest to newest for trend left-to-right)
  const sortedSessions = [...sessions].sort((a, b) => a.timestamp - b.timestamp);

  const getMetricData = (s: AssessmentReportData) => {
    switch (metricKey) {
      case 'stability':
        return {
          baseline: s.dimensions?.handStability?.baseline || 80,
          post: s.dimensions?.handStability?.postFatigue || 65,
          unit: 'pts',
          label: locale === 'zh' ? '手部稳定性' : 'Hand Stability',
          isHigherBetter: true
        };
      case 'tapping':
        return {
          baseline: Number((s.baseline?.tapping?.tapRate || 4.2).toFixed(1)),
          post: Number((s.postFatigue?.tapping?.tapRate || 3.4).toFixed(1)),
          unit: 'Hz',
          label: locale === 'zh' ? '交替敲击速率' : 'Tapping Rate',
          isHigherBetter: true
        };
      case 'reaction':
        return {
          baseline: Math.round(s.baseline?.reaction?.medianReactionMs || 280),
          post: Math.round(s.postFatigue?.reaction?.medianReactionMs || 340),
          unit: 'ms',
          label: locale === 'zh' ? '反应潜伏期' : 'Reaction Latency',
          isHigherBetter: false
        };
      case 'overall':
      default:
        return {
          baseline: Math.round(100 - (s.fatigueIndex * 0.3)),
          post: Math.round(100 - s.fatigueIndex),
          unit: 'pts',
          label: locale === 'zh' ? '运动功能状态得分' : 'Motor Performance Score',
          isHigherBetter: true
        };
    }
  };

  // Find max value for charting scale
  const metricValues = sortedSessions.flatMap(s => {
    const m = getMetricData(s);
    return [m.baseline, m.post];
  });
  const maxVal = Math.max(10, ...metricValues) * 1.15;
  const minVal = 0;

  // Chart Dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 30;
  const padBottom = 40;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const sessionCount = sortedSessions.length;
  const stepX = sessionCount > 1 ? plotW / (sessionCount - 1) : plotW / 2;

  // Generate coordinates for line chart
  const baselinePoints = sortedSessions.map((s, idx) => {
    const m = getMetricData(s);
    const x = sessionCount === 1 ? padLeft + plotW / 2 : padLeft + idx * stepX;
    const y = padTop + plotH - (m.baseline / maxVal) * plotH;
    return { x, y, val: m.baseline, s };
  });

  const postPoints = sortedSessions.map((s, idx) => {
    const m = getMetricData(s);
    const x = sessionCount === 1 ? padLeft + plotW / 2 : padLeft + idx * stepX;
    const y = padTop + plotH - (m.post / maxVal) * plotH;
    return { x, y, val: m.post, s };
  });

  const baselinePathD = baselinePoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const postPathD = postPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
      {/* Header with Switchers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {locale === 'zh' ? '实验历史时间对比概览' : 'Historical Time Comparison Overview'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {locale === 'zh'
                  ? '多轮次基准态（Baseline）与负荷后（Post-Fatigue）指标纵向推移'
                  : 'Longitudinal comparison between Baseline and Post-Fatigue states'}
              </p>
            </div>
          </div>
        </div>

        {/* Chart View Toggle & Metric Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMetricKey('overall')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                metricKey === 'overall'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {locale === 'zh' ? '综合表现' : 'Overall'}
            </button>
            <button
              type="button"
              onClick={() => setMetricKey('tapping')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                metricKey === 'tapping'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {locale === 'zh' ? '敲击速率' : 'Tapping'}
            </button>
            <button
              type="button"
              onClick={() => setMetricKey('stability')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                metricKey === 'stability'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {locale === 'zh' ? '稳定性' : 'Stability'}
            </button>
            <button
              type="button"
              onClick={() => setMetricKey('reaction')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                metricKey === 'reaction'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {locale === 'zh' ? '反应时' : 'Reaction'}
            </button>
          </div>

          {/* Line vs Bar Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-cyan-800 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{locale === 'zh' ? '柱形图' : 'Bar'}</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-cyan-800 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>{locale === 'zh' ? '折线图' : 'Line'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-cyan-600"></span>
            <span>{locale === 'zh' ? '基准态 (Baseline)' : 'Baseline'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
            <span>{locale === 'zh' ? '负荷后 (Post-Fatigue)' : 'Post-Fatigue'}</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400">
          {locale === 'zh' ? `共 ${sortedSessions.length} 组时序对比样本` : `${sortedSessions.length} sessions compared`}
        </span>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative w-full overflow-hidden bg-slate-50/60 rounded-xl p-2 border border-slate-100">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
          {/* Grid lines */}
          <line x1={padLeft} y1={padTop} x2={svgWidth - padRight} y2={padTop} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={padLeft} y1={padTop + plotH * 0.5} x2={svgWidth - padRight} y2={padTop + plotH * 0.5} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={padLeft} y1={padTop + plotH} x2={svgWidth - padRight} y2={padTop + plotH} stroke="#cbd5e1" />

          {/* Y axis labels */}
          <text x={padLeft - 6} y={padTop + 4} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono">
            {Math.round(maxVal)}
          </text>
          <text x={padLeft - 6} y={padTop + plotH * 0.5 + 4} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono">
            {Math.round(maxVal * 0.5)}
          </text>
          <text x={padLeft - 6} y={padTop + plotH + 4} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono">
            0
          </text>

          {/* Render based on selected chart type */}
          {chartType === 'line' ? (
            <>
              {/* Baseline Line */}
              <path d={baselinePathD} fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {baselinePoints.map((p, idx) => (
                <g key={`base-${idx}`}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#0891b2" stroke="#ffffff" strokeWidth="2" />
                  <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#0891b2" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                    {p.val}
                  </text>
                </g>
              ))}

              {/* Post Fatigue Line */}
              <path d={postPathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" />
              {postPoints.map((p, idx) => (
                <g key={`post-${idx}`}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                  <text x={p.x} y={p.y + 16} textAnchor="middle" fill="#d97706" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                    {p.val}
                  </text>
                </g>
              ))}

              {/* X Axis Session Labels */}
              {sortedSessions.map((s, idx) => {
                const x = sessionCount === 1 ? padLeft + plotW / 2 : padLeft + idx * stepX;
                return (
                  <text
                    key={s.id}
                    x={x}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                  >
                    {s.dateString || `S${idx + 1}`}
                  </text>
                );
              })}
            </>
          ) : (
            // Bar Chart
            <>
              {sortedSessions.map((s, idx) => {
                const m = getMetricData(s);
                const barGroupWidth = Math.min(48, (plotW / sessionCount) * 0.65);
                const singleBarW = barGroupWidth * 0.45;
                const groupCenterX = padLeft + (idx + 0.5) * (plotW / sessionCount);

                const baseBarH = Math.max(4, (m.baseline / maxVal) * plotH);
                const postBarH = Math.max(4, (m.post / maxVal) * plotH);

                const baseX = groupCenterX - singleBarW - 1.5;
                const postX = groupCenterX + 1.5;

                const baseY = padTop + plotH - baseBarH;
                const postY = padTop + plotH - postBarH;

                // Delta calculation
                const pctChange = m.baseline > 0
                  ? (((m.post - m.baseline) / m.baseline) * 100).toFixed(1)
                  : '0';

                return (
                  <g
                    key={s.id}
                    onClick={() => onSelectSession && onSelectSession(s)}
                    className="cursor-pointer group"
                  >
                    {/* Baseline Bar */}
                    <rect
                      x={baseX}
                      y={baseY}
                      width={singleBarW}
                      height={baseBarH}
                      rx="3"
                      fill="#0891b2"
                      className="transition-all group-hover:fill-cyan-500"
                    />
                    <text x={baseX + singleBarW / 2} y={baseY - 4} textAnchor="middle" fill="#0891b2" fontSize="8" fontFamily="JetBrains Mono">
                      {m.baseline}
                    </text>

                    {/* Post-Fatigue Bar */}
                    <rect
                      x={postX}
                      y={postY}
                      width={singleBarW}
                      height={postBarH}
                      rx="3"
                      fill="#f59e0b"
                      className="transition-all group-hover:fill-amber-400"
                    />
                    <text x={postX + singleBarW / 2} y={postY - 4} textAnchor="middle" fill="#d97706" fontSize="8" fontFamily="JetBrains Mono">
                      {m.post}
                    </text>

                    {/* Session label */}
                    <text
                      x={groupCenterX}
                      y={svgHeight - 14}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                    >
                      {s.dateString || `S${idx + 1}`}
                    </text>

                    {/* Change tag */}
                    <text
                      x={groupCenterX}
                      y={svgHeight - 2}
                      textAnchor="middle"
                      fill={Number(pctChange) < 0 ? '#ef4444' : '#10b981'}
                      fontSize="8"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {Number(pctChange) > 0 ? `+${pctChange}%` : `${pctChange}%`}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      {/* Session Comparison Cards (Mobile friendly list) */}
      <div className="space-y-2 pt-1">
        <div className="text-xs font-semibold text-slate-700">
          {locale === 'zh' ? '时序轮次对比明细' : 'Chronological Session Breakdown'}:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {sortedSessions.map((s, idx) => {
            const m = getMetricData(s);
            const delta = m.baseline !== 0 ? ((m.post - m.baseline) / m.baseline) * 100 : 0;
            const isDecrement = delta < 0;

            return (
              <div
                key={s.id}
                onClick={() => onSelectSession && onSelectSession(s)}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-cyan-400 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{s.dateString}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1 flex items-center gap-2">
                    <span>基准: <strong className="text-cyan-700">{m.baseline} {m.unit}</strong></span>
                    <span>→ 负荷: <strong className="text-amber-700">{m.post} {m.unit}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isDecrement ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {delta > 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`}
                  </span>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                    {s.fatigueLevel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
