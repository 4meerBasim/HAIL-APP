import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { I18nManager, Platform } from 'react-native';
import { reloadAppAsync } from 'expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { strings } from './strings';

export type Lang = 'ar' | 'en';
export type Dir = 'rtl' | 'ltr';

const STORAGE_KEY = '@hail/lang';
const RELOAD_KEY = '@hail/rtl-reload';
const DEFAULT_LANG: Lang = 'en';

export interface LanguageContextValue {
  lang: Lang;
  dir: Dir;
  isRTL: boolean;
  t: (key: string, fallback?: string) => string;
  setLang: (l: Lang) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

// Android resolves RTL as forced OR (allowed AND device locale is RTL), and iOS
// also follows the app's preferred language when allowed — so English has to
// disallow RTL, not just stop forcing it, or an Arabic-locale phone keeps it.
const applyRTL = (lang: Lang): void => {
  I18nManager.allowRTL(lang === 'ar');
  I18nManager.forceRTL(lang === 'ar');
};

// Native layout direction is only read at launch, so a language whose
// direction differs from the running one needs a restart to lay out correctly.
// Web has no native direction to fix, and a missing native reload falls back
// to the context-driven live switch.
const canRestart = (): boolean =>
  Platform.OS !== 'web' && typeof globalThis.expo?.reloadAppAsync === 'function';

const needsRestart = (lang: Lang): boolean =>
  canRestart() && I18nManager.isRTL !== (lang === 'ar');

const restart = async (): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(RELOAD_KEY, '1');
    await reloadAppAsync('Language direction changed');
    return true;
  } catch {
    return false;
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      // Nothing renders until `ready`, so a storage error here must still end
      // in a language: without the catch the app stayed blank for good.
      let initial: Lang = DEFAULT_LANG;
      let reloaded = false;
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'ar' || stored === 'en') initial = stored;
        reloaded = (await AsyncStorage.getItem(RELOAD_KEY)) === '1';
        if (reloaded) await AsyncStorage.removeItem(RELOAD_KEY);
      } catch {
        // Fall back to the default.
      }
      applyRTL(initial);
      // A fresh install on a device whose system direction differs from the
      // saved language restarts once. `reloaded` stops a loop if the native
      // direction still did not follow after that restart.
      if (!reloaded && needsRestart(initial) && (await restart())) return;
      if (active) {
        setLangState(initial);
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // The switch happens even when it cannot be saved — the customer asked for
  // it now; only the next launch falls back to the default.
  const setLang = useCallback(
    async (l: Lang) => {
      if (l === lang) return;
      try {
        await AsyncStorage.setItem(STORAGE_KEY, l);
      } catch {
        // Not persisted; the in-memory language still changes.
      }
      applyRTL(l);
      if (needsRestart(l) && (await restart())) return;
      setLangState(l);
    },
    [lang],
  );

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
