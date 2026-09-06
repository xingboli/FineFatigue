import React from 'react';
import { TapRecord } from '../../types';
import { useI18n } from '../../i18n/context';

interface TapIntervalChartProps {
  taps: TapRecord[];
  height?: number;
}

export const TapIntervalChart: React.FC<TapIntervalChartProps> = ({ taps, height = 150 }) => {
  const { locale } = useI18n();
  const validTaps = taps.filter(t => t.interval > 0);
  if (validTaps.length < 3) {
    return (
      <div className="h-36 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs font-mono">
        {locale === 'zh' ? '敲击数据不足，无法绘制间隔曲线' : 'Insufficient tap data to plot intervals'}
      </div>
    );
  }

  const maxInterval = Math.max(450, ...validTaps.map(t => t.interval));
  const minInterval = Math.min(150, ...validTaps.map(t => t.interval));
  const range = Math.max(50, maxInterval - minInterval);

  // SVG Coordinates
  const svgWidth = 600;
  const svgHeight = height;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 25;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const points = validTaps.map(t => {
    const x = paddingLeft + (Math.min(15000, t.timeFromStart) / 15000) * plotWidth;
    const y = paddingTop + plotHeight - ((t.interval - minInterval) / range) * plotHeight;
    return { x, y, ...t };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  // 5-second zone boundaries
  const x5s = paddingLeft + (5000 / 15000) * plotWidth;
  const x10s = paddingLeft + (10000 / 15000) * plotWidth;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="font-semibold text-slate-700">
          {locale === 'zh' ? '敲击间隔时间演化曲线 (ITI Progression)' : 'Inter-Tap Interval (ITI) Progression'}
        </span>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-cyan-600"></span>
            {locale === 'zh' ? '敲击间隔 (ms)' : 'Tap Interval (ms)'}
          </span>
          <span className="text-slate-400">
            {locale === 'zh' ? `共 ${validTaps.length} 次敲击` : `Total: ${validTaps.length} taps`}
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
          {/* Segment zone backgrounds */}
          <rect x={paddingLeft} y={paddingTop} width={x5s - paddingLeft} height={plotHeight} fill="#f8fafc" />
          <rect x={x5s} y={paddingTop} width={x10s - x5s} height={plotHeight} fill="#f1f5f9" opacity={0.6} />
          <rect x={x10s} y={paddingTop} width={svgWidth - paddingRight - x10s} height={plotHeight} fill="#f8fafc" />

          {/* Segment divider lines */}
          <line x1={x5s} y1={paddingTop} x2={x5s} y2={paddingTop + plotHeight} stroke="#cbd5e1" strokeDasharray="3 3" />
          <line x1={x10s} y1={paddingTop} x2={x10s} y2={paddingTop + plotHeight} stroke="#cbd5e1" strokeDasharray="3 3" />

          {/* Segment labels */}
          <text x={(paddingLeft + x5s) / 2} y={paddingTop + 14} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">
            {locale === 'zh' ? '前 5 秒' : 'First 5s'}
          </text>
          <text x={(x5s + x10s) / 2} y={paddingTop + 14} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">
            {locale === 'zh' ? '中 5 秒' : 'Middle 5s'}
          </text>
          <text x={(x10s + svgWidth - paddingRight) / 2} y={paddingTop + 14} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">
            {locale === 'zh' ? '后 5 秒' : 'Last 5s'}
          </text>

          {/* Horizontal grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={svgWidth - paddingRight} y2={paddingTop} stroke="#f1f5f9" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight / 2} x2={svgWidth - paddingRight} y2={paddingTop + plotHeight / 2} stroke="#f1f5f9" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight} x2={svgWidth - paddingRight} y2={paddingTop + plotHeight} stroke="#e2e8f0" />

          {/* Y Axis Labels */}
          <text x={paddingLeft - 8} y={paddingTop + 4} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono">
            {Math.round(maxInterval)}ms
          </text>
          <text x={paddingLeft - 8} y={paddingTop + plotHeight} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono">
            {Math.round(minInterval)}ms
          </text>

          {/* Data Path */}
          <path d={pathD} fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Tap Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={idx % 2 === 0 ? '3' : '2.5'}
              fill={p.target === 'left' ? '#0891b2' : '#0284c7'}
              stroke="#ffffff"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
      <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono mt-1 px-1">
        <span>0s ({locale === 'zh' ? '起点' : 'Start'})</span>
        <span>{locale === 'zh' ? '疲劳演化趋势 (间隔越高代表按键速率下降)' : 'Fatigue Progression (Higher interval = slower tapping)'}</span>
        <span>15s ({locale === 'zh' ? '终点' : 'End'})</span>
      </div>
    </div>
  );
};
