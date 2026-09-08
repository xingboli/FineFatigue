import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Save, ShieldAlert, UsersRound } from 'lucide-react';
import { authService } from '../services/authService';
import { DEMO_MODE } from '../config/runtime';
import { useI18n } from '../i18n/context';

type CompensationStatus = 'pending' | 'approved' | 'paid';
type AdminAccount = {
  id: string; participantCode: string; createdAt: number; lastLogin: number;
  status: 'active' | 'pending' | 'disabled'; experimentCount: number; subjectiveCount: number; cognitionCount: number; gameCount: number;
  compensation: { amount: number; note: string; status: CompensationStatus };
};

const DEMO_ACCOUNTS: AdminAccount[] = [
  { id: 'demo-p-001', participantCode: 'DEMO-P-001', createdAt: 1764547200000, lastLogin: 1765189800000, status: 'active', experimentCount: 6, subjectiveCount: 6, cognitionCount: 3, gameCount: 4, compensation: { amount: 180, note: '已完成第 3 次实验回访', status: 'approved' } },
  { id: 'demo-p-002', participantCode: 'DEMO-P-002', createdAt: 1764633600000, lastLogin: 1765103400000, status: 'active', experimentCount: 4, subjectiveCount: 4, cognitionCount: 2, gameCount: 2, compensation: { amount: 120, note: '等待研究人员复核', status: 'pending' } },
  { id: 'demo-p-003', participantCode: 'DEMO-P-003', createdAt: 1764720000000, lastLogin: 0, status: 'pending', experimentCount: 0, subjectiveCount: 0, cognitionCount: 0, gameCount: 0, compensation: { amount: 0, note: '注册信息待审核', status: 'pending' } }
];

const formatTime = (value: number, locale: string) => value ? new Date(value).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US') : '--';

