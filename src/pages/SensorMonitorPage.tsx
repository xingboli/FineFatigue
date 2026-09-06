import React, { useState } from 'react';
import { Radio, Play, Square, RefreshCw, Cpu, Activity, Info, Wifi, WifiOff } from 'lucide-react';
import { IMUDataPoint, SensorStatus } from '../types';
import { WaveformCanvas } from '../components/charts/WaveformCanvas';
import { useI18n } from '../i18n/context';

interface SensorMonitorPageProps {
  sensorStatus: SensorStatus;
  currentData: IMUDataPoint | null;
  onToggleStreaming: (start: boolean) => void;
  isStreaming: boolean;
  onSwitchMode: (mode: 'simulator' | 'real') => void;
  mode: 'simulator' | 'real';
}

export const SensorMonitorPage: React.FC<SensorMonitorPageProps> = ({
  sensorStatus,
  currentData,
  onToggleStreaming,
  isStreaming,
  onSwitchMode,
  mode
}) => {
  const { t, locale } = useI18n();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider font-mono">
                {t.monitor.tag}
              </span>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-mono">
                {t.monitor.tagFreq}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              {t.monitor.title}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {t.monitor.desc}
            </p>
          </div>

          {/* Controls: Start/Stop Simulation & Mode switch */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-mono">
              <button
                type="button"
                onClick={() => onSwitchMode('simulator')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  mode === 'simulator'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.monitor.modeSim}
              </button>
              <button
                type="button"
                onClick={() => onSwitchMode('real')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  mode === 'real'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.monitor.modeReal}
              </button>
            </div>

            {/* Stream toggle */}
            <button
              type="button"
              onClick={() => onToggleStreaming(!isStreaming)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                isStreaming
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  : 'bg-cyan-600 text-white hover:bg-cyan-700'
              }`}
            >
              {isStreaming ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{t.monitor.btnStreaming}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t.monitor.btnPaused}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Telemetry Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{t.topbar.imuStatus}</span>
            <div className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {sensorStatus.connected ? t.common.connected : t.common.disconnected}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{t.monitor.cardRate}</span>
            <div className="text-sm font-semibold text-slate-800 font-mono mt-0.5">
              {sensorStatus.samplingRate} Hz
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{t.monitor.cardPackets}</span>
            <div className="text-sm font-semibold text-slate-800 font-mono mt-0.5">
              {sensorStatus.packetsReceived.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{t.monitor.cardLatency}</span>
            <div className="text-sm font-semibold text-emerald-600 font-mono mt-0.5">
              ~{sensorStatus.latencyMs} ms
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{t.calibration.cardStatus}</span>
            <div className="text-sm font-semibold text-cyan-700 mt-0.5">
              {t.calibration.calibratedStatus}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Oscilloscopes */}
      <div className="space-y-6">
        {/* Accelerometer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-slate-900">
                {t.monitor.accelTitle} (g)
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              ax: {currentData?.ax.toFixed(4) ?? '0.0000'} | ay: {currentData?.ay.toFixed(4) ?? '0.0000'} | az: {currentData?.az.toFixed(4) ?? '1.0000'}
            </span>
          </div>

          <WaveformCanvas dataStream={currentData} type="accel" height={190} />
          
          <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
            <span>Range: ±1.5 g (Linear dynamic acceleration with 1g gravitational baseline)</span>
            <span>Continuous scrolling buffer</span>
          </div>
        </div>

        {/* Gyroscope */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-900">
                {t.monitor.gyroTitle} (deg/s)
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              gx: {currentData?.gx.toFixed(2) ?? '0.00'} | gy: {currentData?.gy.toFixed(2) ?? '0.00'} | gz: {currentData?.gz.toFixed(2) ?? '0.00'}
            </span>
          </div>

          <WaveformCanvas dataStream={currentData} type="gyro" height={190} />

          <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
            <span>Angular Velocity Scale: ±25 °/s</span>
            <span>Continuous scrolling buffer</span>
          </div>
        </div>

        {/* Hardware Diagnostics */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-500 leading-relaxed space-y-1">
            <div className="font-semibold text-slate-800">{t.monitor.diagnosticsTitle}</div>
            <div>{t.monitor.diagAdapter}</div>
            <div>{t.monitor.diagFilter}</div>
            <div>{t.monitor.diagNoise}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

