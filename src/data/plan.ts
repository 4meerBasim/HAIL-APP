import {
  type BoxGoal,
  type DietBox,
  type Macros,
  type SaverKey,
  type ScheduleException,
  ALL_TIMES,
  BASE_PER_MEAL,
  DEFAULT_DAY_COUNT,
  DEFAULT_DAYS,
  DEFAULT_TIMES,
  basketIndex,
  discountForDays,
  dishes,
  getBox,
  getDish,
  macros as dishMacros,
  menuAveragePrice,
  nextDiscountDays,
  parsePrice,
} from './menu';

export interface PlanState {
  boxId: BoxGoal | null;
  dishIds: string[];
  mealTimes: number[]; // indices into `timeKeys` — how many is the meals/day count
  weekdays: number[]; // indices into `dayKeys`, Sat-to-Fri
  dayCount: number;
  exceptions: ScheduleException[];
}

export interface MealLine {
  dishId: string;
  macros: Macros;
  price: number;
}

export interface PlanPricing {
  activeDays: number;
  mealsPerDay: number;
  mealCount: number;
  perMeal: number;
  subtotal: number;
  discount: number;
  saved: number;
  total: number;
  perDay: number;
  perWeek: number;
}

const ZERO_MACROS: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export const emptyPlan = (): PlanState => ({
  boxId: null,
  dishIds: [],
  mealTimes: [...DEFAULT_TIMES],
  weekdays: [...DEFAULT_DAYS],
  dayCount: DEFAULT_DAY_COUNT,
  exceptions: [],
});

// A box is designed around all three meal times — its advertised daily macros
// assume the full set — so subscribing to one seeds every slot.
export const planFromBox = (box: DietBox): PlanState => ({
  ...emptyPlan(),
  boxId: box.id,
  dishIds: [...box.dishes],
  mealTimes: [...ALL_TIMES],
});

const baseOf = (dishId: string): Macros => dishMacros[dishId] ?? ZERO_MACROS;

export const mealsPerDayOf = (plan: PlanState): number => plan.mealTimes.length;

const dishPrice = (dishId: string): number => parsePrice(getDish(dishId)?.price ?? '0');

// The rate one average-priced meal costs on this plan: a box's own headline
// price, or BASE_PER_MEAL for a plan built from scratch. Dividing by the box's
// default basket keeps its untouched rotation priced at exactly `perMeal`.
const rateAnchor = (plan: PlanState): number => {
  const box = plan.boxId ? getBox(plan.boxId) : undefined;
  return box ? box.perMeal / basketIndex(box.dishes) : BASE_PER_MEAL;
};

// One dish's share of the plan's per-meal rate, scaled by its menu price.
const dishRate = (plan: PlanState, dishId: string): number =>
  Math.round((rateAnchor(plan) * dishPrice(dishId)) / menuAveragePrice);

const perMealOf = (plan: PlanState): number =>
  Math.round(rateAnchor(plan) * basketIndex(plan.dishIds));

export const buildMeals = (plan: PlanState): MealLine[] =>
  plan.dishIds.map((dishId) => ({
    dishId,
    macros: baseOf(dishId),
    price: dishRate(plan, dishId),
  }));

// A delivery the plan would otherwise make: inside the span, on a chosen weekday.
const isScheduled = (plan: PlanState, dayIndex: number): boolean =>
  dayIndex >= 0 && dayIndex < plan.dayCount && plan.weekdays.includes(dayIndex % 7);

// Days the plan actually delivers on: walk `dayCount` days from the start and
// keep the ones on a selected weekday, then drop the ones the customer skipped
// and the ones they postponed past the last day of the paid span — a delivery
// pushed beyond the end is never made, so it is never charged for.
export const countActiveDays = (plan: PlanState): number => {
  if (plan.weekdays.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < plan.dayCount; i += 1) {
    if (plan.weekdays.includes(i % 7)) count += 1;
  }
  const dropped = plan.exceptions.filter(
    (e) =>
      isScheduled(plan, e.dayIndex) &&
      (e.kind === 'skip' || (e.movedTo ?? e.dayIndex) >= plan.dayCount),
  ).length;
  return Math.max(0, count - dropped);
};

