import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@jareesh/session';

export interface User {
  phone: string;
  name: string;
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
        setUser(saved?.phone ? saved : null);
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

  const verifyOtp = useCallback(
    (code: string) => {
      if (!pendingPhone || !/^\d{4}$/.test(code)) return false;
      const next: User = { phone: pendingPhone, name: '' };
      setUser(next);
      setStatus('authed');
      setPendingPhone(null);
      void AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return true;
    },
    [pendingPhone],
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
    }),
    [status, user, pendingPhone, requestOtp, verifyOtp, continueAsGuest, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
