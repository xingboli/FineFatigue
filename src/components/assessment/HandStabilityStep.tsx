import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, ArrowRight, Activity, CheckCircle, ShieldAlert } from 'lucide-react';
import { IMUDataPoint, StabilityMetrics } from '../../types';
import { WaveformCanvas } from '../charts/WaveformCanvas';
import { FrequencySpectrumChart } from '../charts/FrequencySpectrumChart';
import { analyzeHandStability } from '../../utils/signalProcessing';
import { getSensorService } from '../../services/sensorSimulator';
import { useI18n } from '../../i18n/context';

interface HandStabilityStepProps {
  currentData?: IMUDataPoint | null;
  isPostFatigue?: boolean;
  onComplete: (metrics: StabilityMetrics) => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export const HandStabilityStep: React.FC<HandStabilityStepProps> = ({
  currentData: propCurrentData,
  isPostFatigue = false,
  onComplete,
  onBack,
  onSkip
}) => {
  const { locale } = useI18n();
  const [stage, setStage] = useState<'idle' | 'pre-countdown' | 'recording' | 'finished'>('idle');
  const [countdown, setCountdown] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const recordedDataRef = useRef<IMUDataPoint[]>([]);
  const [calculatedMetrics, setCalculatedMetrics] = useState<StabilityMetrics | null>(null);

  // Live data subscription if not passed via props
  const [liveData, setLiveData] = useState<IMUDataPoint | null>(propCurrentData || null);
  useEffect(() => {
    if (propCurrentData !== undefined) return;
    const sensor = getSensorService();
    const unsub = sensor.subscribe((pt) => setLiveData(pt));
    return () => unsub();
  }, [propCurrentData]);

  const currentData = propCurrentData !== undefined ? propCurrentData : liveData;

  // Pre-countdown 3-2-1
  useEffect(() => {
    if (stage !== 'pre-countdown') return;
    if (countdown > 1) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else if (countdown === 1) {
      const t = setTimeout(() => {
        setCountdown(0);
        recordedDataRef.current = [];
        setTimeLeft(15);
        setStage('recording');
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [stage, countdown]);

  // 15s recording timer
  useEffect(() => {
    if (stage !== 'recording') return;
    if (timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(t);
    } else {
      // Complete recording and analyze
      const metrics = analyzeHandStability(recordedDataRef.current, isPostFatigue);
      setCalculatedMetrics(metrics);
      setStage('finished');
    }
  }, [stage, timeLeft, isPostFatigue]);

  // Collect data points during recording
  useEffect(() => {
    if (stage === 'recording' && currentData) {
      recordedDataRef.current.push(currentData);
    }
  }, [stage, currentData]);

  const handleStart = () => {
    setCountdown(3);
    setStage('pre-countdown');
  };

  const handleRetry = () => {
    recordedDataRef.current = [];
    setCalculatedMetrics(null);
    setStage('idle');
  };

  const handleProceed = () => {
    if (calculatedMetrics) {
      onComplete(calculatedMetrics);
    } else {
      const metrics = analyzeHandStability([], isPostFatigue);
      onComplete(metrics);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider font-mono">
                {isPostFatigue 
                  ? (locale === 'zh' ? '负荷后评估环节 · 1/4' : 'Post-Fatigue Assessment · 1/4')
                  : (locale === 'zh' ? '基准评估环节 · 1/4' : 'Baseline Assessment · 1/4')}
              </span>
              {isPostFatigue && (
                <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                  {locale === 'zh' ? '高负荷后复测' : 'Post-Load Verification'}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {locale === 'zh' ? '手部姿态稳定性与微动分析' : 'Hand Stability & Micro-motion Analysis'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {locale === 'zh'
                ? '请将手部自然悬空或平放保持静止 15 秒。IMU 传感器将实时捕获生理性微动、姿态漂移及 0–12 Hz 频带能量分布。'
                : 'Keep your hand naturally still and relaxed for 15 seconds. The IMU captures physiological micro-motion, positional drift, and frequency power in the 0–12 Hz band.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                {locale === 'zh' ? '返回上一步' : 'Back'}
              </button>
            )}
            {onSkip && (
              <button
                type="button"
                onClick={() => {
                  const m = analyzeHandStability([], isPostFatigue);
                  onComplete(m);
                }}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                {locale === 'zh' ? '跳过此项' : 'Skip Test'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Testing View */}
      {stage !== 'finished' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/70 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold font-mono">
                {stage === 'recording' ? `${timeLeft}s` : '15s'}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {stage === 'idle' && (locale === 'zh' ? '已准备就绪，点击开始采集 15 秒静止稳定性' : 'Ready to Begin Hand Stability Recording')}
                  {stage === 'pre-countdown' && (locale === 'zh' ? `倒计时 ${countdown} 秒... 请保持手部绝对静止！` : `Starting in ${countdown}... Hold still!`)}
                  {stage === 'recording' && (locale === 'zh' ? `正在采集手部静止微动信号 (剩余 ${timeLeft} 秒)` : `Recording Hand Stability (${timeLeft}s remaining)`)}
                </div>
                <div className="text-xs text-slate-500">
                  {stage === 'idle' && (locale === 'zh' ? '手臂放松，自然握持传感器或平放手背。' : 'Rest your forearm and hold the sensor naturally.')}
                  {stage === 'pre-countdown' && (locale === 'zh' ? '手指微屈放松，避免肌肉突然抽动。' : 'Keep fingers relaxed and avoid sudden twitches.')}
                  {stage === 'recording' && (locale === 'zh' ? '以 50 Hz 高频连续记录三轴加速度与角速度信号。' : 'Continuous 50 Hz inertial motion stream logging.')}
                </div>
              </div>
            </div>

            <div>
              {stage === 'idle' && (
                <button
                  type="button"
                  onClick={handleStart}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold transition-all shadow-xs"
                >
                  <Play className="w-4 h-4" />
                  <span>{locale === 'zh' ? '开始采集' : 'Start Recording'}</span>
                </button>
              )}
              {stage === 'recording' && (
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  {locale === 'zh' ? '正在记录惯性遥测数据' : 'RECORDING INERTIAL TELEMETRY'}
                </div>
              )}
            </div>
          </div>

          {/* Real-time Oscilloscopes during recording */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1.5">
                {locale === 'zh' ? '动态加速度三轴实时波形' : 'Dynamic Acceleration Waveform (3-Axis)'}
              </div>
              <WaveformCanvas dataStream={currentData} type="accel" height={150} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1.5">
                {locale === 'zh' ? '角速度陀螺仪波形' : 'Angular Velocity Waveform (Gyroscope)'}
              </div>
              <WaveformCanvas dataStream={currentData} type="gyro" height={150} />
            </div>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {locale === 'zh' ? '手部姿态稳定性分析结果' : 'Hand Stability & Micro-motion Results'}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {locale === 'zh' ? '15秒时域频域特征提取完成' : '15s Epoch Processed'}
              </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">
                  {locale === 'zh' ? '均方根抖动 (RMS)' : 'Motion RMS'}
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {calculatedMetrics?.motionRMS} <span className="text-xs font-normal text-slate-500">g</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {locale === 'zh' ? '微位移能量' : 'Displacement energy'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">
                  {locale === 'zh' ? '微动主频' : 'Dominant Freq'}
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {calculatedMetrics?.dominantFrequency} <span className="text-xs font-normal text-slate-500">Hz</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {locale === 'zh' ? '峰值功率频率' : 'Micro-motion peak'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">
                  {locale === 'zh' ? '0–12 Hz 谱功率' : '0–12 Hz Power'}
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {calculatedMetrics?.totalPower0_12Hz}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {locale === 'zh' ? '频带总功率' : 'Total spectral power'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">
                  {locale === 'zh' ? '谱熵复杂度' : 'Spectral Entropy'}
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {calculatedMetrics?.spectralEntropy}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {locale === 'zh' ? '频域离散度' : 'Signal complexity'}
                </div>
              </div>

              <div className="p-3 bg-cyan-50 border border-cyan-200/80 rounded-xl">
                <div className="text-[11px] text-cyan-800 font-mono font-semibold">
                  {locale === 'zh' ? '稳定性得分' : 'Stability Score'}
                </div>
                <div className="text-xl font-bold text-cyan-700 mt-1 font-mono">
                  {calculatedMetrics?.stabilityScore} <span className="text-xs font-normal text-cyan-600">/ 100</span>
                </div>
                <div className="text-[10px] text-cyan-600 mt-0.5">
                  {locale === 'zh' ? '综合稳定指数' : 'Overall index'}
                </div>
              </div>
            </div>

            {/* Frequency Spectrum Graph */}
            <div className="mt-6">
              {calculatedMetrics && (
                <FrequencySpectrumChart
                  spectrum={calculatedMetrics.spectrum}
                  dominantFrequency={calculatedMetrics.dominantFrequency}
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{locale === 'zh' ? '重新采集' : 'Retry Recording'}</span>
              </button>

              <button
                type="button"
                onClick={handleProceed}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold transition-all shadow-xs"
              >
                <span>{locale === 'zh' ? '继续下一步：手指敲击测试' : 'Continue to Finger Tapping'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
