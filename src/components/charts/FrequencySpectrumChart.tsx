import React from 'react';

interface FrequencySpectrumChartProps {
  spectrum: { freq: number; power: number }[];
  dominantFrequency?: number;
  compareSpectrum?: { freq: number; power: number }[];
  height?: number;
}

export const FrequencySpectrumChart: React.FC<FrequencySpectrumChartProps> = ({
  spectrum,
  dominantFrequency = 8.2,
  compareSpectrum,
  height = 160
}) => {
  if (!spectrum || spectrum.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs font-mono">
        No spectral data available
      </div>
    );
  }

  const maxPower = Math.max(
    ...spectrum.map(s => s.power),
    ...(compareSpectrum ? compareSpectrum.map(s => s.power) : [0]),
    0.05
  );

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-semibold text-slate-700">0–12 Hz Frequency Spectrum</span>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 text-cyan-700">
            <span className="w-2.5 h-2.5 rounded-xs bg-cyan-600"></span>
            {compareSpectrum ? 'Post-fatigue' : 'Current'}
          </span>
          {compareSpectrum && (
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-300"></span>
              Baseline
            </span>
          )}
          <span className="text-slate-500 ml-2">
            Peak: <strong className="text-slate-800">{dominantFrequency} Hz</strong>
          </span>
        </div>
      </div>

      <div className="relative flex items-end gap-1 w-full" style={{ height: `${height}px` }}>
        {/* Subtle reference grid line */}
        <div className="absolute inset-x-0 top-1/2 border-b border-slate-100 border-dashed" />
        
        {spectrum.map((item, idx) => {
          const heightPct = Math.min(100, Math.max(6, (item.power / maxPower) * 100));
          const isPeak = Math.abs(item.freq - dominantFrequency) < 0.3;
          const baselineItem = compareSpectrum ? compareSpectrum[idx] : null;
          const baseHeightPct = baselineItem ? Math.min(100, (baselineItem.power / maxPower) * 100) : null;

          return (
            <div key={item.freq} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-sm pointer-events-none z-20 whitespace-nowrap">
                {item.freq} Hz: {item.power.toFixed(4)}
              </div>

              {/* Baseline ghost bar if comparing */}
              {baseHeightPct !== null && (
                <div
                  className="absolute bottom-0 w-full bg-slate-200/80 rounded-t-xs"
                  style={{ height: `${baseHeightPct}%` }}
                />
              )}

              {/* Current/Post bar */}
              <div
                className={`w-full rounded-t-xs transition-all duration-300 relative z-10 ${
                  isPeak 
                    ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 ring-1 ring-cyan-500' 
                    : 'bg-cyan-500/70 hover:bg-cyan-500'
                }`}
                style={{ height: `${heightPct}%` }}
              />

              {/* Frequency labels for every 2 Hz */}
              {item.freq % 2 === 0 && (
                <span className="absolute -bottom-5 text-[10px] font-mono text-slate-400">
                  {item.freq}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-between text-[11px] text-slate-400 font-mono">
        <span>0.5 Hz</span>
        <span>Micro-motion Band (0–12 Hz)</span>
        <span>12.0 Hz</span>
      </div>
    </div>
  );
};
