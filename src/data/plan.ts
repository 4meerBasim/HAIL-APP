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
import { priceOf as optionPrice } from './extras';

export interface PlanState {
  boxId: BoxGoal | null;
  // The rotation as the customer builds it: one row per day, one cell per meal
  // slot, holding every dish chosen for that meal on that day. A cell is a list
  // because a meal time can carry more than one dish — two things at breakfast
  // are two meals delivered that morning, not one meal with two parts, and they
  // are priced and counted as two.
  //
  // `dishIds` below is this grid flattened, kept in step on every edit, so
  // pricing, macros and the schedule never had to learn about days.
  grid?: string[][][];
  dishIds: string[];
  /** Per-dish tailoring, by dish id. Absent until something is changed. */
  mealBuilds?: Record<string, MealBuildState>;
  // Which meal slot each chosen dish belongs to: dishId -> MealSlot.id.
  // `dishIds` stays the flat source of truth for pricing and macros, so nothing
  // downstream had to learn about slots; this only tells the builder which step
  // a dish was picked in.
  slots: Record<string, string>;
  // The daily rotation's eating occasions, in order. How many there are is the
  // meals-per-day count, so adding a slot reprices the plan.
  mealSlots: MealSlot[];
  weekdays: number[]; // indices into `dayKeys`, Sun-to-Sat
  dayCount: number;
  exceptions: ScheduleException[];
  // Epoch ms the subscription was confirmed. Every "what is left" figure is
  // measured from here — without it `dayIndex` offsets have no anchor in real
  // time and the plan can only ever describe itself from day zero.
  startedAt: number;
}

// How one meal of the plan was tailored: the size it is cooked at and what the
// customer asked to be added to it. Keyed by dish, because a plan carries one
// line per dish and the kitchen cooks that dish the same way every time it
// comes round in the rotation.
export interface MealBuildState {
  size: string;
  extras: string[];
  items: Record<string, number>;
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

// A box seeds whatever the default meal times are — one, today. Its advertised
// daily macros were written for a three-meal day, so a plan opened from a box
// delivers less than the box's own headline until the customer adds the other
// meal times back.
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

// ── The day grid ────────────────────────────────────────────────────────────
// A plan of one or two built days repeats for the length of the subscription:
// `rotationDays` already chunks the flat list into days and the schedule starts
// it again once it runs out, so building three days and running for a month is
// the same machinery as building one.

const emptyRow = (slots: number): string[][] => Array.from({ length: slots }, () => []);

/**
 * A cell as it comes off storage. Grids written before a meal time could hold
 * more than one dish stored `string | null` per cell; both shapes have to read
 * the same way here or a stored plan is a launch crash.
 */
const cellOf = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((id): id is string => typeof id === 'string');
  return typeof value === 'string' ? [value] : [];
};

/** How many meal times a day has. Structure — not the number of dishes in it. */
export const slotCountOf = (plan: PlanState): number => plan.mealSlots.length;

// Two days is what a rotation looks like: one is "the same thing every day",
// which nobody sets out to build, and asking for the second to be added by hand
// made it feel like an advanced option rather than the normal case.
export const ROTATION_DAYS = 2;

/** The grid as it stands, derived from the flat list for plans built before it. */
export const gridOf = (plan: PlanState): string[][][] => {
  const slots = slotCountOf(plan);
  if (slots <= 0) return [];
  if (plan.grid?.length) {
    // A meal time added or removed since the grid was written changes the row
    // width, and an older build wrote one dish per cell rather than a list.
    return plan.grid.map((row) => {
      const next = emptyRow(slots);
      (row as unknown[]).slice(0, slots).forEach((value, i) => {
        next[i] = cellOf(value);
      });
      return next;
    });
  }
  // No grid yet: the flat rotation was dealt round-robin across the meal times,
  // so it rebuilds a day at a time.
  const rows: string[][][] = [];
  for (let i = 0; i < plan.dishIds.length; i += slots) {
    const row = emptyRow(slots);
    plan.dishIds.slice(i, i + slots).forEach((id, j) => {
      row[j] = [id];
    });
    rows.push(row);
  }
  // A plan with nothing picked yet still has days to pick into.
  while (rows.length < ROTATION_DAYS) rows.push(emptyRow(slots));
  return rows;
};

/** Writes a grid back onto the plan, keeping the flat list and slot map in step. */
export const withGrid = (plan: PlanState, grid: string[][][]): PlanState => {
  const slotIds = plan.mealSlots.map((s) => s.id);
  const dishIds: string[] = [];
  const slots: Record<string, string> = {};
  grid.forEach((row) => {
    row.forEach((cell, i) => {
      cell.forEach((id) => {
        // One entry per pick, duplicates included: two of the same dish across
        // the rotation are two meals to cook and two to pay for.
        dishIds.push(id);
        slots[id] = slotIds[i] ?? slotIds[0];
      });
    });
  });
  return { ...plan, grid, dishIds, slots };
};

