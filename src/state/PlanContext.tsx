import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
import { type MacroKey, ZERO_DELTA, clampDelta } from '../data/nutrition';
import {
  type MealLine,
  type PlanPricing,
  type PlanState,
  applySaverTo,
  baseOf,
  buildMeals,
  countActiveDays,
  dailyMacrosOf,
  emptyPlan,
  planFromBox,
  priceOf,
} from '../data/plan';

export type { MealLine, PlanPricing, PlanState };
export { buildMeals, countActiveDays, priceOf, saverSaving } from '../data/plan';

const PLAN_KEY = '@jareesh/subscription';

interface PlanValue {
  plan: PlanState;
  meals: MealLine[];
  pricing: PlanPricing;
  dailyMacros: Macros;
  planMacros: Macros;
  subscription: PlanState | null;
  subscriptionMeals: MealLine[];
  subscriptionPricing: PlanPricing | null;
  startFromBox: (boxId: BoxGoal) => void;
  startCustom: () => void;
  setMealsPerDay: (n: number) => void;
  toggleWeekday: (index: number) => void;
  setDayCount: (n: number) => void;
  toggleDish: (dishId: string) => void;
  setDelta: (dishId: string, key: MacroKey, value: number) => void;
  resetDelta: (dishId: string) => void;
  toggleAddOn: (dishId: string, addOnId: string) => void;
  setPlanTarget: (key: MacroKey, total: number) => void;
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
    setPlan({ ...emptyPlan(), boxId: null, dishIds: [] });
  }, []);

  const setMealsPerDay = useCallback((n: number) => {
    setPlan((p) => ({ ...p, mealsPerDay: Math.max(1, Math.min(4, n)) }));
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

  const setDelta = useCallback((dishId: string, key: MacroKey, value: number) => {
    setPlan((p) => {
      const base = baseOf(dishId);
      const current = p.deltas[dishId] ?? ZERO_DELTA;
      return {
        ...p,
        deltas: { ...p.deltas, [dishId]: { ...current, [key]: clampDelta(base, key, value) } },
      };
    });
  }, []);

  const resetDelta = useCallback((dishId: string) => {
    setPlan((p) => {
      const { [dishId]: _removed, ...rest } = p.deltas;
      return { ...p, deltas: rest, addOns: { ...p.addOns, [dishId]: [] } };
    });
  }, []);

  const toggleAddOn = useCallback((dishId: string, addOnId: string) => {
    setPlan((p) => {
      const current = p.addOns[dishId] ?? [];
      return {
        ...p,
        addOns: {
          ...p.addOns,
          [dishId]: current.includes(addOnId)
            ? current.filter((a) => a !== addOnId)
            : [...current, addOnId],
        },
      };
    });
  }, []);

  // Spread a plan-wide target ("500g protein this week") across every meal the
  // plan will deliver, then clamp each dish to what it can realistically carry.
  const setPlanTarget = useCallback((key: MacroKey, total: number) => {
    setPlan((p) => {
      const mealCount = countActiveDays(p) * p.mealsPerDay;
      if (mealCount === 0 || p.dishIds.length === 0) return p;
      const perMeal = total / mealCount;
      const deltas = { ...p.deltas };
      p.dishIds.forEach((dishId) => {
        const base = baseOf(dishId);
        const current = deltas[dishId] ?? ZERO_DELTA;
        deltas[dishId] = {
          ...current,
          [key]: clampDelta(base, key, Math.round(perMeal - base[key])),
        };
      });
      return { ...p, deltas };
    });
  }, []);

  const applySaver = useCallback((key: SaverKey) => {
    setPlan((p) => applySaverTo(p, key));
  }, []);

  const confirm = useCallback(() => {
    persist(plan);
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
  const pricing = useMemo(() => priceOf(plan, meals), [plan, meals]);
  const dailyMacros = useMemo(() => dailyMacrosOf(plan, meals), [plan, meals]);

  const planMacros = useMemo(() => {
    const days = pricing.activeDays;
    return {
      calories: dailyMacros.calories * days,
      protein: dailyMacros.protein * days,
      carbs: dailyMacros.carbs * days,
      fat: dailyMacros.fat * days,
    };
  }, [dailyMacros, pricing.activeDays]);

  const subscriptionMeals = useMemo(
    () => (subscription ? buildMeals(subscription) : []),
    [subscription],
  );
  const subscriptionPricing = useMemo(
    () => (subscription ? priceOf(subscription, subscriptionMeals) : null),
    [subscription, subscriptionMeals],
  );

  const value = useMemo(
    () => ({
      plan,
      meals,
      pricing,
      dailyMacros,
      planMacros,
      subscription,
      subscriptionMeals,
      subscriptionPricing,
      startFromBox,
      startCustom,
      setMealsPerDay,
      toggleWeekday,
      setDayCount,
      toggleDish,
      setDelta,
      resetDelta,
      toggleAddOn,
      setPlanTarget,
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
      planMacros,
      subscription,
      subscriptionMeals,
      subscriptionPricing,
      startFromBox,
      startCustom,
      setMealsPerDay,
      toggleWeekday,
      setDayCount,
      toggleDish,
      setDelta,
      resetDelta,
      toggleAddOn,
      setPlanTarget,
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
