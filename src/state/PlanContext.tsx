import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type BoxGoal,
  type Macros,
  type SaverKey,
  CUSTOM_SLOT_ICON,
  DEFAULT_SLOT_TIME,
  MAX_DAYS,
  MAX_POSTPONE_DAYS,
  MAX_SLOTS,
  MIN_DAYS,
  builtInSlots,
  defaultSlots,
  getBox,
} from '../data/menu';
import {
  type MealBuildState,
  type MealLine,
  type PlanPricing,
  type PlanState,
  addGridDay,
  applySaverTo,
  buildMeals,
  dailyMacrosOf,
  emptyPlan,
  planFromBox,
  priceOf,
  pruneGrid,
  removeGridDay,
  sortSlotsByTime,
  setGridDish,
  spreadOverSlots,
  withoutSlot,
} from '../data/plan';
import { useAuth } from './AuthContext';

export type { MealBuildState, MealLine, PlanPricing, PlanState };
export { cycleNoteKey, dayCountOf, deliveryDays, gridOf, incompleteDays, postponedBy, postponedOffPlan, rotationDays, saverSaving, planProgress, upcomingDeliveries, weekdayOf } from '../data/plan';
export type { PlanProgress, UpcomingDay } from '../data/plan';

const PLAN_KEY = '@hail/subscription';

/** Which plan a meal's tailoring is saved onto. */
export type BuildTarget = 'plan' | 'subscription';

interface PlanValue {
  plan: PlanState;
  meals: MealLine[];
  pricing: PlanPricing;
  dailyMacros: Macros;
  subscription: PlanState | null;
  /** False until the stored subscription has been read back. */
  hydrated: boolean;
  subscriptionMeals: MealLine[];
  subscriptionPricing: PlanPricing | null;
  subscriptionMacros: Macros | null;
  /** Epoch ms, refreshed whenever the app comes back to the foreground, so
   *  "today" on a progress bar moves on after the app sat open overnight. */
  now: number;
  startFromBox: (boxId: BoxGoal) => void;
  startCustom: () => void;
  addSlot: (name: string, time: number) => void;
  /** Rename or re-time one slot; a renamed built-in stops following the locale. */
  updateSlot: (slotId: string, patch: { name?: string; time?: number }) => void;
  removeSlot: (slotId: string) => void;
  toggleWeekday: (index: number) => void;
  setDayCount: (n: number) => void;
  /** Puts a dish in one day's meal slot, or takes it back out. */
  setDayDish: (day: number, slotIndex: number, dishId: string) => void;
  addDay: () => void;
  removeDay: (day: number) => void;
  /** Drops every day that still has an empty meal time. */
  pruneDays: () => void;
  applySaver: (key: SaverKey) => void;
  /** Starts the plan being built as the subscription, replacing any running one. */
  confirm: () => void;
  skipDay: (dayIndex: number) => void;
  postponeDay: (dayIndex: number, byDays: number) => void;
  clearException: (id: string) => void;
  cancelSubscription: () => void;
  /** Records how one meal should be cooked, on the plan being built or the running one. */
  setMealBuild: (target: BuildTarget, dishId: string, build: MealBuildState) => void;
}

