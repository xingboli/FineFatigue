import React, { useState } from 'react';
import { X, User, LogIn, LogOut, Check, Shield, Sparkles, UserCheck } from 'lucide-react';
import { UserProfile } from '../../types';
import { authService, PRESET_DEMO_USERS } from '../../services/authService';
import { useI18n } from '../../i18n/context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChanged: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged
}) => {
  const { locale } = useI18n();
  const [customName, setCustomName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'participant' | 'researcher'>('participant');

  if (!isOpen) return null;

  const handleSelectPreset = (user: UserProfile) => {
    authService.loginPreset(user);
    onUserChanged(user);
    onClose();
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newUser = authService.login(customName, selectedRole);
    onUserChanged(newUser);
    setCustomName('');
    onClose();
  };

  const handleLogout = () => {
    authService.logout();
    onUserChanged(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                {locale === 'zh' ? '用户身份与实验账号' : 'Account & Authentication'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {locale === 'zh' ? '支持受试人员身份切换及数据云端关联' : 'Switch participant ID or researcher profile'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Current Active User Banner */}
          {currentUser ? (
            <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentUser.avatar || '🧑‍🔬'}</span>
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                      {currentUser.role === 'researcher' ? (locale === 'zh' ? '实验导师/研究员' : 'Researcher') : (locale === 'zh' ? '受试者' : 'Participant')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    ID: {currentUser.participantCode} · {currentUser.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors font-medium flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>{locale === 'zh' ? '退出' : 'Logout'}</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              {locale === 'zh' ? '当前处于访客模式，选择或输入账号以关联云端数据' : 'Guest mode active. Log in to sync data.'}
            </div>
          )}

          {/* Quick 1-Click Preset Demo Accounts */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              {locale === 'zh' ? '快速切换演示账号 (一键登入)' : 'Quick Preset Demo Profiles'}:
            </label>
            <div className="space-y-1.5">
              {PRESET_DEMO_USERS.map(user => {
                const isActive = currentUser?.id === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectPreset(user)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isActive
                        ? 'border-cyan-500 bg-cyan-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{user.avatar}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{user.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {user.participantCode} · {user.email}
                        </div>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="text-xs text-cyan-600 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>{locale === 'zh' ? '当前' : 'Active'}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 hover:text-slate-600">
                        {locale === 'zh' ? '登入' : 'Select'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Login / Registration Form */}
          <form onSubmit={handleCustomLogin} className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">
              {locale === 'zh' ? '或输入自定义受试者编号' : 'Or Custom Participant Login'}:
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder={locale === 'zh' ? '如: 实验组受试者 C-09' : 'e.g. Subject C-09'}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-slate-50/50"
              />
              <button
                type="submit"
                disabled={!customName.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                {locale === 'zh' ? '登录' : 'Sign In'}
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  checked={selectedRole === 'participant'}
                  onChange={() => setSelectedRole('participant')}
                  className="text-cyan-600 focus:ring-cyan-500"
                />
                <span>{locale === 'zh' ? '实验受试者' : 'Participant'}</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  checked={selectedRole === 'researcher'}
                  onChange={() => setSelectedRole('researcher')}
                  className="text-cyan-600 focus:ring-cyan-500"
                />
                <span>{locale === 'zh' ? '实验研究员' : 'Researcher'}</span>
              </label>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
