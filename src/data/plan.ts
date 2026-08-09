import {
  type BoxGoal,
  type DietBox,
  type Macros,
  type SaverKey,
  type ScheduleException,
  BOX_REFERENCE_MEALS,
  DEFAULT_DAY_COUNT,
  DEFAULT_DAYS,
  DEFAULT_MEALS,
  MAX_DAYS,
  TRIM_PROTEIN_PCT,
  boxDaily,
  discountForDays,
  dishes,
  macros as dishMacros,
} from './menu';
import {
  ADDON_HANDLING,
  type MacroDelta,
  ZERO_DELTA,
  addOnsMacros,
  applyDelta,
  clampDelta,
  mealPrice,
  sumMacros,
} from './nutrition';

export interface PlanState {
  boxId: BoxGoal | null;
  dishIds: string[];
  mealsPerDay: number;
  weekdays: number[];
  dayCount: number;
  deltas: Record<string, MacroDelta>;
  addOns: Record<string, string[]>;
  exceptions: ScheduleException[];
}

export interface MealLine {
  dishId: string;
  base: Macros;
  macros: Macros;
  price: number;
  addOns: string[];
  delta: MacroDelta;
}

export interface PlanPricing {
  activeDays: number;
  mealCount: number;
  perMealAvg: number;
  subtotal: number;
  discount: number;
  saved: number;
  total: number;
  perDay: number;
}

export const emptyPlan = (): PlanState => ({
  boxId: null,
  dishIds: [],
  mealsPerDay: DEFAULT_MEALS,
  weekdays: [...DEFAULT_DAYS],
  dayCount: DEFAULT_DAY_COUNT,
  deltas: {},
  addOns: {},
  exceptions: [],
});

export const baseOf = (dishId: string): Macros =>
  dishMacros[dishId] ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };

// A box advertises a daily macro target, but its raw dish rotation rarely hits
// it on its own. Seed each dish with the delta that takes the rotation to the
// box's per-meal share, so the number on the card is the number delivered.
// Deltas still clamp per dish, so a dish is never pushed somewhere absurd.
export const planFromBox = (box: DietBox): PlanState => {
  const mealsPerDay = BOX_REFERENCE_MEALS;
  const target = boxDaily(box);
  const deltas: Record<string, MacroDelta> = {};
  box.dishes.forEach((id) => {
    const base = baseOf(id);
    deltas[id] = {
      protein: clampDelta(base, 'protein', Math.round(target.protein / mealsPerDay - base.protein)),
      carbs: clampDelta(base, 'carbs', Math.round(target.carbs / mealsPerDay - base.carbs)),
      fat: clampDelta(base, 'fat', Math.round(target.fat / mealsPerDay - base.fat)),
    };
  });
  return { ...emptyPlan(), boxId: box.id, dishIds: [...box.dishes], mealsPerDay, deltas };
};

export const buildMeals = (plan: PlanState): MealLine[] =>
  plan.dishIds.map((dishId) => {
    const base = baseOf(dishId);
    const delta = plan.deltas[dishId] ?? ZERO_DELTA;
    const extras = plan.addOns[dishId] ?? [];
    const macros = sumMacros([applyDelta(base, delta), addOnsMacros(extras)]);
    return {
      dishId,
      base,
      macros,
      delta,
      addOns: extras,
      price: mealPrice(macros) + extras.length * ADDON_HANDLING,
    };
  });

// Days the plan actually delivers on: walk `dayCount` days from the start,
// keep the ones on a selected weekday, then drop anything the user skipped.
export const countActiveDays = (plan: PlanState): number => {
  if (plan.weekdays.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < plan.dayCount; i += 1) {
    if (plan.weekdays.includes(i % 7)) count += 1;
  }
  const skipped = plan.exceptions.filter(
    (e) => e.kind === 'skip' && plan.weekdays.includes(e.dayIndex % 7),
  ).length;
  return Math.max(0, count - skipped);
};

export const priceOf = (plan: PlanState, meals: MealLine[]): PlanPricing => {
  const activeDays = countActiveDays(plan);
  const mealCount = activeDays * plan.mealsPerDay;
  const perMealAvg = meals.length > 0 ? meals.reduce((s, m) => s + m.price, 0) / meals.length : 0;
  const subtotal = Math.round(perMealAvg * mealCount);
  const discount = discountForDays(plan.dayCount);
  const total = Math.round(subtotal * (1 - discount));
  return {
    activeDays,
    mealCount,
    perMealAvg: Math.round(perMealAvg),
    subtotal,
    discount,
    saved: subtotal - total,
    total,
    perDay: activeDays > 0 ? Math.round(total / activeDays) : 0,
  };
};

export const dailyMacrosOf = (plan: PlanState, meals: MealLine[]): Macros => {
  if (meals.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const sum = sumMacros(meals.map((m) => m.macros));
  const n = meals.length;
  return {
    calories: Math.round((sum.calories / n) * plan.mealsPerDay),
    protein: Math.round((sum.protein / n) * plan.mealsPerDay),
    carbs: Math.round((sum.carbs / n) * plan.mealsPerDay),
    fat: Math.round((sum.fat / n) * plan.mealsPerDay),
  };
};

// Pure so Subscribe can price a lever before the user commits to it.
export const applySaverTo = (p: PlanState, key: SaverKey): PlanState => {
  switch (key) {
    case 'trimProtein': {
      const deltas = { ...p.deltas };
      p.dishIds.forEach((dishId) => {
        const base = baseOf(dishId);
        const current = deltas[dishId] ?? ZERO_DELTA;
        deltas[dishId] = {
          ...current,
          protein: clampDelta(
            base,
            'protein',
            current.protein - Math.round(base.protein * TRIM_PROTEIN_PCT),
          ),
        };
      });
      return { ...p, deltas };
    }
    case 'fewerMeals':
      return { ...p, mealsPerDay: Math.max(1, p.mealsPerDay - 1) };
    case 'swapCheaper': {
      // Trade the priciest dish in the rotation for the cheapest one not in it.
      if (p.dishIds.length === 0) return p;
      const cost = (id: string) => mealPrice(baseOf(id));
      const dearest = p.dishIds.reduce((a, b) => (cost(b) > cost(a) ? b : a));
      const candidates = dishes
        .map((d) => d.id)
        .filter((id) => !p.dishIds.includes(id) && dishMacros[id]);
      if (candidates.length === 0) return p;
      const cheapest = candidates.reduce((a, b) => (cost(b) < cost(a) ? b : a));
      if (cost(cheapest) >= cost(dearest)) return p;
      const { [dearest]: _dropped, ...deltas } = p.deltas;
      return {
        ...p,
        dishIds: p.dishIds.map((id) => (id === dearest ? cheapest : id)),
        deltas,
      };
    }
    case 'longerTerm': {
      const next = p.dayCount < 14 ? 14 : p.dayCount < 30 ? 30 : MAX_DAYS;
      return { ...p, dayCount: next };
    }
    default:
      return p;
  }
};

// Measured per-day, not on the total: committing to a longer term adds days but
// unlocks a bigger discount, and only the daily rate makes that legible.
export const saverSaving = (p: PlanState, key: SaverKey): number => {
  const before = priceOf(p, buildMeals(p)).perDay;
  const next = applySaverTo(p, key);
  return before - priceOf(next, buildMeals(next)).perDay;
};
