import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type BoxGoal,
  type Macros,
  type SaverKey,
  CUSTOM_SLOT_ICON,
  MAX_DAYS,
  MAX_POSTPONE_DAYS,
  MAX_SLOTS,
  MIN_DAYS,
  builtInSlots,
  defaultSlots,
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
  reorderSlots,
  spreadOverSlots,
  withoutSlot,
} from '../data/plan';

export type { MealLine, PlanPricing, PlanState };
export { cycleNoteKey, deliveryDays, dishesForSlot, postponedBy, postponedOffPlan, rotationDays, saverSaving, planProgress, upcomingDeliveries } from '../data/plan';
export type { PlanProgress } from '../data/plan';

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
  addSlot: (name: string) => void;
  removeSlot: (slotId: string) => void;
  moveSlot: (from: number, to: number) => void;
  toggleWeekday: (index: number) => void;
  setDayCount: (n: number) => void;
  toggleDish: (dishId: string, slotId: string) => void;
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
        if (alive && raw) {
          const saved = JSON.parse(raw) as PlanState;
          // Subscriptions written before `startedAt` existed have none. Anchor
          // them to now and write it back, so progress starts counting from
          // this launch instead of reading as expired since 1970.
          let migrated = false;
          if (!saved.startedAt) {
            saved.startedAt = Date.now();
            migrated = true;
          }
          // Subscriptions written before named slots stored `mealTimes` as
          // indices into `timeKeys` and `slots` as those same indices. Rebuild
          // both against the built-in slot list, then deal any rotation that
          // predates `slots` entirely across the result.
          const legacy = saved as unknown as { mealTimes?: number[] };
          if (!saved.mealSlots) {
            const rebuilt = (legacy.mealTimes ?? [])
              .map((i) => builtInSlots[i])
              .filter(Boolean)
              .map((slot) => ({ ...slot }));
            // A stored plan should never have zero meal times, but the remap
            // below dereferences mealSlots[0] and this runs on every cold
            // start — an empty array here would be a launch crash.
            saved.mealSlots = rebuilt.length > 0 ? rebuilt : defaultSlots();
            migrated = true;
          }
          if (saved.slots) {
            saved.slots = Object.fromEntries(
              Object.entries(saved.slots).map(([dishId, v]) => [
                dishId,
                typeof v === 'number' ? (builtInSlots[v]?.id ?? saved.mealSlots[0].id) : v,
              ]),
            );
          } else {
            saved.slots = spreadOverSlots(
              saved.dishIds ?? [],
              saved.mealSlots.map((slot) => slot.id),
            );
            migrated = true;
          }
          if (migrated) {
            void AsyncStorage.setItem(PLAN_KEY, JSON.stringify(saved));
          }
          setSubscription(saved);
        }
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

  // Custom ids are minted off a counter rather than the slot name, so renaming
  // or repeating a name never collides with an existing slot's dishes.
  const addSlot = useCallback((name: string) => {
    const label = name.trim();
    if (!label) return;
    setPlan((p) => {
      if (p.mealSlots.length >= MAX_SLOTS) return p;
      let n = p.mealSlots.length + 1;
      while (p.mealSlots.some((s) => s.id === `custom-${n}`)) n += 1;
      return {
        ...p,
        mealSlots: [...p.mealSlots, { id: `custom-${n}`, name: label, icon: CUSTOM_SLOT_ICON }],
      };
    });
  }, []);

  const removeSlot = useCallback((slotId: string) => {
    setPlan((p) => withoutSlot(p, slotId));
  }, []);

  const moveSlot = useCallback((from: number, to: number) => {
    setPlan((p) => reorderSlots(p, from, to));
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

  // Tapping a dish already sitting in another meal time moves it here rather
  // than refusing — a dish belongs to exactly one slot in the rotation.
  const toggleDish = useCallback((dishId: string, slotId: string) => {
    setPlan((p) => {
      const held = p.dishIds.includes(dishId);
      if (held && p.slots[dishId] === slotId) {
        const { [dishId]: _drop, ...slots } = p.slots;
        return { ...p, dishIds: p.dishIds.filter((d) => d !== dishId), slots };
      }
      return {
        ...p,
        dishIds: held ? p.dishIds : [...p.dishIds, dishId],
        slots: { ...p.slots, [dishId]: slotId },
      };
    });
  }, []);

  const applySaver = useCallback((key: SaverKey) => {
    setPlan((p) => applySaverTo(p, key));
  }, []);

  // Editing a live subscription keeps its original start date — the customer is
  // changing what arrives, not restarting the term they already paid for.
  const confirm = useCallback(() => {
    persist({
      ...plan,
      exceptions: [],
      startedAt: subscription?.startedAt || Date.now(),
    });
  }, [persist, plan, subscription]);

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
      addSlot,
      removeSlot,
      moveSlot,
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
      addSlot,
      removeSlot,
      moveSlot,
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
