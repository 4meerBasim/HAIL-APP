import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@jareesh/session';

// Set in .env.local — see .env.example. On a device this has to be the Mac's
// LAN address, never localhost: the phone's localhost is the phone.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export interface User {
  /** Empty when the customer signed up with an email and has no number yet. */
  phone: string;
  /** Empty when the customer signed up with a phone and has no address yet. */
  email: string;
  name: string;
  // Backup numbers the courier can try. The primary stays on `phone` so every
  // screen that only needs "the customer's number" is untouched.
  secondary: string[];
}

// What is written to AsyncStorage. The token is the session: a stored user
// without one cannot talk to the API at all, so it is dropped on boot rather
// than restored into a state that looks signed in and fails on first request.
interface Session {
  user: User;
  token: string;
}

export type AuthStatus = 'loading' | 'guest' | 'authed';

export type IdentityChannel = 'phone' | 'email';

/**
 * What the customer is signing in with. Not everyone has WhatsApp, so a phone
 * cannot be the only way in — the API takes either, and which one is being used
 * has to travel with the value rather than being guessed from its shape.
 */
export interface Identity {
  channel: IdentityChannel;
  value: string;
}

/**
 * Why a code request or a verification did not go through.
 *
 * `wrong-code` is deliberately the only verification failure. The API answers
 * a wrong code, an expired one, one guessed at too many times and a number it
 * has never seen with the same 422 — telling them apart would say which numbers
 * have accounts — so the app has nothing finer to report.
 */
export type OtpFailure = 'invalid-identity' | 'throttled' | 'wrong-code' | 'network';

export type OtpResult = { ok: true } | { ok: false; reason: OtpFailure; retryAfter?: number };

interface AuthValue {
  status: AuthStatus;
  user: User | null;
  /** Bearer token for the API. Null unless status is 'authed'. */
  token: string | null;
  pendingIdentity: Identity | null;
  requestOtp: (identity: Identity) => Promise<OtpResult>;
  verifyOtp: (code: string) => Promise<OtpResult>;
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

const post = (path: string, body: Record<string, string>) =>
  fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

const AuthContext = createContext<AuthValue | undefined>(undefined);

// Sign-in runs against the Laravel API: the phone gets a code, the code is
// exchanged for a Sanctum token, and that token is the session. Everything the
// rest of the app touches goes through this value.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [pendingIdentity, setPendingIdentity] = useState<Identity | null>(null);

  const user = session?.user ?? null;
  const token = session?.token ?? null;

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (!alive) return;
        const saved = raw ? (JSON.parse(raw) as Partial<Session>) : null;
        // A session saved by the mock build has no token, and one saved before
        // secondary numbers existed has no array. The first cannot authenticate
        // and is dropped; the second is repaired.
        if (saved?.token && (saved.user?.phone || saved.user?.email)) {
          setSession({
            user: {
              ...saved.user,
              phone: saved.user.phone ?? '',
              email: saved.user.email ?? '',
              secondary: saved.user.secondary ?? [],
            },
            token: saved.token,
          });
          setStatus('authed');
        } else {
          setStatus('guest');
        }
      } catch {
        if (alive) setStatus('guest');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // One place writes the session, so no caller can update it in state and
  // forget to persist it.
  const save = useCallback((next: Session) => {
    setSession(next);
    void AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
  }, []);

  // Changing the numbers on the account keeps the token that was already issued.
  const saveUser = useCallback(
    (next: User) => {
      if (!session) return;
      save({ ...session, user: next });
    },
    [session, save],
  );

  const requestOtp = useCallback(async (identity: Identity): Promise<OtpResult> => {
    try {
      // The API takes `phone` or `email`, never both, and decides the transport
      // from whichever arrived.
      const res = await post('/api/auth/otp/request', { [identity.channel]: identity.value });

      if (res.status === 429) {
        const body = (await res.json()) as { retry_after?: number };
        return { ok: false, reason: 'throttled', retryAfter: Number(body.retry_after) || 0 };
      }
      if (res.status === 422) return { ok: false, reason: 'invalid-identity' };
      if (!res.ok) return { ok: false, reason: 'network' };

      // Only now: the code-entry step is meaningless if nothing was sent.
      setPendingIdentity(identity);
      return { ok: true };
    } catch {
      return { ok: false, reason: 'network' };
    }
  }, []);

  const verifyOtp = useCallback(
    async (code: string): Promise<OtpResult> => {
      if (!pendingIdentity) return { ok: false, reason: 'wrong-code' };

      try {
        const res = await post('/api/auth/otp/verify', {
          [pendingIdentity.channel]: pendingIdentity.value,
          code,
        });
        if (!res.ok) {
          return { ok: false, reason: res.status === 422 ? 'wrong-code' : 'network' };
        }

        const body = (await res.json()) as {
          token?: string;
          user?: { phone?: string | null; email?: string | null; name?: string | null };
        };
        if (!body.token) return { ok: false, reason: 'network' };

        save({
          user: {
            /*
             * The API is the source of truth for both identities: it stores
             * E.164 and lowercased addresses, so the account is keyed on
             * +9647… and on the address however the customer typed it.
             *
             * Either can be absent — a customer who signed in with an email has
             * no number yet, and vice versa — and the rest of the app renders
             * these as strings rather than handling a null.
             */
            phone: body.user?.phone ?? '',
            email: body.user?.email ?? '',
            name: body.user?.name ?? '',
            secondary: [],
          },
          token: body.token,
        });
        setStatus('authed');
        setPendingIdentity(null);
        return { ok: true };
      } catch {
        return { ok: false, reason: 'network' };
      }
    },
    [pendingIdentity, save],
  );

  const hasPhone = useCallback(
    (phone: string) =>
      !!user && [user.phone, ...user.secondary].some((p) => key(p) === key(phone)),
    [user],
  );

  const changePrimary = useCallback(
    (phone: string) => {
      if (!user || hasPhone(phone)) return false;
      saveUser({ ...user, phone: phone.trim() });
      return true;
    },
    [user, hasPhone, saveUser],
  );

  const addSecondary = useCallback(
    (phone: string) => {
      if (!user || hasPhone(phone)) return false;
      saveUser({ ...user, secondary: [...user.secondary, phone.trim()] });
      return true;
    },
    [user, hasPhone, saveUser],
  );

  const removeSecondary = useCallback(
    (phone: string) => {
      if (!user) return;
      saveUser({ ...user, secondary: user.secondary.filter((p) => key(p) !== key(phone)) });
    },
    [user, saveUser],
  );

  const makePrimary = useCallback(
    (phone: string) => {
      if (!user || key(phone) === key(user.phone)) return;
      saveUser({
        ...user,
        phone,
        secondary: [user.phone, ...user.secondary.filter((p) => key(p) !== key(phone))],
      });
    },
    [user, saveUser],
  );

  const continueAsGuest = useCallback(() => {
    setStatus('guest');
    setPendingIdentity(null);
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    setStatus('guest');
    void AsyncStorage.removeItem(SESSION_KEY);
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      token,
      pendingIdentity,
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
      token,
      pendingIdentity,
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
