import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { defaultSize } from '../data/extras';

export interface MealBuild {
  /** The dish being built, so a stale build never lands on the wrong meal. */
  dishId: string;
  size: string;
  /** One chosen kind per extra — white rice or red, never both. */
  extras: string[];
  /** Sweets and drinks by menu id, and how many of each. */
  items: Record<string, number>;
}

interface MealBuildValue {
  build: MealBuild;
  /** Called when a meal page opens: a new dish starts from plain. */
  start: (dishId: string) => void;
  /** Opens the editor on a meal that was already tailored once. */
  load: (dishId: string, from: { size: string; extras: string[]; items: Record<string, number> }) => void;
  setSize: (size: string) => void;
  /** Adds or removes one kind of extra. Kinds do not exclude each other: a
   *  plate of white rice and a plate of red rice is a real order. */
  chooseExtra: (optionId: string) => void;
  /** Steps a sweet or a drink up and down; zero takes it off. */
  countItem: (dishId: string, delta: number) => void;
  /** Takes every addition off the meal at once. */
  clearAdded: () => void;
}

/**
 * A plain build for a dish — what `start` produces.
 *
 * Exported so a screen can render a dish's controls on the frame it first
 * appears, instead of waiting for the effect that calls `start` to land. The
 * default size costs nothing, so a page showing this before the real build
 * arrives prices the same and then swaps to an identical value.
 */
export const emptyBuild = (dishId: string): MealBuild => ({
  dishId,
  size: defaultSize,
  extras: [],
  items: {},
});

const MealBuildContext = createContext<MealBuildValue | undefined>(undefined);

// The meal being built lives above both screens rather than in the meal page's
// own state, because picking a sweet happens on a page of its own: routing the
// choice back through navigation params would remount the meal page and lose
// the quantity, the size and everything else already chosen.
export function MealBuildProvider({ children }: { children: React.ReactNode }) {
  const [build, setBuild] = useState<MealBuild>(emptyBuild(''));

  const start = useCallback((dishId: string) => {
    setBuild((b) => (b.dishId === dishId ? b : emptyBuild(dishId)));
  }, []);

  const load = useCallback(
    (dishId: string, from: { size: string; extras: string[]; items: Record<string, number> }) =>
      setBuild({ dishId, size: from.size, extras: [...from.extras], items: { ...from.items } }),
    [],
  );

  const setSize = useCallback((size: string) => setBuild((b) => ({ ...b, size })), []);

  const chooseExtra = useCallback(
    (optionId: string) =>
      setBuild((b) => ({
        ...b,
        extras: b.extras.includes(optionId)
          ? b.extras.filter((e) => e !== optionId)
          : [...b.extras, optionId],
      })),
    [],
  );

  const countItem = useCallback(
    (dishId: string, delta: number) =>
      setBuild((b) => {
        const next = Math.max(0, (b.items[dishId] ?? 0) + delta);
        const items = { ...b.items };
        if (next === 0) delete items[dishId];
        else items[dishId] = next;
        return { ...b, items };
      }),
    [],
  );

  const clearAdded = useCallback(() => setBuild((b) => ({ ...b, extras: [], items: {} })), []);

  const value = useMemo(
    () => ({ build, start, load, setSize, chooseExtra, countItem, clearAdded }),
    [build, start, load, setSize, chooseExtra, countItem, clearAdded],
  );

  return <MealBuildContext.Provider value={value}>{children}</MealBuildContext.Provider>;
}

export function useMealBuild(): MealBuildValue {
  const ctx = useContext(MealBuildContext);
  if (!ctx) throw new Error('useMealBuild must be used inside MealBuildProvider');
  return ctx;
}
