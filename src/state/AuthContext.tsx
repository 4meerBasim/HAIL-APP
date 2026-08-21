import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { samePhone } from '../data/phone';

const SESSION_KEY = '@jareesh/session';

export interface User {
  phone: string;
  name: string;
  // Verified numbers beyond the one the account signs in with. The primary
  // stays on `phone`, so every screen that already reads `user.phone` keeps
  // working without knowing this list exists.
  secondaryPhones: string[];
}

export type AuthStatus = 'loading' | 'guest' | 'authed';

interface AuthValue {
  status: AuthStatus;
  user: User | null;
  pendingPhone: string | null;
  // Primary first, then the secondaries in the order they were added.
  phones: string[];
  requestOtp: (phone: string) => void;
  verifyOtp: (code: string) => boolean;
  attachPendingPhone: (code: string, asPrimary: boolean) => boolean;
  setPrimaryPhone: (phone: string) => void;
  removePhone: (phone: string) => void;
  continueAsGuest: () => void;
  signOut: () => void;
}

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
        // Sessions written before secondary numbers existed have no list.
        setUser(saved?.phone ? { ...saved, secondaryPhones: saved.secondaryPhones ?? [] } : null);
        setStatus(saved?.phone ? 'authed' : 'guest');
      } catch {
        if (alive) setStatus('guest');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Every mutation goes through here so no path can update the session in state
  // and forget to persist it.
  const commit = useCallback((next: User) => {
    setUser(next);
    void AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
  }, []);

  const requestOtp = useCallback((phone: string) => {
    setPendingPhone(phone);
  }, []);

  const verifyOtp = useCallback(
    (code: string) => {
      if (!pendingPhone || !/^\d{4}$/.test(code)) return false;
      commit({ phone: pendingPhone, name: '', secondaryPhones: [] });
      setStatus('authed');
      setPendingPhone(null);
      return true;
    },
    [pendingPhone, commit],
  );

  // The signed-in counterpart to verifyOtp: same 4-digit mock check, but the
  // verified number joins the existing account instead of starting a new
  // session. A replaced primary is demoted rather than dropped — it is a number
  // the customer proved they own, and the list has an explicit remove.
  const attachPendingPhone = useCallback(
    (code: string, asPrimary: boolean) => {
      if (!user || !pendingPhone || !/^\d{4}$/.test(code)) return false;
      // Compared loosely: a session written before normalisation existed still
      // holds the number exactly as it was typed at sign-in.
      if ([user.phone, ...user.secondaryPhones].some((p) => samePhone(p, pendingPhone))) {
        return false;
      }

      commit(
        asPrimary
          ? { ...user, phone: pendingPhone, secondaryPhones: [user.phone, ...user.secondaryPhones] }
          : { ...user, secondaryPhones: [...user.secondaryPhones, pendingPhone] },
      );
      setPendingPhone(null);
      return true;
    },
    [user, pendingPhone, commit],
  );

  // Promoting a secondary needs no code: it was verified when it was added.
  const setPrimaryPhone = useCallback(
    (phone: string) => {
      if (!user || phone === user.phone || !user.secondaryPhones.includes(phone)) return;
      commit({
        ...user,
        phone,
        secondaryPhones: [user.phone, ...user.secondaryPhones.filter((p) => p !== phone)],
      });
    },
    [user, commit],
  );

  // The primary is not removable — it is the number the account signs in with,
  // and there is no sane value for it once the list is empty. Promote another
  // number first, which is the same shape as the last-address rule.
  const removePhone = useCallback(
    (phone: string) => {
      if (!user || phone === user.phone) return;
      commit({ ...user, secondaryPhones: user.secondaryPhones.filter((p) => p !== phone) });
    },
    [user, commit],
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

  const phones = useMemo(
    () => (user ? [user.phone, ...user.secondaryPhones] : []),
    [user],
  );

  const value = useMemo(
    () => ({
      status,
      user,
      pendingPhone,
      phones,
      requestOtp,
      verifyOtp,
      attachPendingPhone,
      setPrimaryPhone,
      removePhone,
      continueAsGuest,
      signOut,
    }),
    [
      status,
      user,
      pendingPhone,
      phones,
      requestOtp,
      verifyOtp,
      attachPendingPhone,
      setPrimaryPhone,
      removePhone,
      continueAsGuest,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
