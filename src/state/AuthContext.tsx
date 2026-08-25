import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@jareesh/session';

export interface User {
  phone: string;
  name: string;
  // Backup numbers the courier can try. The primary stays on `phone` so every
  // screen that only needs "the customer's number" is untouched.
  secondary: string[];
}

export type AuthStatus = 'loading' | 'guest' | 'authed';

interface AuthValue {
  status: AuthStatus;
  user: User | null;
  pendingPhone: string | null;
  requestOtp: (phone: string) => void;
  verifyOtp: (code: string) => boolean;
  continueAsGuest: () => void;
  signOut: () => void;
  /** True if the number is already on the account, primary or secondary. */
  hasPhone: (phone: string) => boolean;
  /** Replaces the primary; the old number is dropped. False if already saved. */
  changePrimary: (phone: string) => boolean;
  /** Adds a backup number. False if already saved. */
  addSecondary: (phone: string) => boolean;
  removeSecondary: (phone: string) => void;
  /** Promotes a backup number; the old primary swaps down into the list. */
  makePrimary: (phone: string) => void;
}

// Numbers are stored as typed, so '0770 000 0000' and '+964 770 000 0000' are
// two spellings of one number. Comparison is on the digits with the local
// trunk zero and the country code taken off.
const key = (phone: string) => phone.replace(/\D/g, '').replace(/^(964)?0?/, '');

const AuthContext = createContext<AuthValue | undefined>(undefined);

// Mock auth: no backend. Any 4-digit code verifies, and the session lives in
// AsyncStorage. Everything the rest of the app touches goes through this value,
// so swapping in a real provider later is a change to this file only.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (!alive) return;
        const saved = raw ? (JSON.parse(raw) as User) : null;
        // Sessions written before secondary numbers existed have no array.
        setUser(saved?.phone ? { ...saved, secondary: saved.secondary ?? [] } : null);
        setStatus(saved?.phone ? 'authed' : 'guest');
      } catch {
        if (alive) setStatus('guest');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const requestOtp = useCallback((phone: string) => {
    setPendingPhone(phone);
  }, []);

  // One place writes the session, so no caller can update the user in state and
  // forget to persist it.
  const save = useCallback((next: User) => {
    setUser(next);
    void AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
  }, []);

  const verifyOtp = useCallback(
    (code: string) => {
      if (!pendingPhone || !/^\d{4}$/.test(code)) return false;
      save({ phone: pendingPhone, name: '', secondary: [] });
      setStatus('authed');
      setPendingPhone(null);
      return true;
    },
    [pendingPhone, save],
  );

  const hasPhone = useCallback(
    (phone: string) =>
      !!user && [user.phone, ...user.secondary].some((p) => key(p) === key(phone)),
    [user],
  );

  const changePrimary = useCallback(
    (phone: string) => {
      if (!user || hasPhone(phone)) return false;
      save({ ...user, phone: phone.trim() });
      return true;
    },
    [user, hasPhone, save],
  );

  const addSecondary = useCallback(
    (phone: string) => {
      if (!user || hasPhone(phone)) return false;
      save({ ...user, secondary: [...user.secondary, phone.trim()] });
      return true;
    },
    [user, hasPhone, save],
  );

  const removeSecondary = useCallback(
    (phone: string) => {
      if (!user) return;
      save({ ...user, secondary: user.secondary.filter((p) => key(p) !== key(phone)) });
    },
    [user, save],
  );

  const makePrimary = useCallback(
    (phone: string) => {
      if (!user || key(phone) === key(user.phone)) return;
      save({
        ...user,
        phone,
        secondary: [user.phone, ...user.secondary.filter((p) => key(p) !== key(phone))],
      });
    },
    [user, save],
  );

  const continueAsGuest = useCallback(() => {
    setStatus('guest');
    setPendingPhone(null);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setStatus('guest');
    void AsyncStorage.removeItem(SESSION_KEY);
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      pendingPhone,
      requestOtp,
      verifyOtp,
      continueAsGuest,
      signOut,
      hasPhone,
      changePrimary,
      addSecondary,
      removeSecondary,
      makePrimary,
    }),
    [
      status,
      user,
      pendingPhone,
      requestOtp,
      verifyOtp,
      continueAsGuest,
      signOut,
      hasPhone,
      changePrimary,
      addSecondary,
      removeSecondary,
      makePrimary,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
