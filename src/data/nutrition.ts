import type { Macros } from './menu';
import type { IconName } from '../components/icons';

export type Gender = 'male' | 'female';
export type ActivityKey = 'sedentary' | 'light' | 'moderate' | 'active';
export type GoalKey = 'lose' | 'maintain' | 'gain';

export interface BodyProfile {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityKey;
  goal: GoalKey;
}

export const activityFactor: Record<ActivityKey, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export const goalFactor: Record<GoalKey, number> = {
  lose: 0.8,
  maintain: 1,
  gain: 1.15,
};

// Protein per kg of bodyweight, by goal.
const proteinPerKg: Record<GoalKey, number> = {
  lose: 2.0,
  maintain: 1.6,
  gain: 1.8,
};

export const activityKeys: ActivityKey[] = ['sedentary', 'light', 'moderate', 'active'];
export const goalKeys: GoalKey[] = ['lose', 'maintain', 'gain'];

export const genderKeys: Gender[] = ['male', 'female'];

export const PROFILE_LIMITS = {
  age: { min: 14, max: 90, default: 28 },
  heightCm: { min: 130, max: 220, default: 172 },
  weightKg: { min: 35, max: 200, default: 78 },
} as const;

export const DEFAULT_PROFILE: BodyProfile = {
  gender: 'male',
  age: PROFILE_LIMITS.age.default,
  heightCm: PROFILE_LIMITS.heightCm.default,
  weightKg: PROFILE_LIMITS.weightKg.default,
  activity: 'moderate',
  goal: 'maintain',
};

// Mifflin-St Jeor resting metabolic rate.
export const bmr = (p: BodyProfile): number =>
  10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.gender === 'male' ? 5 : -161);

export const tdee = (p: BodyProfile): number => bmr(p) * activityFactor[p.activity];

// Daily calorie + macro targets derived from the body profile.
export const dailyTargets = (p: BodyProfile): Macros => {
  const calories = Math.round(tdee(p) * goalFactor[p.goal]);
  const protein = Math.round(p.weightKg * proteinPerKg[p.goal]);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat };
};

// ── Pricing ─────────────────────────────────────────────────────────────────
// Every price in the app derives from macros: a fixed per-meal cost (prep,
// packaging, delivery) plus a per-gram rate for each macro. Protein dominates,
// which is what makes the "make it cheaper" levers on Subscribe meaningful.
export const BASE_MEAL_COST = 2600;
export const RATE_PROTEIN = 62;
export const RATE_CARBS = 9;
export const RATE_FAT = 20;
export const ADDON_HANDLING = 250;

export const macroCost = (m: Pick<Macros, 'protein' | 'carbs' | 'fat'>): number =>
  m.protein * RATE_PROTEIN + m.carbs * RATE_CARBS + m.fat * RATE_FAT;

export const mealPrice = (m: Pick<Macros, 'protein' | 'carbs' | 'fat'>): number =>
  Math.round(BASE_MEAL_COST + macroCost(m));

export const addOnPrice = (m: Pick<Macros, 'protein' | 'carbs' | 'fat'>): number =>
  Math.round(ADDON_HANDLING + macroCost(m));

// ── Meal customization ──────────────────────────────────────────────────────
export interface MacroDelta {
  protein: number;
  carbs: number;
  fat: number;
}

export const ZERO_DELTA: MacroDelta = { protein: 0, carbs: 0, fat: 0 };

export const macroSteps = { protein: 5, carbs: 10, fat: 5 } as const;

// How far each macro can move from the dish baseline, as a fraction of base.
// The upper bounds are portion scaling, not invention: a 2.5x rice portion is
// an ordinary meal-prep serving, so boxes can reach their daily carb targets.
const macroRange = {
  protein: { min: -0.5, max: 1.5 },
  carbs: { min: -0.8, max: 1.5 },
  fat: { min: -0.6, max: 1.2 },
} as const;

export type MacroKey = keyof MacroDelta;

export const macroKeys: MacroKey[] = ['protein', 'carbs', 'fat'];

export const deltaBounds = (base: Macros, key: MacroKey) => ({
  min: Math.round(base[key] * macroRange[key].min),
  max: Math.round(base[key] * macroRange[key].max),
});

export const clampDelta = (base: Macros, key: MacroKey, value: number): number => {
  const { min, max } = deltaBounds(base, key);
  return Math.min(max, Math.max(min, value));
};

export const kcalOf = (m: Pick<Macros, 'protein' | 'carbs' | 'fat'>): number =>
  Math.round(m.protein * 4 + m.carbs * 4 + m.fat * 9);

export const applyDelta = (base: Macros, delta: MacroDelta): Macros => {
  const protein = Math.max(0, base.protein + delta.protein);
  const carbs = Math.max(0, base.carbs + delta.carbs);
  const fat = Math.max(0, base.fat + delta.fat);
  return { protein, carbs, fat, calories: kcalOf({ protein, carbs, fat }) };
};

export const sumMacros = (list: Macros[]): Macros =>
  list.reduce<Macros>(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

export const scaleMacros = (m: Macros, factor: number): Macros => ({
  calories: Math.round(m.calories * factor),
  protein: Math.round(m.protein * factor),
  carbs: Math.round(m.carbs * factor),
  fat: Math.round(m.fat * factor),
});

// Spread a plan-wide macro target (e.g. "500g protein this week") evenly across
// every meal in the plan, clamped to what each dish can actually carry.
export const distributeTarget = (
  bases: Macros[],
  key: MacroKey,
  total: number,
): MacroDelta[] => {
  if (bases.length === 0) return [];
  const per = total / bases.length;
  return bases.map((base) => ({
    ...ZERO_DELTA,
    [key]: clampDelta(base, key, Math.round(per - base[key])),
  })) as MacroDelta[];
};

// What the plan actually delivers for `key` once clamping is accounted for.
export const achievableTotal = (bases: Macros[], key: MacroKey, total: number): number => {
  const deltas = distributeTarget(bases, key, total);
  return bases.reduce((sum, base, i) => sum + base[key] + deltas[i][key], 0);
};

export interface AddOn {
  id: string;
  icon: IconName;
  macros: Macros;
}

const addOn = (id: string, icon: IconName, protein: number, carbs: number, fat: number): AddOn => ({
  id,
  icon,
  macros: { protein, carbs, fat, calories: kcalOf({ protein, carbs, fat }) },
});

export const addOns: AddOn[] = [
  addOn('greens', 'leaf', 2, 6, 0),
  addOn('salad', 'bowl', 3, 10, 5),
  addOn('grilledVeg', 'skewer', 3, 14, 4),
  addOn('egg', 'egg', 6, 1, 5),
  addOn('chicken', 'drumstick', 25, 0, 3),
  addOn('fish', 'fish', 22, 0, 6),
  addOn('rice', 'rice', 4, 45, 1),
  addOn('bread', 'bread', 5, 32, 2),
  addOn('avocado', 'avocado', 2, 9, 15),
  addOn('nuts', 'nut', 6, 7, 15),
  addOn('yogurt', 'cup', 10, 8, 4),
  addOn('fruit', 'apple', 1, 25, 0),
];

export const getAddOn = (id: string): AddOn | undefined => addOns.find((a) => a.id === id);

export const addOnsMacros = (ids: string[]): Macros =>
  sumMacros(ids.map((id) => getAddOn(id)?.macros).filter((m): m is Macros => Boolean(m)));
