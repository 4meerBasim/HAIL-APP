import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Macros } from '../data/menu';
import { type BodyProfile, dailyTargets } from '../data/nutrition';

const SESSION_KEY = '@jareesh/session';
const PROFILE_KEY = '@jareesh/profile';

export interface User {
  phone: string;
  name: string;
}

export type AuthStatus = 'loading' | 'guest' | 'authed';

interface AuthValue {
  status: AuthStatus;
  user: User | null;
  profile: BodyProfile | null;
  targets: Macros | null;
  pendingPhone: string | null;
  requestOtp: (phone: string) => void;
  verifyOtp: (code: string) => boolean;
  continueAsGuest: () => void;
  saveProfile: (profile: BodyProfile) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

// Mock auth: no backend. Any 4-digit code verifies, and the session lives in
// AsyncStorage. Everything the rest of the app touches goes through this value,
// so swapping in a real provider later is a change to this file only.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<BodyProfile | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [rawSession, rawProfile] = await AsyncStorage.multiGet([SESSION_KEY, PROFILE_KEY]);
        if (!alive) return;
        const saved = rawSession[1] ? (JSON.parse(rawSession[1]) as User) : null;
        if (saved?.phone) {
          setUser(saved);
          setStatus('authed');
        } else {
          setStatus('guest');
        }
        if (rawProfile[1]) setProfileState(JSON.parse(rawProfile[1]) as BodyProfile);
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

  const saveProfile = useCallback((next: BodyProfile) => {
    setProfileState(next);
    void AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setProfileState(null);
    setStatus('guest');
    void AsyncStorage.multiRemove([SESSION_KEY, PROFILE_KEY]);
  }, []);

  const targets = useMemo(() => (profile ? dailyTargets(profile) : null), [profile]);

  const value = useMemo(
    () => ({
      status,
      user,
      profile,
      targets,
      pendingPhone,
      requestOtp,
      verifyOtp,
      continueAsGuest,
      saveProfile,
      signOut,
    }),
    [
      status,
      user,
      profile,
      targets,
      pendingPhone,
      requestOtp,
      verifyOtp,
      continueAsGuest,
      saveProfile,
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
