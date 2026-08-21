import {
  type BoxGoal,
  type DietBox,
  type Macros,
  type SaverKey,
  type ScheduleException,
  type MealSlot,
  DEFAULT_DAY_COUNT,
  DEFAULT_DAYS,
  defaultSlots,
  discountForDays,
  dishes,
  getDish,
  macros as dishMacros,
  nextDiscountDays,
  parsePrice,
  roundMoney,
  subscriptionPrice,
} from './menu';

export interface PlanState {
  boxId: BoxGoal | null;
  dishIds: string[];
  // Which meal slot each chosen dish belongs to: dishId -> MealSlot.id.
  // `dishIds` stays the flat source of truth for pricing and macros, so nothing
  // downstream had to learn about slots; this only tells the builder which step
  // a dish was picked in.
  slots: Record<string, string>;
  // The daily rotation's eating occasions, in order. How many there are is the
  // meals-per-day count, so adding a slot reprices the plan.
  mealSlots: MealSlot[];
  weekdays: number[]; // indices into `dayKeys`, Sat-to-Fri
  dayCount: number;
  exceptions: ScheduleException[];
  // Epoch ms the subscription was confirmed. Every "what is left" figure is
  // measured from here — without it `dayIndex` offsets have no anchor in real
  // time and the plan can only ever describe itself from day zero.
  startedAt: number;
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
  slots: {},
  mealSlots: defaultSlots(),
  weekdays: [...DEFAULT_DAYS],
  dayCount: DEFAULT_DAY_COUNT,
  exceptions: [],
  startedAt: 0,
});

// A box is designed around all three meal times — its advertised daily macros
// assume the full set — so subscribing to one seeds every slot.
export const planFromBox = (box: DietBox): PlanState => ({
  ...emptyPlan(),
  boxId: box.id,
  dishIds: [...box.dishes],
  slots: spreadOverSlots(box.dishes, defaultSlots().map((s) => s.id)),
  mealSlots: defaultSlots(),
});

// Deals a flat rotation round-robin across the meal times, so a box opens in
// the builder with every step already populated instead of everything landing
// on breakfast.
export const spreadOverSlots = (
  dishIds: string[],
  slotIds: string[],
): Record<string, string> => {
  const out: Record<string, string> = {};
  if (slotIds.length === 0) return out;
  dishIds.forEach((id, i) => {
    out[id] = slotIds[i % slotIds.length];
  });
  return out;
};

export const dishesForSlot = (plan: PlanState, slotId: string): string[] =>
  plan.dishIds.filter((id) => plan.slots[id] === slotId);

// Order is meaningful — it is the sequence the builder walks and the order the
// day's meals are listed in — so moving a slot only touches `mealSlots`.
// `slots` keys off slot id, not position, so no dish has to be rehomed.
export const reorderSlots = (p: PlanState, from: number, to: number): PlanState => {
  if (from === to || from < 0 || to < 0) return p;
  if (from >= p.mealSlots.length || to >= p.mealSlots.length) return p;
  const mealSlots = [...p.mealSlots];
  const [moved] = mealSlots.splice(from, 1);
  mealSlots.splice(to, 0, moved);
  return { ...p, mealSlots };
};

// Drops a slot and rehomes whatever was picked for it onto a surviving one, so
// removing an occasion never silently loses dishes out of the rotation.
export const withoutSlot = (p: PlanState, slotId: string): PlanState => {
  if (p.mealSlots.length <= 1) return p;
  const idx = p.mealSlots.findIndex((s) => s.id === slotId);
  if (idx < 0) return p;
  const mealSlots = p.mealSlots.filter((s) => s.id !== slotId);
  const fallback = mealSlots[Math.max(0, idx - 1)].id;
  const slots = { ...p.slots };
  for (const id of Object.keys(slots)) {
    if (slots[id] === slotId) slots[id] = fallback;
  }
  return { ...p, mealSlots, slots };
};

const baseOf = (dishId: string): Macros => dishMacros[dishId] ?? ZERO_MACROS;

export const mealsPerDayOf = (plan: PlanState): number => plan.mealSlots.length;

const dishPrice = (dishId: string): number => parsePrice(getDish(dishId)?.price ?? '0');

// Every line on a plan is priced the same way, whether the plan came from a box
// or was built from scratch: the dish's own menu price less the subscription
// saving, on a 250 step. The rate is no longer anchored per box, so what a
// rotation costs is simply what its meals cost.
export const buildMeals = (plan: PlanState): MealLine[] =>
  plan.dishIds.map((dishId) => ({
    dishId,
    macros: baseOf(dishId),
    price: subscriptionPrice(dishId),
  }));

// The rotation split the way the customer actually eats it: one entry per day,
// each holding that day's meals in meal-slot order.
//
// `spreadOverSlots` deals the flat rotation round-robin across the meal times,
// so line `i` belongs to slot `i % mealsPerDay` — which makes a day simply the
// next `mealsPerDay` lines, and line `j` of every day the same slot. Once the
// rotation runs out the subscription starts it again from the top, so a plan
// with two days' worth of dishes serves day 1's meals again on day 3.
//
// A rotation that doesn't divide evenly leaves the last day short rather than
// borrowing from the next lap; that is the shape of the box, not a rounding
// choice to make here.
export const rotationDays = (plan: PlanState, meals: MealLine[]): MealLine[][] => {
  const perDay = mealsPerDayOf(plan);
  if (perDay <= 0) return [];
  const days: MealLine[][] = [];
  for (let i = 0; i < meals.length; i += perDay) {
    days.push(meals.slice(i, i + perDay));
  }
  return days;
};

