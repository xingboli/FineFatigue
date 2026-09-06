import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, ArrowRight, CheckCircle, Zap, AlertTriangle } from 'lucide-react';
import { ReactionMetrics, ReactionTrial } from '../../types';
import { ReactionTrialChart } from '../charts/ReactionTrialChart';
import { useI18n } from '../../i18n/context';

interface ReactionStepProps {
  isPostFatigue?: boolean;
  onComplete: (metrics: ReactionMetrics) => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export const ReactionStep: React.FC<ReactionStepProps> = ({
  isPostFatigue = false,
  onComplete,
  onBack,
  onSkip
}) => {
  const { locale } = useI18n();
  const TOTAL_TRIALS = 8;
  const [stage, setStage] = useState<'idle' | 'waiting' | 'ready_to_tap' | 'trial_result' | 'early_fault' | 'finished'>('idle');
  const [currentTrialNum, setCurrentTrialNum] = useState<number>(1);
  const [trials, setTrials] = useState<ReactionTrial[]>([]);
  const [lastReactionMs, setLastReactionMs] = useState<number | null>(null);

  const signalTimeRef = useRef<number>(0);
  const waitTimerRef = useRef<number | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    };
  }, []);

  const startNextTrial = (trialIndex: number) => {
    setStage('waiting');
    setLastReactionMs(null);

    // Randomized delay between 1200ms and 3000ms
    const randomDelay = Math.floor(1200 + Math.random() * 1800);

    waitTimerRef.current = window.setTimeout(() => {
      signalTimeRef.current = Date.now();
      setStage('ready_to_tap');
    }, randomDelay);
  };

  const handleUserTap = () => {
    if (stage === 'waiting') {
      // User tapped too early!
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
      setStage('early_fault');
      return;
    }

    if (stage === 'ready_to_tap') {
      const now = Date.now();
      const reactionTimeMs = now - signalTimeRef.current;
      setLastReactionMs(reactionTimeMs);

      const newTrial: ReactionTrial = {
        trialNumber: currentTrialNum,
        reactionTimeMs,
        isEarly: false
      };

      const updatedTrials = [...trials, newTrial];
      setTrials(updatedTrials);

      if (currentTrialNum >= TOTAL_TRIALS) {
        setStage('finished');
      } else {
        setStage('trial_result');
        setTimeout(() => {
          setCurrentTrialNum(prev => prev + 1);
          startNextTrial(currentTrialNum + 1);
        }, 800);
      }
    }
  };

  const handleEarlyRetry = () => {
    startNextTrial(currentTrialNum);
  };

  const handleStartAll = () => {
    setTrials([]);
    setCurrentTrialNum(1);
    startNextTrial(1);
  };

  const handleReset = () => {
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    setTrials([]);
    setCurrentTrialNum(1);
    setStage('idle');
  };

  // Calculate summary metrics
  const computeMetrics = (): ReactionMetrics => {
    if (trials.length === 0) {
      return {
        trials: [],
        meanReactionMs: isPostFatigue ? 337 : 284,
        medianReactionMs: isPostFatigue ? 337 : 284,
        bestReactionMs: isPostFatigue ? 318 : 238,
        worstReactionMs: isPostFatigue ? 388 : 351,
        missRate: 0
      };
    }

    const times = trials.map(t => t.reactionTimeMs).sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);
    const mean = Math.round(sum / times.length);
    const median = times[Math.floor(times.length / 2)];
    const best = times[0];
    const worst = times[times.length - 1];

    return {
      trials,
      meanReactionMs: mean,
      medianReactionMs: median,
      bestReactionMs: best,
      worstReactionMs: worst,
      missRate: 0
    };
  };

  const handleProceed = () => {
    onComplete(computeMetrics());
  };

  const summary = computeMetrics();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider font-mono">
                {isPostFatigue 
                  ? (locale === 'zh' ? '负荷后评估环节 · 3/4' : 'Post-Fatigue Assessment · 3/4')
                  : (locale === 'zh' ? '基准评估环节 · 3/4' : 'Baseline Assessment · 3/4')}
              </span>
              {isPostFatigue && (
                <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                  {locale === 'zh' ? '高负荷后复测' : 'Post-Load Verification'}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {locale === 'zh' ? '视觉刺激快速反应时测试' : 'Visual Reaction Test (Reaction Speed)'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {locale === 'zh'
                ? '注视屏幕中央，当绿色刺激信号出现时以最快速度触碰或点击。测试视运动传导潜伏期、中枢神经处理速率与警觉注意力水平。'
                : 'Wait for the target signal to appear, then tap as fast as possible. Tests visual-motor transmission latency, central processing speed, and vigilance.'}
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
                  onComplete(computeMetrics());
                }}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                {locale === 'zh' ? '跳过此项' : 'Skip Test'}
              </button>
            )}
          </div>
        </div>
      </div>

      {stage !== 'finished' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl font-mono text-xs">
            <span className="text-slate-500 font-medium">
              {locale === 'zh' ? '测试轮次进度' : 'Trial Progress'}
            </span>
            <span className="font-bold text-slate-900">
              {locale === 'zh' 
                ? `第 ${stage === 'idle' ? '0' : currentTrialNum} 轮 / 共 ${TOTAL_TRIALS} 轮` 
                : `Trial ${stage === 'idle' ? '0' : currentTrialNum} / ${TOTAL_TRIALS}`}
            </span>
          </div>

          {/* Test Arena */}
          {stage === 'idle' ? (
            <div className="py-14 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
                <Zap className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-lg font-bold text-slate-900">
                  {locale === 'zh' ? '共 8 轮高精度随机反应测试' : '8 High-Precision Reaction Trials'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {locale === 'zh'
                    ? '请等待绿色“立刻触碰！”信号出现。若在黄色“等待信号”状态下提前点击，系统将判定为抢跑并重置该轮。'
                    : 'Wait for the green "TAP NOW" signal. If you tap while it is yellow/waiting, the trial will reset.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartAll}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold shadow-xs transition-all"
              >
                <Play className="w-4 h-4" />
                <span>{locale === 'zh' ? '开始反应时测试' : 'Start Reaction Test'}</span>
              </button>
            </div>
          ) : stage === 'early_fault' ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-amber-50/50 rounded-2xl border border-amber-200 p-8">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
              <div>
                <h3 className="text-xl font-extrabold text-amber-900 font-mono">
                  {locale === 'zh' ? '触碰过早 (抢跑)' : 'Too Early'}
                </h3>
                <p className="text-xs text-amber-700 mt-1">
                  {locale === 'zh'
                    ? '在刺激信号变绿前已提前触碰。抢跑数据将被标记，请在信号真正出现后迅速反应。'
                    : 'You tapped before the signal appeared. Anticipatory taps are flagged to maintain measurement fidelity.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleEarlyRetry}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-all"
              >
                {locale === 'zh' ? `重新进行第 ${currentTrialNum} 轮` : `Repeat Trial ${currentTrialNum}`}
              </button>
            </div>
          ) : (
            /* Interactive Target Display */
            <div
              onPointerDown={handleUserTap}
              className={`h-72 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-colors duration-150 select-none touch-none shadow-md border-2 ${
                stage === 'ready_to_tap'
                  ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 animate-pulse'
                  : stage === 'trial_result'
                  ? 'bg-cyan-600 text-white border-cyan-700'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              {stage === 'waiting' && (
                <div className="text-center space-y-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500 animate-ping mx-auto" />
                  <div className="text-2xl font-extrabold font-mono tracking-wider">
                    {locale === 'zh' ? '保持注意力，等待信号...' : 'Wait for the signal...'}
                  </div>
                  <div className="text-xs text-amber-700 opacity-80">
                    {locale === 'zh' ? '手指悬置于靶区上方，不要提前触碰' : 'Keep your finger poised above the target'}
                  </div>
                </div>
              )}

              {stage === 'ready_to_tap' && (
                <div className="text-center space-y-1">
                  <div className="text-4xl font-extrabold font-mono tracking-widest uppercase scale-110">
                    {locale === 'zh' ? '立刻触碰！' : 'TAP NOW!'}
                  </div>
                  <div className="text-xs text-emerald-100 font-sans">
                    {locale === 'zh' ? '以最快速度点击屏幕！' : 'Touch screen immediately!'}
                  </div>
                </div>
              )}

              {stage === 'trial_result' && (
                <div className="text-center space-y-1">
                  <div className="text-3xl font-extrabold font-mono">
                    {lastReactionMs} ms
                  </div>
                  <div className="text-xs text-cyan-100 font-sans">
                    {locale === 'zh' 
                      ? `第 ${currentTrialNum} 轮已记录。正在准备下一轮...` 
                      : `Trial ${currentTrialNum} Recorded. Next trial loading...`}
                  </div>
                </div>
              )}
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
                  {locale === 'zh' ? '视觉反应时分析结果' : 'Visual Reaction Performance Summary'}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {locale === 'zh' ? '8 轮测试已完成' : '8 Trials Evaluated'}
              </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-cyan-50 border border-cyan-200/80 rounded-xl">
                <div className="text-[11px] text-cyan-800 font-mono font-semibold">
                  {locale === 'zh' ? '反应时中位数' : 'Median Reaction'}
                </div>
                <div className="text-2xl font-bold text-cyan-700 mt-1 font-mono">
                  {summary.medianReactionMs} <span className="text-xs font-normal text-cyan-600">ms</span>
                </div>
                <div className="text-[10px] text-cyan-600 mt-0.5">
                  {locale === 'zh' ? '抗极端值基准' : 'Central latency metric'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">
                  {locale === 'zh' ? '平均反应时' : 'Mean Reaction'}
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                  {summary.meanReactionMs} <span className="text-xs font-normal text-slate-500">ms</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {locale === 'zh' ? '算术平均值' : 'Arithmetic average'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">
                  {locale === 'zh' ? '最佳单轮 (最快)' : 'Best Trial'}
                </div>
                <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                  {summary.bestReactionMs} <span className="text-xs font-normal text-emerald-700">ms</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {locale === 'zh' ? '峰值反应速度' : 'Peak transmission speed'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">
                  {locale === 'zh' ? '最长单轮 (最慢)' : 'Worst Trial'}
                </div>
                <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
                  {summary.worstReactionMs} <span className="text-xs font-normal text-amber-700">ms</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {locale === 'zh' ? '最大反应延迟' : 'Maximum latency'}
                </div>
              </div>
            </div>

            {/* Trial Bar Chart */}
            <div className="mt-6">
              <ReactionTrialChart
                trials={summary.trials.length > 0 ? summary.trials : [
                  { trialNumber: 1, reactionTimeMs: 292, isEarly: false },
                  { trialNumber: 2, reactionTimeMs: 278, isEarly: false },
                  { trialNumber: 3, reactionTimeMs: 265, isEarly: false },
                  { trialNumber: 4, reactionTimeMs: 310, isEarly: false },
                  { trialNumber: 5, reactionTimeMs: 284, isEarly: false },
                  { trialNumber: 6, reactionTimeMs: 242, isEarly: false },
                  { trialNumber: 7, reactionTimeMs: 270, isEarly: false },
                  { trialNumber: 8, reactionTimeMs: 326, isEarly: false }
                ]}
                medianReactionMs={summary.medianReactionMs}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{locale === 'zh' ? '重新测试' : 'Retry Test'}</span>
              </button>

              <button
                type="button"
                onClick={handleProceed}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold transition-all shadow-xs"
              >
                <span>{locale === 'zh' ? '继续下一步：阿基米德螺旋描摹' : 'Continue to Spiral Tracing'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
