import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type BoxGoal,
  type Macros,
  type SaverKey,
  MAX_DAYS,
  MAX_POSTPONE_DAYS,
  MIN_DAYS,
  getBox,
} from '../data/menu';
import {
  type MealLine,
  type PlanPricing,
  type PlanState,
  applySaverTo,
  buildMeals,
  dailyMacrosOf,
  emptyPlan,
  planFromBox,
  priceOf,
} from '../data/plan';

export type { MealLine, PlanPricing, PlanState };
export { postponedBy, postponedOffPlan, saverSaving } from '../data/plan';

const PLAN_KEY = '@jareesh/subscription';

interface PlanValue {
  plan: PlanState;
  meals: MealLine[];
  pricing: PlanPricing;
  dailyMacros: Macros;
  subscription: PlanState | null;
  subscriptionMeals: MealLine[];
  subscriptionPricing: PlanPricing | null;
  subscriptionMacros: Macros | null;
  startFromBox: (boxId: BoxGoal) => void;
  startCustom: () => void;
  editSubscription: () => void;
  toggleMealTime: (index: number) => void;
  toggleWeekday: (index: number) => void;
  setDayCount: (n: number) => void;
  toggleDish: (dishId: string) => void;
  applySaver: (key: SaverKey) => void;
  confirm: () => void;
  skipDay: (dayIndex: number) => void;
  postponeDay: (dayIndex: number, byDays: number) => void;
  clearException: (id: string) => void;
  cancelSubscription: () => void;
}

const PlanContext = createContext<PlanValue | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<PlanState>(emptyPlan);
  const [subscription, setSubscription] = useState<PlanState | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(PLAN_KEY);
        if (alive && raw) setSubscription(JSON.parse(raw) as PlanState);
      } catch {
        /* no saved subscription */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: PlanState | null) => {
    setSubscription(next);
    if (next) void AsyncStorage.setItem(PLAN_KEY, JSON.stringify(next));
    else void AsyncStorage.removeItem(PLAN_KEY);
  }, []);

  const startFromBox = useCallback((boxId: BoxGoal) => {
    const box = getBox(boxId);
    setPlan(box ? planFromBox(box) : emptyPlan());
  }, []);

  const startCustom = useCallback(() => {
    setPlan(emptyPlan());
  }, []);

  // Reopening the live subscription in the builder edits a copy; nothing is
  // written back until the customer confirms again.
  const editSubscription = useCallback(() => {
    setPlan((p) => (subscription ? { ...subscription } : p));
  }, [subscription]);

  const toggleMealTime = useCallback((index: number) => {
    setPlan((p) => {
      const on = p.mealTimes.includes(index);
      if (on && p.mealTimes.length === 1) return p;
      return {
        ...p,
        mealTimes: on
          ? p.mealTimes.filter((i) => i !== index)
          : [...p.mealTimes, index].sort((a, b) => a - b),
      };
    });
  }, []);

  const toggleWeekday = useCallback((index: number) => {
    setPlan((p) => {
      const on = p.weekdays.includes(index);
      if (on && p.weekdays.length === 1) return p;
      return {
        ...p,
        weekdays: on
          ? p.weekdays.filter((d) => d !== index)
          : [...p.weekdays, index].sort((a, b) => a - b),
      };
    });
  }, []);

  const setDayCount = useCallback((n: number) => {
    setPlan((p) => ({ ...p, dayCount: Math.max(MIN_DAYS, Math.min(MAX_DAYS, Math.round(n))) }));
  }, []);

  const toggleDish = useCallback((dishId: string) => {
    setPlan((p) =>
      p.dishIds.includes(dishId)
        ? { ...p, dishIds: p.dishIds.filter((d) => d !== dishId) }
        : { ...p, dishIds: [...p.dishIds, dishId] },
    );
  }, []);

  const applySaver = useCallback((key: SaverKey) => {
    setPlan((p) => applySaverTo(p, key));
  }, []);

  const confirm = useCallback(() => {
    persist({ ...plan, exceptions: [] });
  }, [persist, plan]);

  const mutateSubscription = useCallback((fn: (s: PlanState) => PlanState) => {
    setSubscription((s) => {
      if (!s) return s;
      const next = fn(s);
      void AsyncStorage.setItem(PLAN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const skipDay = useCallback(
    (dayIndex: number) => {
      mutateSubscription((s) => ({
        ...s,
        exceptions: [
          ...s.exceptions.filter((e) => e.dayIndex !== dayIndex),
          { id: `skip-${dayIndex}`, kind: 'skip', dayIndex },
        ],
      }));
    },
    [mutateSubscription],
  );

  const postponeDay = useCallback(
    (dayIndex: number, byDays: number) => {
      const by = Math.max(1, Math.min(MAX_POSTPONE_DAYS, byDays));
      mutateSubscription((s) => ({
        ...s,
        exceptions: [
          ...s.exceptions.filter((e) => e.dayIndex !== dayIndex),
          { id: `move-${dayIndex}`, kind: 'postpone', dayIndex, movedTo: dayIndex + by },
        ],
      }));
    },
    [mutateSubscription],
  );

  const clearException = useCallback(
    (id: string) => {
      mutateSubscription((s) => ({ ...s, exceptions: s.exceptions.filter((e) => e.id !== id) }));
    },
    [mutateSubscription],
  );

  const cancelSubscription = useCallback(() => persist(null), [persist]);

  const meals = useMemo(() => buildMeals(plan), [plan]);
  const pricing = useMemo(() => priceOf(plan), [plan]);
  const dailyMacros = useMemo(() => dailyMacrosOf(plan, meals), [plan, meals]);

  const subscriptionMeals = useMemo(
    () => (subscription ? buildMeals(subscription) : []),
    [subscription],
  );
  const subscriptionPricing = useMemo(
    () => (subscription ? priceOf(subscription) : null),
    [subscription],
  );
  const subscriptionMacros = useMemo(
    () => (subscription ? dailyMacrosOf(subscription, subscriptionMeals) : null),
    [subscription, subscriptionMeals],
  );

  const value = useMemo(
    () => ({
      plan,
      meals,
      pricing,
      dailyMacros,
      subscription,
      subscriptionMeals,
      subscriptionPricing,
      subscriptionMacros,
      startFromBox,
      startCustom,
      editSubscription,
      toggleMealTime,
      toggleWeekday,
      setDayCount,
      toggleDish,
      applySaver,
      confirm,
      skipDay,
      postponeDay,
      clearException,
      cancelSubscription,
    }),
    [
      plan,
      meals,
      pricing,
      dailyMacros,
      subscription,
      subscriptionMeals,
      subscriptionPricing,
      subscriptionMacros,
      startFromBox,
      startCustom,
      editSubscription,
      toggleMealTime,
      toggleWeekday,
      setDayCount,
      toggleDish,
      applySaver,
      confirm,
      skipDay,
      postponeDay,
      clearException,
      cancelSubscription,
    ],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider');
  return ctx;
}
