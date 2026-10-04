import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@hail/session';

/*
 * Sign-in runs on the device. There is no API behind this build: entering a
 * phone or an email signs the customer in, and the account is whatever they
 * typed, kept in AsyncStorage.
 *
 * What this deliberately does NOT do is invent anything else. No name, no
 * orders, no addresses, no subscription — see [[real-customer-data-only]]. An
 * account here is an identity and nothing more, so every empty state is the one
 * a genuinely new customer sees.
 */

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

// What is written to AsyncStorage. Sessions written by the API build also
// carried a bearer token; it is ignored on read rather than rejected, so
// signing back in is not forced on anyone who had one.
interface Session {
  user: User;
}

export type AuthStatus = 'loading' | 'guest' | 'authed';

export type IdentityChannel = 'phone' | 'email';

/**
 * What the customer is signing in with. Not everyone has WhatsApp, so a phone
 * cannot be the only way in — either identifies the account, and which one is
 * being used has to travel with the value rather than being guessed from its
 * shape.
 */
export interface Identity {
  channel: IdentityChannel;
  value: string;
}

/** The only way in can fail now: the phone or address is not usable as one. */
export type SignInFailure = 'invalid-identity';

export type SignInResult = { ok: true } | { ok: false; reason: SignInFailure };

interface AuthValue {
  status: AuthStatus;
  user: User | null;
  /** Signs the customer in on the spot — there is no code step and nothing to
   *  wait for, so this answers synchronously. */
  signIn: (identity: Identity) => SignInResult;
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

// Everything the rest of the app touches about who the customer is goes through
// this value.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);

  const user = session?.user ?? null;

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (!alive) return;
        const saved = raw ? (JSON.parse(raw) as Partial<Session>) : null;
        // An identity is the whole session now, so a stored one restores on
        // either field. A session written before secondary numbers existed has
        // no array and is repaired on the way in.
        if (saved?.user?.phone || saved?.user?.email) {
          setSession({
            user: {
              ...saved.user,
              phone: saved.user.phone ?? '',
              email: saved.user.email ?? '',
              secondary: saved.user.secondary ?? [],
            },
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

  const saveUser = useCallback(
    (next: User) => {
      if (!session) return;
      save({ ...session, user: next });
    },
    [session, save],
  );

  const signIn = useCallback(
    (identity: Identity): SignInResult => {
      const value = identity.value.trim();
      if (!value) return { ok: false, reason: 'invalid-identity' };

      save({
        user: {
          /*
           * Only the field they signed in with is filled. The other is left
           * empty on purpose — a customer who signed in with an email has no
           * number yet, and the screens that show one already render an empty
           * string rather than handling a null.
           *
           * `name` is empty for the same reason: nothing here knows it, and
           * putting a placeholder in would be inventing a customer.
           */
          phone: identity.channel === 'phone' ? value : '',
          email: identity.channel === 'email' ? value : '',
          name: '',
          secondary: [],
        },
      });
      setStatus('authed');
      return { ok: true };
    },
    [save],
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
      signIn,
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
      signIn,
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