// Which sentence describes a rotation of this many days. Arabic counts two as a
// dual rather than as "2 days", so the cases are separate strings instead of one
// template; three and up share the plural. Callers interpolate `{n}` themselves,
// which is a no-op for the first two keys.
export const cycleNoteKey = (dayCount: number): string =>
  dayCount <= 1
    ? 'rotation.cycleDay'
    : dayCount === 2
      ? 'rotation.cycleTwo'
      : 'rotation.cycleMany';

// What one rotation of this plan costs, and the average meal within it. Derived
// from the same line prices the screens list, so the total always adds up to
// what is shown above it.
export const rotationTotal = (plan: PlanState): number =>
  plan.dishIds.reduce((sum, id) => sum + subscriptionPrice(id), 0);

const perMealOf = (plan: PlanState): number =>
  plan.dishIds.length > 0 ? roundMoney(rotationTotal(plan) / plan.dishIds.length) : 0;

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
  // Every figure below is stepped, so the saving stays the exact difference
  // between the two numbers on screen rather than a third rounding of its own.
  const total = roundMoney(subtotal * (1 - discount));
  return {
    activeDays,
    mealsPerDay,
    mealCount,
    perMeal,
    subtotal,
    discount,
    saved: subtotal - total,
    total,
    perDay: activeDays > 0 ? roundMoney(total / activeDays) : 0,
    perWeek: plan.dayCount > 0 ? roundMoney((total * 7) / plan.dayCount) : 0,
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
      return withoutSlot(p, p.mealSlots[p.mealSlots.length - 1]?.id ?? '');
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
      const { [dearest]: dearestSlot, ...rest } = p.slots;
      return {
        ...p,
        dishIds: p.dishIds.map((id) => (id === dearest ? cheapest : id)),
        slots: { ...rest, [cheapest]: dearestSlot ?? p.mealSlots[0]?.id ?? '' },
      };
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

// ── Progress ────────────────────────────────────────────────────────────────
// Everything the customer needs to answer "how much of this have I had, how
// much is left, and when does it end". All of it derives from `startedAt` plus
// the same schedule rules `countActiveDays` uses, so the totals here and the
// price on the plan card can never disagree.

const DAY_MS = 86_400_000;

export interface PlanProgress {
  /** Whole days since the subscription started; 0 on the first day. */
  elapsedDays: number;
  /** Scheduled delivery days that have already passed. */
  deliveredDays: number;
  /** Scheduled delivery days still to come, today included. */
  remainingDays: number;
  /** Every scheduled delivery day, skips and off-plan postpones removed. */
  totalDays: number;
  deliveredMeals: number;
  remainingMeals: number;
  totalMeals: number;
  /** 0–1, by delivery days rather than calendar days — a plan that delivers
   *  Sat–Wed is not 50% done just because half the calendar span has passed. */
  ratio: number;
  /** Calendar days until the paid span closes; 0 once it has. */
  endsInDays: number;
  endsAt: number;
  /** Day offset of the next delivery, or null when the plan is finished. */
  nextDayIndex: number | null;
  finished: boolean;
}

/** Day offsets the plan delivers on, honouring skips and postpones. */
export const deliveryDays = (plan: PlanState): number[] => {
  const moved = new Map<number, number>();
  const skipped = new Set<number>();
  plan.exceptions.forEach((e) => {
    if (e.kind === 'skip') skipped.add(e.dayIndex);
    else if (e.kind === 'postpone') moved.set(e.dayIndex, e.movedTo ?? e.dayIndex);
  });

  const out: number[] = [];
  for (let i = 0; i < plan.dayCount; i += 1) {
    if (!plan.weekdays.includes(i % 7) || skipped.has(i)) continue;
    const at = moved.get(i) ?? i;
    if (at < plan.dayCount) out.push(at);
  }
  return out.sort((a, b) => a - b);
};

/** The next `count` delivery offsets at or after `from`. */
export const upcomingDeliveries = (plan: PlanState, from: number, count: number): number[] =>
  deliveryDays(plan)
    .filter((d) => d >= from)
    .slice(0, count);

export const planProgress = (plan: PlanState, now: number = Date.now()): PlanProgress => {
  // A subscription restored from a build that predates `startedAt` reads as
  // starting today rather than in 1970, which would show it instantly expired.
  const start = plan.startedAt > 0 ? plan.startedAt : now;
  const elapsedDays = Math.max(0, Math.floor((now - start) / DAY_MS));

  const days = deliveryDays(plan);
  const totalDays = days.length;
  const deliveredDays = days.filter((d) => d < elapsedDays).length;
  const remainingDays = totalDays - deliveredDays;

  const perDay = mealsPerDayOf(plan);
  const next = days.find((d) => d >= elapsedDays);
  const endsInDays = Math.max(0, plan.dayCount - elapsedDays);

  return {
    elapsedDays,
    deliveredDays,
    remainingDays,
    totalDays,
    deliveredMeals: deliveredDays * perDay,
    remainingMeals: remainingDays * perDay,
    totalMeals: totalDays * perDay,
    ratio: totalDays > 0 ? deliveredDays / totalDays : 0,
    endsInDays,
    endsAt: start + plan.dayCount * DAY_MS,
    nextDayIndex: next ?? null,
    finished: remainingDays === 0,
  };
};
