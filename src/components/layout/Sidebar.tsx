import React from 'react';
import { 
  Activity, 
  PlayCircle, 
  History, 
  Radio, 
  FileText, 
  Gamepad2, 
  Settings,
  Sparkles,
  Zap,
  Globe,
  Cloud,
  UserCheck,
  RefreshCw,
  Shield
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { UserProfile, CloudSyncState } from '../../types';

export type PageId = 'overview' | 'assessment' | 'sessions' | 'sensor_monitor' | 'report' | 'star_catcher' | 'settings' | 'admin' | 'monitor' | 'reports' | 'game';

interface SidebarProps {
  currentPage?: string;
  currentTab?: string;
  onNavigate?: (page: string) => void;
  onSelectTab?: (tab: string) => void;
  isAssessmentActive?: boolean;
  onStartAssessment?: () => void;
  currentUser?: UserProfile | null;
  syncState?: CloudSyncState;
  onOpenAuth?: () => void;
  onOpenSync?: () => void;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  currentTab,
  onNavigate,
  onSelectTab,
  isAssessmentActive = false,
  onStartAssessment,
  currentUser,
  syncState,
  onOpenAuth,
  onOpenSync,
  isAdmin = false
}) => {
  const { t, locale, toggleLocale } = useI18n();

  const activeTab = currentTab || currentPage || 'overview';

  const handleSelect = (id: string) => {
    if (onSelectTab) {
      onSelectTab(id);
    } else if (onNavigate) {
      onNavigate(id);
    }
  };

  const navItems = [
    { id: 'overview', label: t.nav.overview, icon: Activity, badge: null },
    { id: 'assessment', label: t.nav.assessment, icon: PlayCircle, badge: isAssessmentActive ? t.nav.badgeActive : null, highlight: true },
    { id: 'sessions', label: t.nav.sessions, icon: History, badge: null },
    { id: 'sensor_monitor', label: t.nav.monitor, icon: Radio, badge: '50Hz' },
    { id: 'report', label: t.nav.reports, icon: FileText, badge: null },
    { id: 'star_catcher', label: t.nav.game, icon: Gamepad2 },
    { id: 'settings', label: t.nav.settings, icon: Settings, badge: null },
    ...(isAdmin ? [{ id: 'admin', label: locale === 'zh' ? '管理员后台' : 'Administration', icon: Shield, badge: null }] : []),
  ];

  const isCurrentActive = (id: string) => {
    if (activeTab === id) return true;
    if (id === 'sensor_monitor' && activeTab === 'monitor') return true;
    if (id === 'report' && activeTab === 'reports') return true;
    if (id === 'star_catcher' && activeTab === 'game') return true;
    return false;
  };

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/80 flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-slate-900 leading-none">
                {t.common.appName}
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">
                {t.common.labSubtitle}
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Card in Sidebar */}
        {currentUser && (
          <div className="px-3 pt-3">
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full p-2.5 rounded-xl border border-slate-200/70 bg-slate-50/70 hover:bg-slate-100 transition-colors text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-lg">{currentUser.avatar || '🧑‍🔬'}</span>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 truncate group-hover:text-cyan-700">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {currentUser.participantCode}
                  </div>
                </div>
              </div>
              <UserCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 shrink-0" />
            </button>
          </div>
        )}

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = isCurrentActive(item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-50 text-cyan-800 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      item.badge === t.nav.badgeActive || item.badge === 'Active'
                        ? 'bg-amber-100 text-amber-700 animate-pulse'
                        : isActive
                        ? 'bg-cyan-100 text-cyan-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / System Status, Cloud Sync & Language Toggle */}
      <div className="p-4 border-t border-slate-100 space-y-2.5">
        {/* Cloud Sync Status Button */}
        {syncState && (
          <button
            type="button"
            onClick={onOpenSync}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100 transition-colors text-xs text-left"
          >
            <div className="flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-cyan-600" />
              <span className="font-semibold text-slate-700">
                {locale === 'zh' ? '云端同步' : 'Cloud Sync'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {syncState.status === 'synced' ? (locale === 'zh' ? '已同步' : 'Synced') : (locale === 'zh' ? '更新中' : 'Syncing')}
            </span>
          </button>
        )}

        {/* Language switch bar in sidebar */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Globe className="w-3.5 h-3.5 text-cyan-600" />
            <span>{t.common.language}</span>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-500 font-medium">Protocol</span>
            <span className="text-[10px] font-mono font-semibold text-cyan-800 bg-cyan-100/70 px-1.5 py-0.2 rounded">
              {t.common.protocolVersion}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 leading-tight">
            {t.common.protocolDesc}
          </div>
        </div>
      </div>
    </aside>
  );
};
