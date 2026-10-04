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

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const initial: Lang = stored === 'ar' || stored === 'en' ? stored : 'ar';
      if (stored !== 'ar' && stored !== 'en') {
        await AsyncStorage.setItem(STORAGE_KEY, 'ar');
      }
      applyRTL(initial);
      if (active) {
        setLangState(initial);
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    await AsyncStorage.setItem(STORAGE_KEY, l);
    applyRTL(l);
    setLangState(l);
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
