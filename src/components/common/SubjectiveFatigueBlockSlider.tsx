import React, { useState, useRef } from 'react';
import { Sliders, Sparkles, Check, CloudUpload, HeartHandshake } from 'lucide-react';
import { SubjectiveFatigueRecord } from '../../types';
import { StorageService } from '../../services/storage';
import { cloudSyncService } from '../../services/cloudSyncService';
import { useI18n } from '../../i18n/context';

interface SubjectiveFatigueBlockSliderProps {
  initialRating?: number;
  onSaved?: (record: SubjectiveFatigueRecord) => void;
  compact?: boolean;
  linkedSessionId?: string;
}

export const SubjectiveFatigueBlockSlider: React.FC<SubjectiveFatigueBlockSliderProps> = ({
  initialRating = 5,
  onSaved,
  compact = false,
  linkedSessionId
}) => {
  const { locale } = useI18n();
  const [rating, setRating] = useState<number>(initialRating);
  const [selectedSensations, setSelectedSensations] = useState<string[]>([]);
  const [note, setNote] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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
    '手背紧绷',
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

  // Handle pointer scrub / drag on the stepped block track
  const handlePointerScrub = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const step = Math.min(10, Math.max(1, Math.round(ratio * 9) + 1));
    setRating(step);
    setIsSaved(false);
  };

  const handleSaveAndSync = async () => {
    setIsSyncing(true);
    const newRecord = StorageService.addSubjectiveFatigueRecord({
      rating,
      level: tier.level,
      sensations: selectedSensations,
      note: note.trim() || undefined,
      linkedSessionId
    });

    cloudSyncService.markPending();
    await cloudSyncService.syncNow();

    setIsSyncing(false);
    setIsSaved(true);
    if (onSaved) {
      onSaved(newRecord);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs ${compact ? 'p-4' : 'p-6'} space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {locale === 'zh' ? '主观手部疲劳度滑动方块评测' : 'Subjective Hand Fatigue Block Slider'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {locale === 'zh' ? '通过滑动方块自评当前神经肌肉与指尖微运动状态' : 'Slide the block to record your perceived physical fatigue state'}
            </p>
          </div>
        </div>

        {/* Current rating badge */}
        <div className={`px-3 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${tier.bgLight} ${tier.textColor}`}>
          <span className="text-base font-extrabold">{rating}</span>
          <span className="text-[10px] opacity-75">/ 10</span>
        </div>
      </div>

      {/* State Status Banner */}
      <div className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between transition-colors ${tier.bgLight}`}>
        <span className={`font-semibold ${tier.textColor}`}>
          {locale === 'zh' ? tier.labelZh : tier.labelEn}
        </span>
        <span className="text-[10px] font-mono opacity-80">
          {rating <= 3 ? '🟢 低负荷状态' : rating <= 6 ? '🟡 中度负荷状态' : '🔴 高度疲劳状态'}
        </span>
      </div>

      {/* Interactive Sliding Block Stepped Track */}
      <div className="space-y-2 select-none touch-none py-1">
        <div
          ref={trackRef}
          onPointerDown={e => {
            e.currentTarget.setPointerCapture(e.pointerId);
            handlePointerScrub(e.clientX);
          }}
          onPointerMove={e => {
            if (e.buttons > 0) {
              handlePointerScrub(e.clientX);
            }
          }}
          className="relative h-14 bg-slate-100 rounded-2xl p-1.5 flex items-center gap-1 cursor-pointer border border-slate-200/80 shadow-inner"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map(val => {
            const isFilled = val <= rating;
            const isThumb = val === rating;

            return (
              <div
                key={val}
                onClick={() => {
                  setRating(val);
                  setIsSaved(false);
                }}
                className={`flex-1 h-full rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-all relative ${
                  isThumb
                    ? `bg-gradient-to-b ${tier.color} text-white shadow-md scale-105 z-10 ring-2 ring-white`
                    : isFilled
                    ? 'bg-slate-300 text-slate-700'
                    : 'bg-white/70 text-slate-400 hover:bg-white hover:text-slate-700'
                }`}
              >
                <span>{val}</span>
                {isThumb && (
                  <span className="absolute -top-2 w-2 h-2 rotate-45 bg-white border border-slate-300"></span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
          <span>1 ({locale === 'zh' ? '完全清醒/轻松' : 'Fully Rested'})</span>
          <span>5 ({locale === 'zh' ? '中等酸胀' : 'Moderate Strain'})</span>
          <span>10 ({locale === 'zh' ? '极限酸软无力' : 'Exhausted'})</span>
        </div>
      </div>

      {/* Sensation Chips */}
      {!compact && (
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-semibold text-slate-600 block">
            {locale === 'zh' ? '快速添加体感标签 (可选)' : 'Select Observed Sensations (Optional)'}:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableSensations.map(sens => {
              const active = selectedSensations.includes(sens);
              return (
                <button
                  key={sens}
                  type="button"
                  onClick={() => toggleSensation(sens)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-cyan-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sens}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="pt-2 flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400 font-mono">
          {isSaved ? (
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {locale === 'zh' ? '已保存并云端同步' : 'Saved & Synced to Cloud'}
            </span>
          ) : (
            <span>{locale === 'zh' ? '点击确认将同步云端记录' : 'Tap to sync rating to cloud'}</span>
          )}
        </div>

        <button
          type="button"
          disabled={isSyncing}
          onClick={handleSaveAndSync}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
            isSaved
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'bg-cyan-600 hover:bg-cyan-700 text-white'
          }`}
        >
          {isSyncing ? (
            <>
              <CloudUpload className="w-3.5 h-3.5 animate-bounce" />
              <span>{locale === 'zh' ? '云端同步中...' : 'Syncing...'}</span>
            </>
          ) : isSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{locale === 'zh' ? '已更新记录' : 'Saved'}</span>
            </>
          ) : (
            <>
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{locale === 'zh' ? '记录并同步云端' : 'Record & Sync'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
