import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { strings } from './strings';

export type Lang = 'ar' | 'en';
export type Dir = 'rtl' | 'ltr';

const STORAGE_KEY = '@hail/lang';

export interface LanguageContextValue {
  lang: Lang;
  dir: Dir;
  isRTL: boolean;
  t: (key: string, fallback?: string) => string;
  setLang: (l: Lang) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const applyRTL = (lang: Lang): void => {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(lang === 'ar');
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');
  const [ready, setReady] = useState(false);

  // Arabic-only. The `en` dictionary and the `Lang` union stay in place so the
  // option can be turned back on by restoring the stored-value read below, but
  // nothing in the running app can reach it: the switcher is gone from Profile
  // and any 'en' left in storage from a previous build is overwritten on boot,
  // so an existing install comes back in Arabic rather than stuck in English.
  useEffect(() => {
    let active = true;
    (async () => {
      await AsyncStorage.setItem(STORAGE_KEY, 'ar');
      applyRTL('ar');
      if (active) {
        setLangState('ar');
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setLang = useCallback(async (_l: Lang) => {
    // Intentionally inert while the app is Arabic-only.
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = strings[lang];
      return dict[key] ?? fallback ?? key;
    },
    [lang],
  );

  if (!ready) {
    return null;
  }

  const value: LanguageContextValue = {
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    isRTL: lang === 'ar',
    t,
    setLang,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
