import React, { useState } from 'react';
import { X, LogOut, UserCheck, LockKeyhole } from 'lucide-react';
import { UserProfile } from '../../types';
import { authService } from '../../services/authService';
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
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !password) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const newUser = await authService.login(customName, password, mode);
      onUserChanged(newUser);
      setCustomName('');
      setPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === 'zh' ? '无法连接局域网账号服务。' : 'Cannot reach the LAN account service.'));
    } finally {
      setIsSubmitting(false);
    }
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
                {locale === 'zh' ? '密码保护的受试者数据与管理员登录' : 'Password-protected participant and administrator access'}
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

          {/* Password login / registration */}
          <form onSubmit={handleCustomLogin} className="space-y-3">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button type="button" onClick={() => setMode('login')} className={`rounded-lg px-3 py-2 transition-colors ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                {locale === 'zh' ? '密码登录' : 'Sign in'}
              </button>
              <button type="button" onClick={() => setMode('register')} className={`rounded-lg px-3 py-2 transition-colors ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                {locale === 'zh' ? '新受试者注册' : 'Register'}
              </button>
            </div>

            <label className="text-xs font-bold text-slate-700 block">
              {mode === 'register'
                ? (locale === 'zh' ? '受试者编号' : 'Participant identifier')
                : (locale === 'zh' ? '受试者编号或管理员用户名' : 'Participant ID or administrator username')}:
            </label>

            <input
              type="text"
              autoComplete="username"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder={locale === 'zh' ? '如：SUBJ-C09' : 'e.g. SUBJ-C09'}
              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-slate-50/50"
            />
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <LockKeyhole className="w-3.5 h-3.5 text-cyan-700" />
              {locale === 'zh' ? '密码（至少 8 位）' : 'Password (at least 8 characters)'}
            </label>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-slate-50/50"
            />
            {mode === 'register' && (
              <p className="text-[11px] text-slate-500">{locale === 'zh' ? '注册后此编号只能使用该密码登录；管理员可在后台停用或重置密码。' : 'After registration, this identifier requires the same password. An administrator can disable the account or reset the password.'}</p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!customName.trim() || password.length < 8 || isSubmitting}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                {isSubmitting ? (locale === 'zh' ? '验证中…' : 'Checking…') : (mode === 'register' ? (locale === 'zh' ? '注册账号' : 'Register') : (locale === 'zh' ? '登录' : 'Sign in'))}
              </button>
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};
