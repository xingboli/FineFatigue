import React from 'react';
import { Radio, CheckCircle2, PlayCircle, Cloud, User } from 'lucide-react';
import { SensorStatus, UserProfile, CloudSyncState } from '../../types';
import { useI18n } from '../../i18n/context';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

interface TopBarProps {
  subjectId: string;
  sensorStatus: SensorStatus;
  currentUser?: UserProfile | null;
  syncState?: CloudSyncState;
  onStartAssessment?: () => void;
  onOpenSettings?: () => void;
  onOpenAuth?: () => void;
  onOpenSync?: () => void;
  currentStepTitle?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  subjectId,
  sensorStatus,
  currentUser,
  syncState,
  onStartAssessment,
  onOpenSettings,
  onOpenAuth,
  onOpenSync,
  currentStepTitle
}) => {
  const { t, locale } = useI18n();

  return (
    <header className="h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {currentStepTitle ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 shrink-0">
              {t.topbar.activeAssessment}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
              {currentStepTitle}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 hover:bg-slate-100 p-1 rounded-lg transition-colors text-left"
            >
              <span className="text-base sm:text-lg">{currentUser?.avatar || '👨‍🔬'}</span>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 font-mono block truncate max-w-[120px] sm:max-w-none">
                  {currentUser?.name || subjectId}
                </span>
                <span className="text-[9px] text-slate-400 font-mono hidden sm:block">
                  {currentUser?.participantCode || t.topbar.sessionLabId}
                </span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Right Action & Telemetry Badges */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs">
        {/* Cloud Sync Status Badge Button */}
        {onOpenSync && (
          <button
            type="button"
            onClick={onOpenSync}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 font-mono transition-colors text-slate-700"
            title={locale === 'zh' ? '点击管理云端同步' : 'Cloud Sync'}
          >
            <Cloud className="w-3.5 h-3.5 text-cyan-600" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden md:inline text-[11px] font-semibold text-emerald-700">
              {syncState?.status === 'synced' ? (locale === 'zh' ? '云端已同步' : 'Synced') : (locale === 'zh' ? '同步中' : 'Syncing')}
            </span>
          </button>
        )}

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* IMU Connection Status (compact on mobile) */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-500 hidden md:inline">{t.topbar.imuStatus}</span>
          <span className={`font-semibold ${sensorStatus.connected ? 'text-emerald-700' : 'text-amber-700'}`}>
            {sensorStatus.connected ? t.common.connected : (locale === 'zh' ? 'IMU 不可用' : 'IMU unavailable')}
          </span>
        </div>

        {/* Touch Input Status (Desktop only) */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
          <span className="text-slate-500">{t.topbar.touchStatus}</span>
          <span className="font-semibold text-cyan-700">{t.common.ready}</span>
        </div>

        {/* User Account Login Button */}
        {onOpenAuth && (
          <button
            type="button"
            onClick={onOpenAuth}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 sm:border-transparent transition-colors"
            title={locale === 'zh' ? '登录与受试者切换' : 'Account profile'}
          >
            <User className="w-4 h-4 text-slate-600" />
          </button>
        )}

        {onStartAssessment && (
          <button
            type="button"
            onClick={onStartAssessment}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-xs shadow-xs transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>{t.topbar.newAssessment}</span>
          </button>
        )}
      </div>
    </header>
  );
};
