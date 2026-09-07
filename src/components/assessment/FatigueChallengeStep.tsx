import React, { useState, useEffect, useRef } from 'react';
import { Flame, Play, CheckCircle2, Zap } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { DEMO_MODE, EXPERIMENT_TIMINGS } from '../../config/runtime';

interface FatigueChallengeStepProps {
  onComplete: (durationSec: number, totalTaps: number) => void;
}

export const FatigueChallengeStep: React.FC<FatigueChallengeStepProps> = ({ onComplete }) => {
  const { locale } = useI18n();
  const challengeOptions = EXPERIMENT_TIMINGS.challengeOptionsSec;
  const [mode, setMode] = useState<number>(EXPERIMENT_TIMINGS.defaultChallengeSec);
  const [stage, setStage] = useState<'idle' | 'running' | 'finished'>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(EXPERIMENT_TIMINGS.defaultChallengeSec);
  const [tapCount, setTapCount] = useState<number>(0);
  const [currentRate, setCurrentRate] = useState<number>(0);
  const [lastTapSide, setLastTapSide] = useState<'left' | 'right' | null>(null);
  const [measuredDurationSec, setMeasuredDurationSec] = useState(0);

  const startTimeRef = useRef<number>(0);
  const recentTapsRef = useRef<number[]>([]);

  // Energy / Motor Reserve Bar: Starts at 100%, gradually drains as time progresses & based on intensity
  const progressPct = ((mode - timeLeft) / mode) * 100;
  const energyRemainingPct = Math.max(8, Math.round(100 - progressPct * 0.85));

  useEffect(() => {
    if (stage !== 'running') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setMeasuredDurationSec((Date.now() - startTimeRef.current) / 1000);
          setStage('finished');
          return 0;
        }

        // Clean up taps older than 2s for current rate
        const now = Date.now();
        recentTapsRef.current = recentTapsRef.current.filter(t => now - t < 2000);
        const instantRate = recentTapsRef.current.length / 2;
        setCurrentRate(Number(instantRate.toFixed(1)));

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, mode]);

  const handleStart = () => {
    setTimeLeft(mode);
    setTapCount(0);
    setCurrentRate(0);
    recentTapsRef.current = [];
    startTimeRef.current = Date.now();
    setMeasuredDurationSec(0);
    setStage('running');
  };

  const handleTap = (side: 'left' | 'right') => {
    if (stage !== 'running') return;
    const now = Date.now();
    recentTapsRef.current.push(now);
    setTapCount(prev => prev + 1);
    setLastTapSide(side);
  };

  const handleProceedToPost = () => {
    onComplete(measuredDurationSec || (Date.now() - startTimeRef.current) / 1000, tapCount);
  };

  const averageRate = (mode - timeLeft) > 0 ? Number((tapCount / (mode - timeLeft)).toFixed(1)) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider font-mono flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                {locale === 'zh' ? '干预诱发环节 · 肌肉疲劳负荷协议' : 'Intervention Phase · Motor Fatigue Challenge'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {locale === 'zh' ? '高频重复运动负荷诱导挑战' : 'Repetitive High-Tempo Motor Load Challenge'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {locale === 'zh'
                ? '通过快速连续左右交替敲击诱发可控的手部神经肌肉疲劳状态，为后续“负荷后复测”提供可对比的疲劳诱导环境。'
                : 'Induces controlled neuromuscular fatigue through rapid, continuous alternating finger movements. This sets the post-load condition to evaluate performance decrement.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {stage === 'idle' && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setMode(challengeOptions[0]);
                    setTimeLeft(challengeOptions[0]);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    mode === challengeOptions[0] ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {locale === 'zh' ? `${challengeOptions[0]}秒` : `${challengeOptions[0]} seconds`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode(challengeOptions[1]);
                    setTimeLeft(challengeOptions[1]);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    mode === challengeOptions[1] ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {locale === 'zh' ? `${challengeOptions[1]}秒${DEMO_MODE ? '' : ' (深度负荷)'}` : `${challengeOptions[1]}s Protocol`}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {stage !== 'finished' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          {/* Dashboard Telemetry Bar */}
          <div className="grid grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl font-mono text-center">
            <div>
              <div className="text-[11px] text-slate-400">{locale === 'zh' ? '剩余时间' : 'Time Left'}</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{timeLeft}s</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">{locale === 'zh' ? '累计敲击' : 'Tap Count'}</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{tapCount}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">{locale === 'zh' ? '瞬时速率' : 'Current Rate'}</div>
              <div className="text-2xl font-bold text-rose-600 mt-0.5">{currentRate} Hz</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">{locale === 'zh' ? '平均速率' : 'Average Rate'}</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">{averageRate} Hz</div>
            </div>
          </div>

          {/* Dynamic Energy / Performance Reserve Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-500 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {locale === 'zh' ? '神经肌肉能量储备估算' : 'Neuromuscular Energy Reserve'}
              </span>
              <span className={`font-bold ${energyRemainingPct < 35 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {energyRemainingPct}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  energyRemainingPct < 30
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                }`}
                style={{ width: `${energyRemainingPct}%` }}
              />
            </div>
          </div>

          {stage === 'idle' ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <Flame className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-lg font-bold text-slate-900">
                  {locale === 'zh' 
                    ? `${mode} 秒高频交替运动负荷` 
                    : `${mode}-Second Rapid Alternating Motor Load`}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {locale === 'zh'
                    ? '在左右两个靶标间保持极高频交替敲击，诱导手部微动作疲劳与神经冲动衰减，以便进行后测。'
                    : 'Keep up a rapid alternating rhythm between LEFT and RIGHT targets to induce measurable hand fatigue before post-assessment.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-xs transition-all"
              >
                <Play className="w-4 h-4" />
                <span>
                  {locale === 'zh' ? `启动 ${mode}秒 疲劳负荷挑战` : `Start ${mode}s Fatigue Challenge`}
                </span>
              </button>
            </div>
          ) : (
            /* Large Alternating Tapping Pads */
            <div className="py-6 select-none touch-none">
              <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                <button
                  type="button"
                  onPointerDown={e => {
                    e.preventDefault();
                    handleTap('left');
                  }}
                  className={`h-56 rounded-3xl font-mono text-3xl font-extrabold flex flex-col items-center justify-center transition-all duration-75 shadow-md active:scale-95 border-2 ${
                    lastTapSide === 'left'
                      ? 'bg-rose-600 text-white border-rose-700 scale-98'
                      : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                  }`}
                >
                  <span>{locale === 'zh' ? '左侧靶' : 'LEFT'}</span>
                  <span className="text-xs font-sans font-normal opacity-80 mt-2">
                    {locale === 'zh' ? '极速连续交替' : 'Continuous Alternate'}
                  </span>
                </button>

                <button
                  type="button"
                  onPointerDown={e => {
                    e.preventDefault();
                    handleTap('right');
                  }}
                  className={`h-56 rounded-3xl font-mono text-3xl font-extrabold flex flex-col items-center justify-center transition-all duration-75 shadow-md active:scale-95 border-2 ${
                    lastTapSide === 'right'
                      ? 'bg-rose-600 text-white border-rose-700 scale-98'
                      : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                  }`}
                >
                  <span>{locale === 'zh' ? '右侧靶' : 'RIGHT'}</span>
                  <span className="text-xs font-sans font-normal opacity-80 mt-2">
                    {locale === 'zh' ? '极速连续交替' : 'Continuous Alternate'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Challenge Completed Summary */
        <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-slate-900">
              {locale === 'zh' ? '疲劳负荷诱发环节已完成' : 'Fatigue Challenge Complete'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {locale === 'zh'
                ? `在实测 ${measuredDurationSec.toFixed(1)} 秒内共记录 ${tapCount} 次高频敲击。现在进入真实的负荷后复测。`
                : `${tapCount} rapid taps were recorded over a measured ${measuredDurationSec.toFixed(1)} seconds. Continue to the physical post-load assessment.`}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">{locale === 'zh' ? '累计敲击' : 'Taps Logged'}</span>
              <span className="text-base font-bold text-slate-800">{tapCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{locale === 'zh' ? '平均速率' : 'Avg Speed'}</span>
              <span className="text-base font-bold text-slate-800">{averageRate} Hz</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{locale === 'zh' ? '负荷耗竭' : 'Energy Drain'}</span>
              <span className="text-base font-bold text-rose-600">
                -{100 - energyRemainingPct}%
              </span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleProceedToPost}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold shadow-xs transition-all"
            >
              <span>{locale === 'zh' ? '进入负荷后多模态复测 (Post-Fatigue)' : 'Begin Post-Fatigue Assessment'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