export const AdminPage: React.FC = () => {
  const { locale } = useI18n();
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadAccounts = async () => {
    if (DEMO_MODE) {
      setAccounts(DEMO_ACCOUNTS);
      setIsLoading(false);
      return;
    }
    setIsLoading(true); setError(null);
    try {
      const response = await fetch('/api/admin/accounts', { headers: authService.getAuthHeaders() });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to load administrator data.');
      setAccounts(payload.accounts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load administrator data.');
    } finally { setIsLoading(false); }
  };
  useEffect(() => {
    if (DEMO_MODE) {
      setAccounts(DEMO_ACCOUNTS);
      setIsLoading(false);
      return;
    }
    void loadAccounts();
  }, []);
  const downloadCsv = async (path: string, filename: string) => {
    if (DEMO_MODE) {
      setError(locale === 'zh' ? '在线演示模式不提供管理员 CSV 导出；请使用本地完整版。' : 'Administrator CSV exports are available in Local Full mode only.');
      return;
    }
    try {
      const response = await fetch(path, { headers: authService.getAuthHeaders() });
      if (!response.ok) throw new Error('CSV export failed.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
    } catch (err) { setError(err instanceof Error ? err.message : 'CSV export failed.'); }
  };
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><div className="text-xs font-semibold text-cyan-700 uppercase tracking-wider font-mono">{locale === 'zh' ? '受限访问 · 管理员' : 'Restricted · Administrator'}</div><h1 className="text-2xl font-bold text-slate-900 mt-1">{locale === 'zh' ? '受试者与实验数据管理' : 'Participant & Experiment Administration'}</h1><p className="text-sm text-slate-500 mt-1">{locale === 'zh' ? '管理账户状态、实验次数、应付报酬记录，并导出可用于模型训练的去标识化会话数据。' : 'Manage account status, participation counts, compensation records, and de-identified session exports for model training.'}</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void downloadCsv('/api/admin/export/sessions.csv', 'finefatigue-sessions.csv')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold"><Download className="w-3.5 h-3.5" />{locale === 'zh' ? '导出训练数据 CSV' : 'Export session CSV'}</button>
          <button type="button" onClick={() => void downloadCsv('/api/admin/export/raw.csv', 'finefatigue-raw.csv')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-100 hover:bg-cyan-200 text-cyan-800 text-xs font-semibold"><Download className="w-3.5 h-3.5" />{locale === 'zh' ? '导出原始长表 CSV' : 'Export raw CSV'}</button>
          <button type="button" onClick={() => void downloadCsv('/api/admin/export/cognition.csv', 'finefatigue-cognition.csv')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold"><Download className="w-3.5 h-3.5" />{locale === 'zh' ? '导出认知 CSV' : 'Export cognition CSV'}</button>
          <button type="button" onClick={() => void downloadCsv('/api/admin/export/cognition-raw.csv', 'finefatigue-cognition-raw.csv')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-800 text-xs font-semibold"><Download className="w-3.5 h-3.5" />{locale === 'zh' ? '导出认知原始 CSV' : 'Export cognition raw CSV'}</button>
          <button type="button" onClick={() => void downloadCsv('/api/admin/export/games.csv', 'finefatigue-games.csv')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold"><Download className="w-3.5 h-3.5" />{locale === 'zh' ? '导出追踪原始 CSV' : 'Export tracking raw CSV'}</button>
          <button type="button" onClick={() => void downloadCsv('/api/admin/export/users.csv', 'finefatigue-users.csv')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"><Download className="w-3.5 h-3.5" />{locale === 'zh' ? '导出受试者 CSV' : 'Export user CSV'}</button>
          <button type="button" onClick={() => void loadAccounts()} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"><RefreshCw className={'w-4 h-4 ' + (isLoading ? 'animate-spin' : '')} /></button>
        </div>
      </div>
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex gap-2"><ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Summary label={locale === 'zh' ? '受试者账号' : 'Participant accounts'} value={accounts.length} />
        <Summary label={locale === 'zh' ? '已完成实验' : 'Completed experiments'} value={accounts.reduce((sum, account) => sum + account.experimentCount, 0)} />
        <Summary label={locale === 'zh' ? '待审核注册' : 'Pending registrations'} value={accounts.filter(account => account.status === 'pending').length} />
        <Summary label={locale === 'zh' ? '已停用账号' : 'Disabled accounts'} value={accounts.filter(account => account.status === 'disabled').length} />
      </div>
      <div className="space-y-3">
      {isLoading ? <div className="p-10 text-center text-sm text-slate-400">{locale === 'zh' ? '正在加载管理员数据…' : 'Loading administrator data…'}</div> : accounts.length === 0 ? <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-sm text-slate-400"><UsersRound className="w-7 h-7 mx-auto mb-2" />{locale === 'zh' ? '尚无已注册受试者。' : 'No registered participants yet.'}</div> : accounts.map(account => <AccountCard key={account.id} account={account} locale={locale} isDemo={DEMO_MODE} onSaved={loadAccounts} onError={setError} />)}
      </div>
    </div>
  );
};

const Summary: React.FC<{ label: string; value: number }> = ({ label, value }) => <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-[11px] text-slate-400 font-mono">{label}</div><div className="mt-1 text-2xl font-bold text-slate-900">{value}</div></div>;

const AccountCard: React.FC<{ account: AdminAccount; locale: string; isDemo: boolean; onSaved: () => Promise<void>; onError: (message: string | null) => void }> = ({ account, locale, isDemo, onSaved, onError }) => {
  const [amount, setAmount] = useState(String(account.compensation.amount));
  const [note, setNote] = useState(account.compensation.note);
  const [compensationStatus, setCompensationStatus] = useState<CompensationStatus>(account.compensation.status);
  const [resetPassword, setResetPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const save = async (status = account.status) => {
    if (isDemo) {
      onError(locale === 'zh' ? '演示数据为只读；本地完整版中可修改账户与报酬记录。' : 'Demo data is read-only. Account and compensation changes are available in Local Full mode.');
      return;
    }
    setIsSaving(true); onError(null);
    try {
      const response = await fetch('/api/admin/accounts/' + encodeURIComponent(account.id), {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify({ status, compensationAmount: Number(amount), compensationNote: note, compensationStatus, resetPassword: resetPassword || undefined })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to save account.');
      setResetPassword(''); await onSaved();
    } catch (err) { onError(err instanceof Error ? err.message : 'Unable to save account.'); } finally { setIsSaving(false); }
  };
  const nextStatus = account.status === 'active' ? 'disabled' : 'active';
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-900 font-mono">{account.participantCode}</h2><span className={'text-[10px] px-2 py-0.5 rounded-full border ' + (account.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200')}>{account.status === 'active' ? (locale === 'zh' ? '可用' : 'Active') : (account.status === 'pending' ? (locale === 'zh' ? '待审核' : 'Pending') : (locale === 'zh' ? '已停用' : 'Disabled'))}</span></div><div className="mt-1 text-xs text-slate-500">{locale === 'zh' ? '参与 ' + account.experimentCount + ' 次完整实验 · ' + account.subjectiveCount + ' 条自评 · ' + account.cognitionCount + ' 次认知测试 · ' + account.gameCount + ' 次追踪测试' : account.experimentCount + ' completed experiments · ' + account.subjectiveCount + ' self-reports · ' + account.cognitionCount + ' cognition tests · ' + account.gameCount + ' tracking tests'}</div><div className="mt-1 text-[11px] text-slate-400">{locale === 'zh' ? '最近登录：' : 'Last login: '}{formatTime(account.lastLogin, locale)}</div></div>
        <button type="button" onClick={() => void save(nextStatus)} disabled={isSaving} className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50">{nextStatus === 'disabled' ? (locale === 'zh' ? '停用账号' : 'Disable account') : (locale === 'zh' ? '批准/恢复账号' : 'Approve / re-enable')}</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
        <label className="text-xs text-slate-600">{locale === 'zh' ? '应付金额' : 'Compensation amount'}<input type="number" min="0" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 font-mono text-sm" /></label>
        <label className="text-xs text-slate-600">{locale === 'zh' ? '报酬状态' : 'Compensation status'}<select value={compensationStatus} onChange={event => setCompensationStatus(event.target.value as CompensationStatus)} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm bg-white"><option value="pending">{locale === 'zh' ? '待审核' : 'Pending'}</option><option value="approved">{locale === 'zh' ? '已核准' : 'Approved'}</option><option value="paid">{locale === 'zh' ? '已支付' : 'Paid'}</option></select></label>
        <label className="text-xs text-slate-600">{locale === 'zh' ? '重置密码（选填）' : 'Reset password (optional)'}<input type="password" minLength={8} value={resetPassword} onChange={event => setResetPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm" /></label>
        <label className="text-xs text-slate-600">{locale === 'zh' ? '管理员备注' : 'Administrator note'}<input value={note} maxLength={500} onChange={event => setNote(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm" /></label>
      </div>
      <div className="mt-4 flex justify-end"><button type="button" onClick={() => void save()} disabled={isSaving || (resetPassword.length > 0 && resetPassword.length < 8)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold"><Save className="w-3.5 h-3.5" />{isSaving ? (locale === 'zh' ? '保存中…' : 'Saving…') : (locale === 'zh' ? '保存管理记录' : 'Save changes')}</button></div>
    </div>
  );
};
