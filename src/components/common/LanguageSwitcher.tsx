import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '../../i18n/context';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'segmented' | 'button';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '',
  variant = 'segmented' 
}) => {
  const { locale, setLocale, toggleLocale } = useI18n();

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleLocale}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors ${className}`}
        title={locale === 'zh' ? 'Switch to English' : '切换为中文'}
      >
        <Globe className="w-3.5 h-3.5 text-cyan-600" />
        <span>{locale === 'zh' ? 'EN' : '中文'}</span>
      </button>
    );
  }

  return (
    <div 
      className={`inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/80 text-xs font-semibold select-none ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLocale('zh')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
          locale === 'zh'
            ? 'bg-white text-cyan-800 shadow-2xs font-bold'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
      >
        <span>中文</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
          locale === 'en'
            ? 'bg-white text-cyan-800 shadow-2xs font-bold'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
      >
        <span>EN</span>
      </button>
    </div>
  );
};
