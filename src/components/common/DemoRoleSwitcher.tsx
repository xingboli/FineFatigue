import React from 'react';
import { ShieldCheck, UserRound } from 'lucide-react';
import { UserProfile } from '../../types';
import { useI18n } from '../../i18n/context';

interface DemoRoleSwitcherProps {
  currentUser: UserProfile;
  onSwitch: (user: UserProfile) => void;
  participant: UserProfile;
  researcher: UserProfile;
}

export const DemoRoleSwitcher: React.FC<DemoRoleSwitcherProps> = ({ currentUser, onSwitch, participant, researcher }) => {
  const { locale } = useI18n();
  const zh = locale === 'zh';
  const isResearcher = currentUser.role === 'researcher';

  return (
    <section className="mb-5 rounded-2xl border border-violet-200 bg-violet-50/70 p-3.5 shadow-xs sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-bold text-violet-950">
          <ShieldCheck className="h-4 w-4 text-violet-700" />
          {zh ? '演示身份与权限' : 'Demo identity & permissions'}
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-violet-900/75">
          {zh ? '一键查看受试者流程或管理员数据视图；仅用于展示，不会创建真实账号或修改权限。' : 'Switch between the participant journey and administrator data view. This is for demonstration only and never creates accounts or changes real permissions.'}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-0 sm:w-[280px]">
        <button type="button" onClick={() => onSwitch(participant)} aria-pressed={!isResearcher} className={'rounded-xl border px-3 py-2 text-left text-xs transition-colors ' + (!isResearcher ? 'border-cyan-500 bg-cyan-600 text-white shadow-sm' : 'border-violet-200 bg-white text-violet-900 hover:bg-violet-100')}>
          <span className="flex items-center gap-1.5 font-bold"><UserRound className="h-3.5 w-3.5" />{zh ? '受试者' : 'Participant'}</span>
          <span className={'mt-0.5 block text-[10px] ' + (!isResearcher ? 'text-cyan-50' : 'text-violet-700')}>{participant.participantCode}</span>
        </button>
        <button type="button" onClick={() => onSwitch(researcher)} aria-pressed={isResearcher} className={'rounded-xl border px-3 py-2 text-left text-xs transition-colors ' + (isResearcher ? 'border-violet-600 bg-violet-600 text-white shadow-sm' : 'border-violet-200 bg-white text-violet-900 hover:bg-violet-100')}>
          <span className="flex items-center gap-1.5 font-bold"><ShieldCheck className="h-3.5 w-3.5" />{zh ? '管理员' : 'Administrator'}</span>
          <span className={'mt-0.5 block text-[10px] ' + (isResearcher ? 'text-violet-100' : 'text-violet-700')}>{researcher.participantCode}</span>
        </button>
      </div>
    </section>
  );
};
