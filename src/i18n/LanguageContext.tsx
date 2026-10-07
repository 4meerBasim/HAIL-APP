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
      // Nothing renders until `ready`, so a storage error here must still end
      // in a language: without the catch the app stayed blank for good. Arabic
      // is the default either way.
      let initial: Lang = 'ar';
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'ar' || stored === 'en') initial = stored;
        else await AsyncStorage.setItem(STORAGE_KEY, 'ar');
      } catch {
        // Fall back to the default.
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

  // The switch happens on screen even when it cannot be saved — the customer
  // asked for it now; only the next launch falls back to the default.
  const setLang = useCallback(async (l: Lang) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, l);
    } catch {
      // Not persisted; the in-memory language still changes.
    }
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
