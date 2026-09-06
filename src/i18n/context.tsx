import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, translations } from './translations';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: typeof translations['zh'];
}

const STORAGE_KEY = 'finefatigue_language';

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to 'zh' (Chinese) as requested, but restore user preference if previously saved
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'zh' || saved === 'en') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'zh';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    } catch {
      // ignore
    }
  };

  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh');
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value: I18nContextType = {
    locale,
    setLocale,
    toggleLocale,
    t: translations[locale] || translations.zh
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
