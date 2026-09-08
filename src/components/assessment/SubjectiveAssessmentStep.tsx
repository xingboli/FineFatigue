import React, { useState, useRef } from 'react';
import { 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  Info, 
  ShieldCheck, 
  Activity,
  Check
} from 'lucide-react';
import { SubjectiveFatigueRecord } from '../../types';
import { useI18n } from '../../i18n/context';
import { celebrateTaskCompletion } from '../../utils/celebration';

interface SubjectiveAssessmentStepProps {
  onComplete: (record: SubjectiveFatigueRecord) => void;
  onBack?: () => void;
  initialRating?: number;
}

export const SubjectiveAssessmentStep: React.FC<SubjectiveAssessmentStepProps> = ({
  onComplete,
  onBack,
  initialRating = 5
}) => {
  const { locale } = useI18n();
  const [rating, setRating] = useState<number>(initialRating);
  const [selectedSensations, setSelectedSensations] = useState<string[]>([]);
  const [note, setNote] = useState<string>('');
  const trackRef = useRef<HTMLDivElement>(null);

  const getTierInfo = (val: number) => {
    if (val <= 2) {
      return {
        level: 'optimal' as const,
        labelZh: '充沛敏捷 · 无疲劳感',
        labelEn: 'Energized & Sharp · Zero Fatigue',
        color: 'from-emerald-500 to-teal-500',
        textColor: 'text-emerald-700',
        bgLight: 'bg-emerald-50 border-emerald-200'
      };
    }
    if (val <= 4) {
      return {
        level: 'mild' as const,
        labelZh: '状态平稳 · 轻松自如',
        labelEn: 'Stable & Relaxed · Normal',
        color: 'from-teal-500 to-cyan-500',
        textColor: 'text-cyan-700',
        bgLight: 'bg-cyan-50 border-cyan-200'
      };
    }
    if (val <= 6) {
      return {
        level: 'moderate' as const,
        labelZh: '轻度酸胀 · 节奏微缓',
        labelEn: 'Mild Stiffness · Slightly Slow',
        color: 'from-amber-400 to-yellow-500',
        textColor: 'text-amber-700',
        bgLight: 'bg-amber-50 border-amber-200'
      };
    }
    if (val <= 8) {
      return {
        level: 'high' as const,
        labelZh: '明显疲劳 · 指尖沉重',
        labelEn: 'Noticeable Strain · Heavy Fingers',
        color: 'from-orange-500 to-amber-500',
        textColor: 'text-orange-700',
        bgLight: 'bg-orange-50 border-orange-200'
      };
    }
    return {
      level: 'severe' as const,
      labelZh: '极限耗竭 · 动作迟缓',
      labelEn: 'Severe Exhaustion · Impaired Tempo',
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-700',
      bgLight: 'bg-rose-50 border-rose-200'
    };
  };

  const tier = getTierInfo(rating);

  const availableSensations = locale === 'zh' ? [
    '手指发酸',
    '指尖轻微颤动',
    '反应变慢',
    '手腕沉重',
    '握持无力',
    '手背肌腱紧绷',
    '状态良好',
    '注意力下降'
  ] : [
    'Finger Stiffness',
    'Micro-tremble',
    'Delayed Reaction',
    'Heavy Wrist',
    'Grip Weakness',
    'Forearm Tension',
    'Energized',
    'Reduced Focus'
  ];

  const toggleSensation = (sens: string) => {
    setSelectedSensations(prev =>
      prev.includes(sens) ? prev.filter(s => s !== sens) : [...prev, sens]
    );
  };

  const handlePointerScrub = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const step = Math.min(10, Math.max(1, Math.round(ratio * 9) + 1));
    setRating(step);
  };

  const handleConfirm = () => {
    const record: SubjectiveFatigueRecord = {
      id: `SUB-${Date.now().toString(36).toUpperCase()}`,
      timestamp: Date.now(),
      rating,
      level: tier.level,
      sensations: selectedSensations,
      note: note.trim() ? note.trim() : undefined
    };
    celebrateTaskCompletion();
    onComplete(record);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Sequence Timeline Badge: 测验1 + 疲劳 + 测验2 + 疲劳自评 */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800">
        <div className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          <span>{locale === 'zh' ? '多模态实验序列进度' : 'Experimental Sequence Protocol'}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-2 text-slate-300">
            <span className="text-[10px] text-emerald-400 font-mono block">Step 1 · DONE</span>
            <span className="font-semibold text-white">{locale === 'zh' ? '测验 1 (基准)' : 'Test 1 (Base)'}</span>
          </div>
          <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-2 text-slate-300">
            <span className="text-[10px] text-emerald-400 font-mono block">Step 2 · DONE</span>
            <span className="font-semibold text-white">{locale === 'zh' ? '疲劳诱发' : 'Fatigue Load'}</span>
          </div>
          <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-2 text-slate-300">
            <span className="text-[10px] text-emerald-400 font-mono block">Step 3 · DONE</span>
            <span className="font-semibold text-white">{locale === 'zh' ? '测验 2 (复测)' : 'Test 2 (Post)'}</span>
          </div>
          <div className="bg-cyan-950/80 border-2 border-cyan-400 rounded-xl p-2 text-white shadow-xs">
            <span className="text-[10px] text-cyan-300 font-mono font-bold block animate-pulse">Step 4 · CURRENT</span>
            <span className="font-bold text-cyan-200">{locale === 'zh' ? '疲劳自评' : 'Self-Rating'}</span>
          </div>
        </div>
      </div>

      {/* Experimental Protocol & Neutral Independence Notice */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-amber-900 shadow-2xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-amber-950 flex items-center gap-2">
            <span>{locale === 'zh' ? '实验采集多维指标声明' : 'Experimental Multidimensional Metric Notice'}</span>
            <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-mono">
              {locale === 'zh' ? '独立数据采集项' : 'Independent Data'}
            </span>
          </div>
          <p className="text-amber-800/90 leading-relaxed">
            {locale === 'zh' 
              ? '测验1（基准测试）、疲劳挑战与测验2（负荷后复测）已全部完成。本自评环节作为实验采集的多维指标之一，旨在独立记录受试者的主观体感疲劳，以进行生理客观指标与主观感受的相关性比对。'
              : 'Test 1 (Baseline), Fatigue Challenge, and Test 2 (Post-Load) have all concluded. This self-assessment serves as an independent experimental metric to record perceived fatigue alongside objective sensor data.'}
          </p>
          <div className="pt-1 text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>
              {locale === 'zh'
                ? '【重要科研说明】本项自评数据独立归档，不作为系统计算客观生理疲劳指数（0-100）的加权依据。'
                : '【Scientific Protocol】This rating is stored as experimental data and will NOT bias or alter the objective fatigue score calculation.'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Self-Assessment Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-mono text-cyan-700 font-bold uppercase tracking-wider block">
              {locale === 'zh' ? '主观体感 10 级评估' : 'Subjective Rating (1-10)'}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {locale === 'zh' ? '请评估您在完成高负荷测试后的真实疲劳感' : 'Rate Your Current Perceived Fatigue'}
            </h2>
          </div>

          {/* Rating Badge Display */}
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 ${tier.bgLight}`}>
            <div className="text-2xl font-black font-mono text-slate-900">
              {rating}<span className="text-xs font-normal text-slate-400">/10</span>
            </div>
            <div className="text-left">
              <span className={`text-xs font-bold block ${tier.textColor}`}>
                {locale === 'zh' ? tier.labelZh : tier.labelEn}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {locale === 'zh' ? '多维实验参数采集' : 'Experimental Data Point'}
              </span>
            </div>
          </div>
        </div>

        {/* 10-Tier Tactile Sliding Blocks */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{locale === 'zh' ? '1 (精力充沛 · 无疲劳)' : '1 (Optimal · No Fatigue)'}</span>
            <span className="font-mono text-slate-400">{locale === 'zh' ? '滑动或点击色块选择' : 'Tap or scrub blocks'}</span>
            <span>{locale === 'zh' ? '10 (极度耗竭 · 迟缓)' : '10 (Exhausted · Impaired)'}</span>
          </div>

          <div
            ref={trackRef}
            className="grid grid-cols-10 gap-1.5 sm:gap-2 select-none cursor-pointer py-2"
            onPointerDown={e => {
              handlePointerScrub(e.clientX);
              const onMove = (ev: PointerEvent) => handlePointerScrub(ev.clientX);
              const onUp = () => {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
              };
              window.addEventListener('pointermove', onMove);
              window.addEventListener('pointerup', onUp);
            }}
          >
            {Array.from({ length: 10 }).map((_, idx) => {
              const stepVal = idx + 1;
              const isSelected = stepVal === rating;
              const isFilled = stepVal <= rating;

              let blockColor = 'bg-slate-100 hover:bg-slate-200 border-slate-200';
              if (isFilled) {
                if (stepVal <= 2) blockColor = 'bg-emerald-500 border-emerald-600 text-white';
                else if (stepVal <= 4) blockColor = 'bg-teal-500 border-teal-600 text-white';
                else if (stepVal <= 6) blockColor = 'bg-amber-400 border-amber-500 text-slate-900';
                else if (stepVal <= 8) blockColor = 'bg-orange-500 border-orange-600 text-white';
                else blockColor = 'bg-rose-500 border-rose-600 text-white';
              }

              return (
                <button
                  type="button"
                  key={stepVal}
                  onClick={() => setRating(stepVal)}
                  className={`h-14 sm:h-16 rounded-xl border transition-all duration-150 flex flex-col items-center justify-between py-2 text-xs font-mono font-bold relative group ${blockColor} ${
                    isSelected ? 'ring-2 ring-cyan-500 ring-offset-2 scale-105 shadow-md z-10' : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs">{stepVal}</span>
                  {isSelected ? (
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Multidimensional Sensation Checklist */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span>{locale === 'zh' ? '当前主要手部与肢体体感表现（可多选）' : 'Physical Symptoms & Sensations (Multiple)'}</span>
            <span className="text-slate-400 font-normal">({selectedSensations.length} {locale === 'zh' ? '已选' : 'selected'})</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {availableSensations.map(sens => {
              const active = selectedSensations.includes(sens);
              return (
                <button
                  type="button"
                  key={sens}
                  onClick={() => toggleSensation(sens)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                    active
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{sens}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Notes / Qualitative Observation */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>{locale === 'zh' ? '科研实验备忘 / 补充感觉描述 (选填)' : 'Experiment Observation & Qualitative Notes (Optional)'}</span>
            <span className="text-[11px] text-slate-400 font-mono">{note.length}/150</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 150))}
            placeholder={locale === 'zh' ? '例如：手指肌腱酸胀感明显，敲击后程感觉动作节奏难以维持...' : 'e.g., Felt muscle stiffness in index finger, rhythm dropped noticeably during post-load tapping...'}
            rows={2}
            className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none bg-slate-50/50"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{locale === 'zh' ? '返回测验2 (描摹)' : 'Back to Test 2'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold text-xs shadow-md inline-flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{locale === 'zh' ? '保存自评并生成实验报告' : 'Save Self-Rating & View Report'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
