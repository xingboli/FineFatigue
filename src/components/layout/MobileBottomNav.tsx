import React, { useState } from 'react';
import { 
  Activity, 
  PlayCircle, 
  BarChart3, 
  Sliders, 
  Menu, 
  X, 
  Radio, 
  Gamepad2, 
  Settings, 
  Cloud, 
  User, 
  FileText 
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { UserProfile, CloudSyncState } from '../../types';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenSync: () => void;
  onOpenFatigueSlider: () => void;
  currentUser: UserProfile | null;
  syncState: CloudSyncState;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  onOpenSync,
  onOpenFatigueSlider,
  currentUser,
  syncState
}) => {
  const { locale, t } = useI18n();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNavClick = (tab: string) => {
    onSelectTab(tab);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 flex items-center justify-around select-none">
        {/* 1. Overview */}
        <button
          type="button"
          onClick={() => handleNavClick('overview')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
            currentTab === 'overview' ? 'text-cyan-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] leading-tight">{locale === 'zh' ? '概览' : 'Overview'}</span>
        </button>

        {/* 2. Assessment (Center Action button) */}
        <button
          type="button"
          onClick={() => handleNavClick('assessment')}
          className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 group"
        >
          <div className={`w-10 h-10 -mt-3 rounded-full flex items-center justify-center text-white shadow-md transition-transform group-active:scale-95 ${
            currentTab === 'assessment' ? 'bg-cyan-700 ring-4 ring-cyan-100' : 'bg-gradient-to-tr from-cyan-600 to-blue-600'
          }`}>
            <PlayCircle className="w-5 h-5" />
          </div>
          <span className={`text-[10px] leading-tight ${currentTab === 'assessment' ? 'text-cyan-700 font-bold' : 'text-slate-500'}`}>
            {locale === 'zh' ? '测验' : 'Assess'}
          </span>
        </button>

        {/* 3. History Comparison */}
        <button
          type="button"
          onClick={() => handleNavClick('sessions')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
            currentTab === 'sessions' ? 'text-cyan-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] leading-tight">{locale === 'zh' ? '历史对比' : 'History'}</span>
        </button>

        {/* 4. Subjective Fatigue Slider Trigger */}
        <button
          type="button"
          onClick={onOpenFatigueSlider}
          className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-slate-800"
        >
          <Sliders className="w-5 h-5 text-amber-500" />
          <span className="text-[10px] leading-tight">{locale === 'zh' ? '疲劳自评' : 'Rating'}</span>
        </button>

        {/* 5. More / Menu Drawer toggle */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
            drawerOpen ? 'text-cyan-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] leading-tight">{locale === 'zh' ? '更多' : 'More'}</span>
        </button>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl p-5 border-t border-slate-200 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentUser?.avatar || '🧑‍🔬'}</span>
                <div>
                  <div className="text-sm font-bold text-slate-900">{currentUser?.name || 'Guest'}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ID: {currentUser?.participantCode || 'NO-ID'} · {syncState.status === 'synced' ? '☁️ 云端已同步' : '🔄 待同步'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenAuth();
                }}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center gap-2"
              >
                <User className="w-4 h-4 text-cyan-600" />
                <span>{locale === 'zh' ? '切换登录账号' : 'Switch User'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenSync();
                }}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center gap-2"
              >
                <Cloud className="w-4 h-4 text-blue-600" />
                <span>{locale === 'zh' ? '云端同步中心' : 'Cloud Sync'}</span>
              </button>
            </div>

            {/* Navigation List */}
            <div className="space-y-1 pt-1">
              <button
                type="button"
                onClick={() => handleNavClick('sensor_monitor')}
                className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-left text-xs font-medium text-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-cyan-600" />
                  <span>{locale === 'zh' ? 'IMU 运动传感器监视器' : 'IMU Sensor Monitor'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">50Hz</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('report')}
                className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-left text-xs font-medium text-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{locale === 'zh' ? '实验报告与衰退对比' : 'Assessment Reports'}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('star_catcher')}
                className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-left text-xs font-medium text-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Gamepad2 className="w-4 h-4 text-purple-600" />
                  <span>{locale === 'zh' ? '手眼协调捕星小游戏' : 'Star Catcher Game'}</span>
                </div>
                <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">Demo</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('settings')}
                className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-left text-xs font-medium text-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>{locale === 'zh' ? '系统参数与重置' : 'System Settings'}</span>
                </div>
              </button>
            </div>

            {/* Bottom Row */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {locale === 'zh' ? '切换界面语言' : 'Interface Language'}:
              </span>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