// How far a delivery has been pushed, 0 when it runs on its original day.
export const postponedBy = (plan: PlanState, dayIndex: number): number => {
  const ex = plan.exceptions.find((e) => e.dayIndex === dayIndex && e.kind === 'postpone');
  return ex ? (ex.movedTo ?? dayIndex) - dayIndex : 0;
};

// True once the push has carried the delivery outside the paid span.
export const postponedOffPlan = (plan: PlanState, dayIndex: number): boolean => {
  const by = postponedBy(plan, dayIndex);
  return by > 0 && dayIndex + by >= plan.dayCount;
};

export const priceOf = (plan: PlanState): PlanPricing => {
  const activeDays = countActiveDays(plan);
  const mealsPerDay = mealsPerDayOf(plan);
  const mealCount = activeDays * mealsPerDay;
  const perMeal = perMealOf(plan);
  const subtotal = perMeal * mealCount;
  const discount = discountForDays(plan.dayCount);
  const total = Math.round(subtotal * (1 - discount));
  return {
    activeDays,
    mealsPerDay,
    mealCount,
    perMeal,
    subtotal,
    discount,
    saved: subtotal - total,
    total,
    perDay: activeDays > 0 ? Math.round(total / activeDays) : 0,
    perWeek: plan.dayCount > 0 ? Math.round((total * 7) / plan.dayCount) : 0,
  };
};

// What a day on the plan puts on the table — the rotation's average dish,
// multiplied by how many meal times are switched on. Display only.
export const dailyMacrosOf = (plan: PlanState, meals: MealLine[]): Macros => {
  if (meals.length === 0) return ZERO_MACROS;
  const perDay = mealsPerDayOf(plan) / meals.length;
  return {
    calories: Math.round(meals.reduce((s, m) => s + m.macros.calories, 0) * perDay),
    protein: Math.round(meals.reduce((s, m) => s + m.macros.protein, 0) * perDay),
    carbs: Math.round(meals.reduce((s, m) => s + m.macros.carbs, 0) * perDay),
    fat: Math.round(meals.reduce((s, m) => s + m.macros.fat, 0) * perDay),
  };
};

// Pure so Subscribe can price a lever before the user commits to it.
export const applySaverTo = (p: PlanState, key: SaverKey): PlanState => {
  switch (key) {
    case 'fewerMeals':
      return p.mealTimes.length > 1 ? { ...p, mealTimes: p.mealTimes.slice(0, -1) } : p;
    case 'fewerDays':
      return p.weekdays.length > 1 ? { ...p, weekdays: p.weekdays.slice(0, -1) } : p;
    case 'swapCheaper': {
      // Trade the priciest dish in the rotation for the cheapest one outside it.
      if (p.dishIds.length === 0) return p;
      const dearest = p.dishIds.reduce((a, b) => (dishPrice(b) > dishPrice(a) ? b : a));
      const pool = dishes.map((d) => d.id).filter((id) => !p.dishIds.includes(id));
      if (pool.length === 0) return p;
      const cheapest = pool.reduce((a, b) => (dishPrice(b) < dishPrice(a) ? b : a));
      if (dishPrice(cheapest) >= dishPrice(dearest)) return p;
      return { ...p, dishIds: p.dishIds.map((id) => (id === dearest ? cheapest : id)) };
    }
    case 'longerTerm': {
      const next = nextDiscountDays(p.dayCount);
      return next > p.dayCount ? { ...p, dayCount: next } : p;
    }
    default:
      return p;
  }
};

// Measured on the weekly cost, not the total: a longer term adds days but
// unlocks a bigger discount, and only the weekly rate makes that legible.
export const saverSaving = (p: PlanState, key: SaverKey): number =>
  priceOf(p).perWeek - priceOf(applySaverTo(p, key)).perWeek;