export const dayCountOf = (plan: PlanState): number => gridOf(plan).length;

/**
 * Adds a dish to one meal time on one day, or takes it back out if it is
 * already there. A meal time holds as many as the customer picks.
 */
export const setGridDish = (
  plan: PlanState,
  day: number,
  slotIndex: number,
  dishId: string,
): PlanState => {
  const grid = gridOf(plan);
  const cell = grid[day]?.[slotIndex];
  if (!cell) return plan;
  const next = grid.map((row) => row.map((c) => [...c]));
  next[day][slotIndex] = cell.includes(dishId)
    ? cell.filter((id) => id !== dishId)
    : [...cell, dishId];
  return withGrid(plan, next);
};

export const addGridDay = (plan: PlanState): PlanState =>
  withGrid(plan, [...gridOf(plan), emptyRow(slotCountOf(plan))]);

/** Days with a meal time still empty. A day is delivered whole or not at all. */
export const incompleteDays = (plan: PlanState): number[] =>
  gridOf(plan)
    .map((row, i) => (row.some((cell) => cell.length === 0) ? i : -1))
    .filter((i) => i >= 0);

/** Keeps the finished days and throws the rest away. */
export const pruneGrid = (plan: PlanState): PlanState => {
  const kept = gridOf(plan).filter((row) => row.every((cell) => cell.length > 0));
  return kept.length > 0 ? withGrid(plan, kept) : plan;
};

export const removeGridDay = (plan: PlanState, day: number): PlanState => {
  const grid = gridOf(plan);
  // The rotation cannot be empty: one day is the floor.
  if (grid.length <= 1) return plan;
  return withGrid(
    plan,
    grid.filter((_r, i) => i !== day),
  );
};

/**
 * Puts the meal times in clock order, and moves each day's cells with them.
 *
 * Order is meaningful — it is the sequence the builder walks and the order a
 * day's meals are listed in — and once a slot carries a delivery time there is
 * only one order that can be right. Dragging them by hand could put dinner at
 * 20:00 ahead of breakfast at 08:00, and the hand reorder it replaced moved
 * `mealSlots` without moving the grid columns that index into them, so it
 * quietly rehomed the dishes as well. Sorting on the time settles both: the
 * customer rearranges the day by changing when a meal arrives.
 *
 * Stable on equal times, so two meals set to the same hour keep the order they
 * were added in rather than swapping about on every edit.
 */
export const sortSlotsByTime = (p: PlanState): PlanState => {
  const order = p.mealSlots
    .map((slot, i) => ({ slot, i }))
    .sort((a, b) => a.slot.time - b.slot.time || a.i - b.i);
  if (order.every((entry, i) => entry.i === i)) return p;
  const mealSlots = order.map((entry) => entry.slot);
  const grid = gridOf(p).map((row) => order.map((entry) => row[entry.i] ?? null));
  return withGrid({ ...p, mealSlots }, grid);
};

// Drops a slot and rehomes whatever was picked for it onto a surviving one, so
// removing an occasion never silently loses dishes out of the rotation.
//
// The grid has to lose the same column. Shrinking `mealSlots` alone left every
// row one cell too wide, and `gridOf` trims a too-wide row from the end — so
// deleting breakfast threw away dinner's dishes and slid the rest one meal
// time earlier.
export const withoutSlot = (p: PlanState, slotId: string): PlanState => {
  if (p.mealSlots.length <= 1) return p;
  const idx = p.mealSlots.findIndex((s) => s.id === slotId);
  if (idx < 0) return p;
  const mealSlots = p.mealSlots.filter((s) => s.id !== slotId);
  const fallback = Math.max(0, idx - 1);
  const grid = gridOf(p).map((row) => {
    const next = row.filter((_cell, i) => i !== idx).map((cell) => [...cell]);
    // A cell holds a dish once — picking it again takes it back out — so a
    // dish already on the neighbouring meal time is not added a second time.
    (row[idx] ?? []).forEach((id) => {
      if (!next[fallback].includes(id)) next[fallback].push(id);
    });
    return next;
  });
  return withGrid({ ...p, mealSlots }, grid);
};

const baseOf = (dishId: string): Macros => dishMacros[dishId] ?? ZERO_MACROS;

/**
 * Dishes delivered on an average day of the rotation — what the plan costs and
 * what the app calls "meals a day". Not the number of meal times: a meal time
 * can carry more than one dish, and each of those is a meal.
 *
 * Averaged because rotation days need not match — day one can carry a snack
 * that day two does not.
 */
