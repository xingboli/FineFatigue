import React, { useState, useEffect } from 'react';
import { HeartHandshake, Sparkles, RefreshCw, CheckCircle, Clock, ShieldCheck, Flame } from 'lucide-react';
import { MotivationMessage } from '../../types';
import { AiMotivationService } from '../../services/aiMotivationService';
import { useI18n } from '../../i18n/context';

interface FatigueCareCardProps {
  overallScore: number;
  subjectiveRating?: number;
  compact?: boolean;
}

export const FatigueCareCard: React.FC<FatigueCareCardProps> = ({
  overallScore,
  subjectiveRating,
  compact = false
}) => {
  const { locale } = useI18n();
  const [advice, setAdvice] = useState<MotivationMessage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const fetchAdvice = async () => {
    setIsLoading(true);
    try {
      const res = await AiMotivationService.getAdvice({
        overallScore,
        subjectiveRating,
        language: locale === 'zh' ? 'zh' : 'en'
      });
      setAdvice(res);
      setCompletedSteps([]);
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, [overallScore, subjectiveRating, locale]);

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  if (!advice) return null;

  const getTierTheme = (tier: string) => {
    switch (tier) {
      case 'optimal':
        return {
          border: 'border-emerald-200',
          bg: 'bg-gradient-to-br from-emerald-50/70 to-teal-50/40',
          tagBg: 'bg-emerald-100/80 text-emerald-800 border-emerald-300',
          iconColor: 'text-emerald-600',
          drillBorder: 'border-emerald-200/80 bg-white/80'
        };
      case 'mild':
        return {
          border: 'border-cyan-200',
          bg: 'bg-gradient-to-br from-cyan-50/70 to-blue-50/40',
          tagBg: 'bg-cyan-100/80 text-cyan-800 border-cyan-300',
          iconColor: 'text-cyan-600',
          drillBorder: 'border-cyan-200/80 bg-white/80'
        };
      case 'moderate':
        return {
          border: 'border-amber-200',
          bg: 'bg-gradient-to-br from-amber-50/70 to-yellow-50/40',
          tagBg: 'bg-amber-100/80 text-amber-800 border-amber-300',
          iconColor: 'text-amber-600',
          drillBorder: 'border-amber-200/80 bg-white/80'
        };
      case 'high':
      case 'severe':
      default:
        return {
          border: 'border-orange-200',
          bg: 'bg-gradient-to-br from-orange-50/70 to-rose-50/40',
          tagBg: 'bg-orange-100/80 text-orange-800 border-orange-300',
          iconColor: 'text-orange-600',
          drillBorder: 'border-orange-200/80 bg-white/80'
        };
    }
  };

  const theme = getTierTheme(advice.tier);

  return (
    <div className={`rounded-2xl border ${theme.border} ${theme.bg} ${compact ? 'p-4' : 'p-6'} shadow-xs transition-all`}>
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center ${theme.iconColor} shadow-2xs`}>
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {locale === 'zh' ? 'AI 疲劳关怀与激励指引' : 'AI Fatigue Care & Motivation Guidance'}
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${theme.tagBg}`}>
                {advice.source === 'llm_api' ? 'LLM API Connected' : locale === 'zh' ? '本地针对性引擎' : 'Local Rule Engine'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {locale === 'zh'
                ? '依据当前运动稳定性、敲击速率衰退与反应时针对性生成'
                : 'Customized based on your stability, tapping decay, and reaction latency'}
            </p>
          </div>
        </div>

        {/* Refresh / Next Advice button */}
        <button
          type="button"
          onClick={fetchAdvice}
          disabled={isLoading}
          className="p-1.5 rounded-lg border border-slate-200/80 bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 text-xs shadow-2xs transition-colors flex items-center gap-1"
          title={locale === 'zh' ? '换一条关怀与恢复建议' : 'Regenerate advice'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-600' : ''}`} />
          <span className="hidden sm:inline text-[11px] font-medium">
            {locale === 'zh' ? '换一条' : 'Refresh'}
          </span>
        </button>
      </div>

      {/* Main Motivational Message Body */}
      <div className="bg-white/90 rounded-xl p-4 border border-slate-200/80 shadow-2xs mb-3.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>{advice.title}</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {advice.message}
        </p>
        {advice.subtext && (
          <p className="text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100">
            💡 {advice.subtext}
          </p>
        )}
      </div>

      {/* Actionable Recovery Micro-Drill */}
      {advice.recoveryAction && (
        <div className={`rounded-xl p-3.5 border ${theme.drillBorder} space-y-2`}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-700" />
              {advice.recoveryAction.actionTitle}
            </span>
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {advice.recoveryAction.drillDuration}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {advice.recoveryAction.steps.map((step, idx) => {
              const isChecked = completedSteps.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleStep(idx)}
                  className={`w-full text-left flex items-start gap-2.5 p-2 rounded-lg text-xs transition-all ${
                    isChecked
                      ? 'bg-emerald-50/80 text-emerald-900 line-through opacity-80'
                      : 'bg-white/70 hover:bg-white text-slate-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border text-[10px] ${
                    isChecked
                      ? 'bg-emerald-500 border-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}>
                    {isChecked ? '✓' : idx + 1}
                  </span>
                  <span className="leading-tight">{step}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
