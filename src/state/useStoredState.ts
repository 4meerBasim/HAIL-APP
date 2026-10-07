import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// A preference that survives the app being closed. Settings screens without
// this look like they work and then quietly forget — which is worse than not
// offering the switch at all.
//
// The initial value shows immediately and is replaced once storage answers, so
// the row never renders empty. A write that lands before the read comes back
// wins: `dirty` stops the async load from stomping on a change the customer
// just made.
export function useStoredState<T>(
  key: string,
  initial: T,
): [T, (next: T) => void, () => void] {
  const [value, setValue] = useState<T>(initial);
  const dirty = useRef(false);
  const initialRef = useRef(initial);

  // Exposed as well as run on mount: when another screen writes the same key —
  // the card form saving into the key the payments list reads — the list is
  // still mounted behind it and would otherwise show the value it loaded on
  // first render. Callers reload it on focus.
  //
  // A missing key goes back to the initial value rather than keeping the old
  // one: sign-out removes the saved card, and a list that kept showing it would
  // offer the previous customer's card to the next one.
  const reload = useCallback(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (active) setValue(raw != null ? (JSON.parse(raw) as T) : initialRef.current);
      } catch {
        // Corrupt or unreadable: keep the default rather than crash a settings row.
      }
    })();
    return () => {
      active = false;
    };
  }, [key]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (active && !dirty.current && raw != null) setValue(JSON.parse(raw) as T);
      } catch {
        // As above.
      }
    })();
    return () => {
      active = false;
    };
  }, [key]);

  const set = useCallback(
    (next: T) => {
      dirty.current = true;
      setValue(next);
      void AsyncStorage.setItem(key, JSON.stringify(next));
    },
    [key],
  );

  return [value, set, reload];
}