export const mealsPerDayOf = (plan: PlanState): number => {
  const rows = gridOf(plan);
  if (rows.length === 0) return 0;
  return Math.round(dishesInGrid(rows) / rows.length);
};

const dishesPerDay = (rows: string[][][]): number[] =>
  rows.map((row) => row.reduce((n, cell) => n + cell.length, 0));

const dishesInGrid = (rows: string[][][]): number =>
  dishesPerDay(rows).reduce((sum, n) => sum + n, 0);

const dishPrice = (dishId: string): number => parsePrice(getDish(dishId)?.price ?? '0');

// What tailoring a meal adds to it: the bigger size, each extra, and every
// sweet or drink at its menu price. The same sum the meal page itemises, so
// the line on the plan and the total on that page agree.
const buildSurcharge = (build: MealBuildState | undefined): number =>
  build
    ? optionPrice(build.size) +
      build.extras.reduce((sum, id) => sum + optionPrice(id), 0) +
      Object.entries(build.items).reduce((sum, [id, n]) => sum + dishPrice(id) * n, 0)
    : 0;

// Every line on a plan is priced the same way, whether the plan came from a box
// or was built from scratch: the dish's own menu price less the subscription
// saving, on a 250 step, plus whatever tailoring it carries. The rate is no
// longer anchored per box, so what a rotation costs is simply what its meals
// cost — a double portion included, or the plan would deliver more than it
// charged for.
const linePrice = (plan: PlanState, dishId: string): number =>
  subscriptionPrice(dishId) + buildSurcharge(plan.mealBuilds?.[dishId]);