const PlanContext = createContext<PlanValue | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [plan, setPlan] = useState<PlanState>(emptyPlan);
  const [subscription, setSubscription] = useState<PlanState | null>(null);
  // False until storage has answered. Without it every screen that reads
  // `subscription` paints "no plan" first and then swaps a card in.
  const [hydrated, setHydrated] = useState(false);

  const [now, setNow] = useState(Date.now);

  // Progress is measured against "now", and a value pinned at mount goes stale
  // once the app has sat open past a day boundary. Coming back to the
  // foreground is the moment the customer looks again, so it re-reads then.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') setNow(Date.now());
    });
    return () => sub.remove();
  }, []);

  // The subscription is stored on the device, not against the account, so a
  // guest inheriting the last customer's live plan would see a card, a progress
  // bar and an upcoming list for something they cannot cancel and did not buy.
  // Signing out therefore clears it from disk as well as from state: the next
  // account to sign in on this device must not read it back as its own.
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authed') {
      setSubscription(null);
      void AsyncStorage.removeItem(PLAN_KEY);
      setHydrated(true);
      return;
    }
    // Signing in after browsing as a guest re-reads storage. Until it answers
    // there is nothing to show yet — not "no plan", which is what a hydrated
    // flag left over from the guest session would claim.
    setHydrated(false);
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
          // Slots written before delivery times existed carry none. A built-in
          // takes its own hour back; anything the customer named gets midday,
          // which is at least a time they can see is wrong and correct.
          if (saved.mealSlots.some((slot) => typeof slot.time !== 'number')) {
            saved.mealSlots = saved.mealSlots.map((slot) => ({
              ...slot,
              time:
                typeof slot.time === 'number'
                  ? slot.time
                  : (builtInSlots.find((b) => b.id === slot.id)?.time ?? DEFAULT_SLOT_TIME),
            }));
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
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [status]);

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

  // Custom ids are minted off a counter rather than the slot name, so renaming
  // or repeating a name never collides with an existing slot's dishes.
  const addSlot = useCallback((name: string, time: number) => {
    const label = name.trim();
    if (!label) return;
    setPlan((p) => {
      if (p.mealSlots.length >= MAX_SLOTS) return p;
      let n = p.mealSlots.length + 1;
      while (p.mealSlots.some((s) => s.id === `custom-${n}`)) n += 1;
      return sortSlotsByTime({
        ...p,
        mealSlots: [
          ...p.mealSlots,
          { id: `custom-${n}`, name: label, icon: CUSTOM_SLOT_ICON, time },
        ],
      });
    });
  }, []);

  /**
   * Renames or re-times one slot in place. Editing a built-in drops its
   * `labelKey` for the typed name, since a slot the customer has renamed must
   * not snap back to "فطور" when they switch language.
   */
  const updateSlot = useCallback((slotId: string, patch: { name?: string; time?: number }) => {
    setPlan((p) =>
      sortSlotsByTime({
        ...p,
        mealSlots: p.mealSlots.map((s) => {
          if (s.id !== slotId) return s;
          const label = patch.name?.trim();
          return {
            ...s,
            ...(label ? { name: label, labelKey: undefined } : null),
            ...(patch.time !== undefined ? { time: patch.time } : null),
          };
        }),
      }),
    );
  }, []);

  const removeSlot = useCallback((slotId: string) => {
    setPlan((p) => withoutSlot(p, slotId));
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

  const setDayDish = useCallback((day: number, slotIndex: number, dishId: string) => {
    setPlan((p) => setGridDish(p, day, slotIndex, dishId));
  }, []);

  const addDay = useCallback(() => setPlan((p) => addGridDay(p)), []);

  const removeDay = useCallback((day: number) => setPlan((p) => removeGridDay(p, day)), []);

  const pruneDays = useCallback(() => setPlan((p) => pruneGrid(p)), []);

  const applySaver = useCallback((key: SaverKey) => {
    setPlan((p) => applySaverTo(p, key));
  }, []);

  // Confirming always starts a new term from today, whether or not a plan was
  // already running: a customer who picks a different plan is buying it, not
  // amending the one they are part-way through. The plan carries its meals'
  // tailoring with it, so what was chosen while building is what gets cooked.
  const confirm = useCallback(() => {
    persist({ ...plan, exceptions: [], startedAt: Date.now() });
  }, [persist, plan]);

  const mutateSubscription = useCallback((fn: (s: PlanState) => PlanState) => {
    setSubscription((s) => {
      if (!s) return s;
      const next = fn(s);
      void AsyncStorage.setItem(PLAN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // A meal opened while building belongs to the plan on the builder, not to the
  // subscription already running — writing every edit to the subscription lost
  // the tailoring the moment the new plan was confirmed.
  const setMealBuild = useCallback(
    (target: BuildTarget, dishId: string, build: MealBuildState) => {
      const withBuild = (p: PlanState): PlanState => ({
        ...p,
        mealBuilds: { ...(p.mealBuilds ?? {}), [dishId]: build },
      });
      if (target === 'plan') setPlan(withBuild);
      else mutateSubscription(withBuild);
    },
    [mutateSubscription],
  );

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
      hydrated,
      subscriptionMeals,
      subscriptionPricing,
      subscriptionMacros,
      now,
      startFromBox,
      startCustom,
      addSlot,
      updateSlot,
      removeSlot,
      toggleWeekday,
      setDayCount,
      setDayDish,
      addDay,
      removeDay,
      pruneDays,
      applySaver,
      confirm,
      skipDay,
      postponeDay,
      clearException,
      cancelSubscription,
      setMealBuild,
    }),
    [
      plan,
      meals,
      pricing,
      dailyMacros,
      subscription,
      hydrated,
      subscriptionMeals,
      subscriptionPricing,
      subscriptionMacros,
      now,
      startFromBox,
      startCustom,
      addSlot,
      updateSlot,
      removeSlot,
      toggleWeekday,
      setDayCount,
      setDayDish,
      addDay,
      removeDay,
      pruneDays,
      applySaver,
      confirm,
      skipDay,
      postponeDay,
      clearException,
      cancelSubscription,
      setMealBuild,
    ],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider');
  return ctx;
}
