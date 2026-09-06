import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, ArrowRight, CheckCircle, Hand, AlertCircle } from 'lucide-react';
import { TapRecord, TappingMetrics } from '../../types';
import { analyzeTapping } from '../../utils/tappingAnalysis';
import { TapIntervalChart } from '../charts/TapIntervalChart';
import { useI18n } from '../../i18n/context';

interface FingerTappingStepProps {
  isPostFatigue?: boolean;
  onComplete: (metrics: TappingMetrics) => void;
  onBack?: () => void;
}

export const FingerTappingStep: React.FC<FingerTappingStepProps> = ({
  isPostFatigue = false,
  onComplete,
  onBack
}) => {
  const { locale } = useI18n();
  const [stage, setStage] = useState<'idle' | 'recording' | 'finished'>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [tapCount, setTapCount] = useState<number>(0);
  const [currentRate, setCurrentRate] = useState<number>(0);
  const [expectedTarget, setExpectedTarget] = useState<'left' | 'right' | null>(null);
  const [lastTapTarget, setLastTapTarget] = useState<'left' | 'right' | null>(null);

  const startTimeRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const tapsRef = useRef<TapRecord[]>([]);
  const [calculatedMetrics, setCalculatedMetrics] = useState<TappingMetrics | null>(null);
  const [collectionError, setCollectionError] = useState(false);

  // 15 seconds timer
  useEffect(() => {
    if (stage !== 'recording') return;
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        // Update current tap rate
        const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
        if (elapsedSec > 0) {
          setCurrentRate(Number((tapsRef.current.length / elapsedSec).toFixed(2)));
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      if (tapsRef.current.length < 2) {
        setCollectionError(true);
        setStage('idle');
        return;
      }
      const metrics = analyzeTapping(tapsRef.current, 15000);
      setCalculatedMetrics(metrics);
      setStage('finished');
    }
  }, [stage, timeLeft]);

  const handleStart = () => {
    tapsRef.current = [];
    setCollectionError(false);
    setTapCount(0);
    setCurrentRate(0);
    setTimeLeft(15);
    startTimeRef.current = Date.now();
    lastTapTimeRef.current = Date.now();
    setExpectedTarget('left');
    setLastTapTarget(null);
    setStage('recording');
  };

  const handleTap = (target: 'left' | 'right') => {
    if (stage !== 'recording') return;

    const now = Date.now();
    const interval = tapsRef.current.length === 0 ? 0 : now - lastTapTimeRef.current;
    const timeFromStart = now - startTimeRef.current;

    const record: TapRecord = {
      timestamp: now,
      target,
      interval,
      timeFromStart
    };

    tapsRef.current.push(record);
    lastTapTimeRef.current = now;
    setTapCount(tapsRef.current.length);
    setLastTapTarget(target);
    setExpectedTarget(target === 'left' ? 'right' : 'left');

    const elapsedSec = Math.max(0.2, timeFromStart / 1000);
    setCurrentRate(Number((tapsRef.current.length / elapsedSec).toFixed(2)));
  };

  const handleRetry = () => {
    tapsRef.current = [];
    setCalculatedMetrics(null);
    setCollectionError(false);
    setStage('idle');
  };

  const handleProceed = () => {
    if (calculatedMetrics) onComplete(calculatedMetrics);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider font-mono">
                {isPostFatigue 
                  ? (locale === 'zh' ? '负荷后评估环节 · 2/4' : 'Post-Fatigue Assessment · 2/4')
                  : (locale === 'zh' ? '基准评估环节 · 2/4' : 'Baseline Assessment · 2/4')}
              </span>
              {isPostFatigue && (
                <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                  {locale === 'zh' ? '高负荷后复测' : 'Post-Load Verification'}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {locale === 'zh' ? '双靶快速交替敲击耐力测试' : 'Repetitive Tapping Test (Finger Tapping)'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {locale === 'zh'
                ? '使用食指与中指在 15 秒内尽可能快速、稳定地交替敲击“左”和“右”靶标。评估神经肌肉敲击节律、间隔变异性及动作减速衰减。'
                : 'Tap the LEFT and RIGHT targets alternately as quickly and steadily as possible for 15 seconds. Measures motor tempo, rhythm variability, and neuromuscular fatigue deceleration.'}
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
          </div>
        </div>
      </div>

      {stage !== 'finished' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          {collectionError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{locale === 'zh' ? '未记录到足够的真实敲击，本次结果已丢弃。请重新完成测试。' : 'Too few taps were recorded. This attempt was discarded; complete the test again.'}</div>}
          {/* Live Stats Bar */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl font-mono">
            <div className="text-center">
              <div className="text-xs text-slate-400">{locale === 'zh' ? '敲击总次数' : 'Total Taps'}</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{tapCount}</div>
            </div>
            <div className="text-center border-x border-slate-200">
              <div className="text-xs text-slate-400">{locale === 'zh' ? '实时敲击频率' : 'Current Rate'}</div>
              <div className="text-2xl font-bold text-cyan-600 mt-0.5">
                {currentRate} <span className="text-xs font-normal text-slate-400">Hz</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">{locale === 'zh' ? '剩余时间' : 'Time Remaining'}</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{timeLeft}s</div>
            </div>
          </div>

          {stage === 'idle' ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
                <Hand className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-lg font-bold text-slate-900">
                  {locale === 'zh' ? '食指与中指双靶交替敲击' : 'Alternate Index & Middle Finger Taps'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {locale === 'zh'
                    ? '将食指和中指分别悬置于两个靶标上方。点击开始后，以最快且均匀的速度交替敲击左靶与右靶。'
                    : 'Place two fingers over the circles. When started, tap LEFT then RIGHT alternately at maximum sustainable frequency.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold shadow-xs transition-all"
              >
                <Play className="w-4 h-4" />
                <span>{locale === 'zh' ? '开始敲击测试 (15秒)' : 'Start Tapping Test (15s)'}</span>
              </button>
            </div>
          ) : (
            /* Interactive Tapping Target Area */
            <div className="py-6 select-none touch-none">
              <div className="text-center mb-6">
                <span className="text-xs font-mono font-medium text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
                  {expectedTarget 
                    ? (locale === 'zh' ? `下一个目标：敲击 ${expectedTarget === 'left' ? '左侧靶' : '右侧靶'}` : `NEXT: TAP ${expectedTarget.toUpperCase()}`)
                    : (locale === 'zh' ? '左右交替敲击' : 'TAP ALTERNATELY')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                {/* LEFT TARGET */}
                <button
                  type="button"
                  onPointerDown={e => {
                    e.preventDefault();
                    handleTap('left');
                  }}
                  className={`h-48 rounded-3xl font-mono text-2xl font-extrabold flex flex-col items-center justify-center transition-all duration-100 shadow-md active:scale-95 border-2 ${
                    lastTapTarget === 'left'
                      ? 'bg-cyan-600 text-white border-cyan-700 scale-98 shadow-inner'
                      : expectedTarget === 'left'
                      ? 'bg-cyan-50 text-cyan-700 border-cyan-400 hover:bg-cyan-100 ring-4 ring-cyan-200'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{locale === 'zh' ? '左 (LEFT)' : 'LEFT'}</span>
                  <span className="text-[11px] font-sans font-normal opacity-80 mt-1">
                    {locale === 'zh' ? '食指敲击' : 'Index Finger'}
                  </span>
                </button>

                {/* RIGHT TARGET */}
                <button
                  type="button"
                  onPointerDown={e => {
                    e.preventDefault();
                    handleTap('right');
                  }}
                  className={`h-48 rounded-3xl font-mono text-2xl font-extrabold flex flex-col items-center justify-center transition-all duration-100 shadow-md active:scale-95 border-2 ${
                    lastTapTarget === 'right'
                      ? 'bg-blue-600 text-white border-blue-700 scale-98 shadow-inner'
                      : expectedTarget === 'right'
                      ? 'bg-blue-50 text-blue-700 border-blue-400 hover:bg-blue-100 ring-4 ring-blue-200'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{locale === 'zh' ? '右 (RIGHT)' : 'RIGHT'}</span>
                  <span className="text-[11px] font-sans font-normal opacity-80 mt-1">
                    {locale === 'zh' ? '中指敲击' : 'Middle Finger'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {locale === 'zh' ? '手指敲击耐力与动作衰减分析结果' : 'Finger Tapping & Motor Endurance Analysis'}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {locale === 'zh' ? '15秒测试已完成' : '15s Epoch Complete'}
              </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">
                  {locale === 'zh' ? '平均敲击速率' : 'Tap Rate'}
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {calculatedMetrics?.tapRate} <span className="text-xs font-normal text-slate-500">Hz</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {locale === 'zh' ? `总敲击: ${calculatedMetrics?.totalTaps} 次` : `Total taps: ${calculatedMetrics?.totalTaps}`}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">
                  {locale === 'zh' ? '平均敲击间隔 (ITI)' : 'Mean ITI'}
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {calculatedMetrics?.meanITI} <span className="text-xs font-normal text-slate-500">ms</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {locale === 'zh' ? '靶间交替时间' : 'Inter-tap interval'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">
                  {locale === 'zh' ? '节律变异系数 (CV)' : 'Rhythm CV'}
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {calculatedMetrics?.rhythmCV}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {locale === 'zh' ? '动作均匀度波动' : 'Interval variability'}
                </div>
              </div>

              <div className="p-3 bg-cyan-50 border border-cyan-200/80 rounded-xl">
                <div className="text-[11px] text-cyan-800 font-mono font-semibold">
                  {locale === 'zh' ? '疲劳衰减度' : 'Performance Decrement'}
                </div>
                <div className="text-xl font-bold text-cyan-700 mt-1 font-mono">
                  {calculatedMetrics?.performanceDecrement}%
                </div>
                <div className="text-[10px] text-cyan-600 mt-0.5">
                  {locale === 'zh' ? '前5秒 vs 后5秒速率变化' : 'First 5s vs Last 5s'}
                </div>
              </div>
            </div>

            {/* Performance Decrement Breakdown Bar */}
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200/70 rounded-xl">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                {locale === 'zh' ? '分段敲击速率进展趋势 (5秒/区间)' : 'Segmented Motor Tempo Progression'}
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">{locale === 'zh' ? '前 5 秒' : 'First 5s'}</span>
                  <span className="text-sm font-bold text-slate-800">{calculatedMetrics?.first5sRate} taps/s</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">{locale === 'zh' ? '中 5 秒' : 'Middle 5s'}</span>
                  <span className="text-sm font-bold text-slate-800">{calculatedMetrics?.middle5sRate} taps/s</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">{locale === 'zh' ? '后 5 秒' : 'Last 5s'}</span>
                  <span className="text-sm font-bold text-slate-800">{calculatedMetrics?.last5sRate} taps/s</span>
                </div>
              </div>
            </div>

            {/* Tap Interval Chart */}
            <div className="mt-6">
              {calculatedMetrics && (
                <TapIntervalChart taps={calculatedMetrics.taps} />
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
                <span>{locale === 'zh' ? '重新敲击测试' : 'Retry Tapping'}</span>
              </button>

              <button
                type="button"
                onClick={handleProceed}
                disabled={!calculatedMetrics}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold transition-all shadow-xs disabled:opacity-50"
              >
                <span>{locale === 'zh' ? '继续下一步：视觉反应时测试' : 'Continue to Reaction Test'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