export const buildMeals = (plan: PlanState): MealLine[] =>
  plan.dishIds.map((dishId) => ({
    dishId,
    macros: baseOf(dishId),
    price: linePrice(plan, dishId),
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
/**
 * The rotation kept in its meal-slot shape: day → slot → the meals that arrive
 * at that time. `rotationDays` flattens this, which is what a caller listing a
 * day's food wants — but anything that labels each meal with the time it comes
 * at needs the nesting, because once a slot can hold two dishes a meal's
 * position in the flat list is no longer its slot's index.
 */
export const rotationDaySlots = (plan: PlanState, meals: MealLine[]): MealLine[][][] => {
  const byId = new Map<string, MealLine>();
  meals.forEach((meal) => {
    if (!byId.has(meal.dishId)) byId.set(meal.dishId, meal);
  });
  return gridOf(plan).map((row) =>
    row.map((cell) =>
      cell.map((id) => byId.get(id)).filter((meal): meal is MealLine => Boolean(meal)),
    ),
  );
};

export const rotationDays = (plan: PlanState, meals: MealLine[]): MealLine[][] =>
  rotationDaySlots(plan, meals).map((row) => row.flat());

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
  plan.dishIds.reduce((sum, id) => sum + linePrice(plan, id), 0);

const perMealOf = (plan: PlanState): number =>
  plan.dishIds.length > 0 ? roundMoney(rotationTotal(plan) / plan.dishIds.length) : 0;

// Which weekday a day offset falls on, as an index into `dayKeys` (Sunday 0).
// Day zero is the day the subscription started, not a Sunday — reading
// `dayIndex % 7` as the weekday meant a plan confirmed on a Tuesday delivered
// on the wrong days and labelled every row with a day it was not. A plan still
// being built has no start yet; it will start the day it is confirmed.
export const weekdayOf = (plan: PlanState, dayIndex: number): number => {
  const start = new Date(plan.startedAt > 0 ? plan.startedAt : Date.now()).getDay();
  return (start + dayIndex) % 7;
};

// A delivery the plan would otherwise make: inside the span, on a chosen weekday.
const isScheduled = (plan: PlanState, dayIndex: number): boolean =>
  dayIndex >= 0 && dayIndex < plan.dayCount && plan.weekdays.includes(weekdayOf(plan, dayIndex));

/** One delivery of the run. */
export interface Delivery {
  /** The scheduled day it belongs to — what a skip or a postpone is keyed by. */
  dayIndex: number;
  /** The day it actually arrives: `dayIndex`, unless it was postponed. */
  at: number;
  /** Its place in the run, which picks the rotation day it eats. */
  nth: number;
}

// Every delivery the plan makes: walk `dayCount` days from the start, keep the
// ones on a selected weekday, drop the ones the customer skipped and the ones
// they postponed past the last day of the paid span — a delivery pushed beyond
// the end is never made, so it is never charged for.
//
// One entry per scheduled day, not per date. A postponed day can land on one
// the plan already delivers on, and that is still two deliveries: the price
// charges both, so the list has to show both. Each keeps the day it was
// scheduled for, which is what its exception — and its Undo — hangs off.
export const deliveries = (plan: PlanState): Delivery[] => {
  const moved = new Map<number, number>();
  const skipped = new Set<number>();
  plan.exceptions.forEach((e) => {
    if (e.kind === 'skip') skipped.add(e.dayIndex);
    else if (e.kind === 'postpone') moved.set(e.dayIndex, e.movedTo ?? e.dayIndex);
  });

  const out: { dayIndex: number; at: number }[] = [];
  for (let i = 0; i < plan.dayCount; i += 1) {
    if (!isScheduled(plan, i) || skipped.has(i)) continue;
    const at = moved.get(i) ?? i;
    if (at < plan.dayCount) out.push({ dayIndex: i, at });
  }
  return out
    .sort((a, b) => a.at - b.at || a.dayIndex - b.dayIndex)
    .map((d, nth) => ({ ...d, nth }));
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

// How many meals a run of deliveries carries. Counted by walking the rotation
// over the delivery days rather than multiplying an average: days need not
// carry the same number of dishes, and an average would over- or under-count
// whichever day the plan ends on.
const mealsOn = (plan: PlanState, run: Delivery[]): number => {
  const perDay = dishesPerDay(gridOf(plan));
  if (perDay.length === 0) return 0;
  return run.reduce((sum, d) => sum + perDay[d.nth % perDay.length], 0);
};

export const priceOf = (plan: PlanState): PlanPricing => {
  // The same walk the upcoming list makes, so the price and the list of
  // deliveries can never count differently.
  const run = deliveries(plan);
  const activeDays = run.length;
  const mealsPerDay = mealsPerDayOf(plan);
  const mealCount = mealsOn(plan, run);
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
      // Swapped in the grid, cell by cell: the flat list is derived from it,
      // so editing only that was undone by the next `gridOf`.
      return withGrid(
        p,
        gridOf(p).map((row) =>
          row.map((cell) => cell.map((id) => (id === dearest ? cheapest : id))),
        ),
      );
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
// the same `deliveries` walk the price uses, so the totals here and the
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
export const deliveryDays = (plan: PlanState): number[] => deliveries(plan).map((d) => d.at);

/** One row of the upcoming list: a delivery, or a scheduled day that will not arrive. */
export interface UpcomingDay extends Delivery {
  /** Skipped, or postponed past the end of the run: listed, but not delivered. */
  dropped: boolean;
}

/**
 * The next `count` scheduled days arriving at or after `from`, deliveries and
 * dropped days together. A skipped day — or one pushed off the end of the run
 * — stays on the list so it can be undone; it eats nothing, so it borrows the
 * rotation day the next delivery will, which is what it would have been.
 */
export const upcomingDeliveries = (plan: PlanState, from: number, count: number): UpcomingDay[] => {
  const run = deliveries(plan);
  const dropped = plan.exceptions
    .filter(
      (e) =>
        isScheduled(plan, e.dayIndex) &&
        (e.kind === 'skip' || (e.movedTo ?? e.dayIndex) >= plan.dayCount),
    )
    .map((e) => ({
      dayIndex: e.dayIndex,
      at: e.dayIndex,
      nth: run.find((d) => d.at >= e.dayIndex)?.nth ?? run.length,
      dropped: true,
    }));
  return [...run.map((d) => ({ ...d, dropped: false })), ...dropped]
    .filter((d) => d.at >= from)
    .sort((a, b) => a.at - b.at || a.dayIndex - b.dayIndex)
    .slice(0, count);
};

export const planProgress = (plan: PlanState, now: number = Date.now()): PlanProgress => {
  // A subscription restored from a build that predates `startedAt` reads as
  // starting today rather than in 1970, which would show it instantly expired.
  const start = plan.startedAt > 0 ? plan.startedAt : now;
  const elapsedDays = Math.max(0, Math.floor((now - start) / DAY_MS));

  const run = deliveries(plan);
  const delivered = run.filter((d) => d.at < elapsedDays);
  const totalDays = run.length;
  const deliveredDays = delivered.length;
  const remainingDays = totalDays - deliveredDays;

  // Walked day by day, like the price: a rotation whose days carry different
  // numbers of dishes would otherwise drift from what was paid for.
  const totalMeals = mealsOn(plan, run);
  const deliveredMeals = mealsOn(plan, delivered);
  const next = run.find((d) => d.at >= elapsedDays);
  const endsInDays = Math.max(0, plan.dayCount - elapsedDays);

  return {
    elapsedDays,
    deliveredDays,
    remainingDays,
    totalDays,
    deliveredMeals,
    remainingMeals: totalMeals - deliveredMeals,
    totalMeals,
    ratio: totalDays > 0 ? deliveredDays / totalDays : 0,
    endsInDays,
    endsAt: start + plan.dayCount * DAY_MS,
    nextDayIndex: next?.at ?? null,
    finished: remainingDays === 0,
  };
};
