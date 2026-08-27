import type { ImageSourcePropType } from 'react-native';
import type { IconName } from '../components/icons';
import type { Macros } from './menu';

// A meal built from nothing, part by part, rather than picked off a list of
// finished plates. The kitchen assembles it to order, so what the customer is
// choosing here is what physically goes in the box.

// The same stand-in the menu uses wherever a photograph has not been shot yet —
// cream field and girih medallion, so a card holding one still looks like the
// app rather than like a missing file. Swapping in a real shot is a change to
// that ingredient's `image` and nothing else.
const PLACEHOLDER: ImageSourcePropType = require('../../assets/placeholder-dish.jpg');

/** The step every quoted price in the app lands on. */
const PRICE_STEP = 250;

export interface Ingredient {
  id: string;
  price: number;
  image: ImageSourcePropType;
  /** What the kitchen puts in the box by default. `price` buys this much. */
  grams: number;
  /** How much one press of the grams control moves. */
  step: number;
  /** The customer sets the weight themselves. False for things that come as a
   *  piece — a samoon and an egg are one or none, not 140g. Those still carry
   *  a weight so they count toward the meal's nutrition. */
  byWeight: boolean;
  /** Nutrition per 100g, so any weight the customer picks can be costed out. */
  per100: Macros;
}

export interface IngredientGroup {
  id: string;
  icon: IconName;
  /** A plate needs one of these before it is a meal. */
  required: boolean;
  items: Ingredient[];
}

// Prices land on the 250 step the rest of the app quotes in.
export const ingredientGroups: IngredientGroup[] = [
  {
    id: 'build.base',
    icon: 'wheat',
    required: true,
    items: [
      { id: 'base.white-rice', price: 2500, grams: 300, step: 50, byWeight: true, per100: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 }, image: PLACEHOLDER },
      { id: 'base.red-rice', price: 2500, grams: 300, step: 50, byWeight: true, per100: { calories: 150, protein: 3, carbs: 30, fat: 2.5 }, image: PLACEHOLDER },
      { id: 'base.biryani-rice', price: 3000, grams: 300, step: 50, byWeight: true, per100: { calories: 180, protein: 4.5, carbs: 30, fat: 5 }, image: PLACEHOLDER },
      { id: 'base.bulgur', price: 2500, grams: 300, step: 50, byWeight: true, per100: { calories: 145, protein: 5, carbs: 31, fat: 0.4 }, image: PLACEHOLDER },
      { id: 'base.samoon', price: 1000, grams: 100, step: 100, byWeight: false, per100: { calories: 270, protein: 9, carbs: 51, fat: 3 }, image: PLACEHOLDER },
    ],
  },
  {
    id: 'build.protein',
    icon: 'meat',
    required: true,
    items: [
      { id: 'protein.grilled-chicken', price: 6000, grams: 200, step: 25, byWeight: true, per100: { calories: 165, protein: 31, carbs: 0, fat: 3.6 }, image: PLACEHOLDER },
      { id: 'protein.chicken-shish', price: 6500, grams: 200, step: 25, byWeight: true, per100: { calories: 175, protein: 29, carbs: 2, fat: 5.5 }, image: PLACEHOLDER },
      { id: 'protein.kebab', price: 7500, grams: 200, step: 25, byWeight: true, per100: { calories: 250, protein: 22, carbs: 3, fat: 17 }, image: PLACEHOLDER },
      { id: 'protein.lamb-chunks', price: 8500, grams: 200, step: 25, byWeight: true, per100: { calories: 260, protein: 25, carbs: 0, fat: 17 }, image: PLACEHOLDER },
      { id: 'protein.fish', price: 7000, grams: 200, step: 25, byWeight: true, per100: { calories: 150, protein: 26, carbs: 0, fat: 5 }, image: PLACEHOLDER },
      { id: 'protein.falafel', price: 3000, grams: 150, step: 25, byWeight: true, per100: { calories: 330, protein: 13, carbs: 32, fat: 18 }, image: PLACEHOLDER },
    ],
  },
  {
    id: 'build.veg',
    icon: 'leaf',
    required: false,
    items: [
      { id: 'veg.green-salad', price: 1500, grams: 150, step: 25, byWeight: true, per100: { calories: 35, protein: 1.5, carbs: 5, fat: 1 }, image: PLACEHOLDER },
      { id: 'veg.tabbouleh', price: 2000, grams: 150, step: 25, byWeight: true, per100: { calories: 120, protein: 3, carbs: 16, fat: 5 }, image: PLACEHOLDER },
      { id: 'veg.fattoush', price: 2000, grams: 150, step: 25, byWeight: true, per100: { calories: 110, protein: 2.5, carbs: 13, fat: 5.5 }, image: PLACEHOLDER },
      { id: 'veg.grilled-veg', price: 2000, grams: 150, step: 25, byWeight: true, per100: { calories: 90, protein: 2, carbs: 11, fat: 4.5 }, image: PLACEHOLDER },
      { id: 'veg.pickles', price: 500, grams: 80, step: 20, byWeight: true, per100: { calories: 20, protein: 1, carbs: 4, fat: 0.2 }, image: PLACEHOLDER },
    ],
  },
  {
    id: 'build.sauce',
    icon: 'droplet',
    required: false,
    items: [
      { id: 'sauce.tahini', price: 750, grams: 30, step: 10, byWeight: true, per100: { calories: 300, protein: 9, carbs: 12, fat: 26 }, image: PLACEHOLDER },
      { id: 'sauce.garlic', price: 500, grams: 30, step: 10, byWeight: true, per100: { calories: 320, protein: 2, carbs: 6, fat: 33 }, image: PLACEHOLDER },
      { id: 'sauce.hot', price: 500, grams: 30, step: 10, byWeight: true, per100: { calories: 90, protein: 1.5, carbs: 8, fat: 6 }, image: PLACEHOLDER },
      { id: 'sauce.yoghurt', price: 750, grams: 60, step: 20, byWeight: true, per100: { calories: 60, protein: 3.5, carbs: 4.5, fat: 3 }, image: PLACEHOLDER },
    ],
  },
  {
    id: 'build.extra',
    icon: 'star',
    required: false,
    items: [
      { id: 'plus.cheese', price: 1000, grams: 50, step: 25, byWeight: true, per100: { calories: 280, protein: 22, carbs: 2.2, fat: 21 }, image: PLACEHOLDER },
      { id: 'plus.egg', price: 750, grams: 55, step: 55, byWeight: false, per100: { calories: 155, protein: 13, carbs: 1.1, fat: 11 }, image: PLACEHOLDER },
      { id: 'plus.nuts', price: 1250, grams: 30, step: 10, byWeight: true, per100: { calories: 600, protein: 20, carbs: 21, fat: 54 }, image: PLACEHOLDER },
      { id: 'plus.soup', price: 2000, grams: 250, step: 50, byWeight: true, per100: { calories: 45, protein: 2, carbs: 6, fat: 1.5 }, image: PLACEHOLDER },
    ],
  },
];

/** The id a built meal is carried under — a real dish, priced by its parts. */
export const BUILT_MEAL_ID = 'built-meal';

export const ingredientOf = (id: string): Ingredient | undefined => {
  for (const group of ingredientGroups) {
    const item = group.items.find((i) => i.id === id);
    if (item) return item;
  }
  return undefined;
};

/** True when the customer sets this ingredient's weight themselves. */
export const isByWeight = (id: string): boolean => ingredientOf(id)?.byWeight ?? false;

/** The weight an ingredient starts at — what its listed price buys. */
export const gramsOf = (id: string): number => ingredientOf(id)?.grams ?? 0;

/** One step is the least the kitchen will weigh out; three plates the most. */
export const gramsRange = (id: string): { min: number; max: number; step: number } => {
  const item = ingredientOf(id);
  if (!item) return { min: 0, max: 0, step: 1 };
  return { min: item.step, max: item.grams * 3, step: item.step };
};

/**
 * What an ingredient costs at a given weight. The listed price buys the listed
 * grams, so the money moves with the food — then lands on the same 250 step
 * every other price in the app is quoted on, because a bill reading 4,733 د.ع
 * is not one the till can take.
 */
export const ingredientPriceAt = (id: string, grams?: number): number => {
  const item = ingredientOf(id);
  if (!item) return 0;
  if (grams === undefined || grams === item.grams) return item.price;

  const raw = (item.price * grams) / item.grams;
  const stepped = Math.round(raw / PRICE_STEP) * PRICE_STEP;
  // Anything the kitchen weighs out at all costs at least one step; rounding a
  // small sauce down to free would hand it away.
  return item.price > 0 ? Math.max(PRICE_STEP, stepped) : 0;
};

const ZERO: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** What an ingredient contributes to the meal at a given weight. */
export const ingredientMacrosAt = (id: string, grams?: number): Macros => {
  const item = ingredientOf(id);
  if (!item) return ZERO;
  const scale = (grams ?? item.grams) / 100;
  return {
    calories: item.per100.calories * scale,
    protein: item.per100.protein * scale,
    carbs: item.per100.carbs * scale,
    fat: item.per100.fat * scale,
  };
};

/** The whole box, summed — every part at the weight the customer set. */
export const mealMacros = (picked: string[], grams: Record<string, number>): Macros =>
  picked.reduce<Macros>(
    (total, id) => {
      const part = ingredientMacrosAt(id, grams[id]);
      return {
        calories: total.calories + part.calories,
        protein: total.protein + part.protein,
        carbs: total.carbs + part.carbs,
        fat: total.fat + part.fat,
      };
    },
    { ...ZERO },
  );

/** The meal's price — every part at the weight the customer set. */
export const mealPrice = (picked: string[], grams: Record<string, number>): number =>
  picked.reduce((sum, id) => sum + ingredientPriceAt(id, grams[id]), 0);

/**
 * Reads a cart line's build key (`id@grams+id@grams…`) back into the parts and
 * the weights it was ordered at, so a built meal already in the basket can be
 * shown again without storing it anywhere else.
 *
 * Parts come back in the order the box is packed in — base first — rather than
 * the sorted order the key holds them in, because the key is sorted to make two
 * identical meals collide, not to be read.
 */
export const parseBuildKey = (
  key: string,
): { picked: string[]; grams: Record<string, number> } => {
  const picked: string[] = [];
  const grams: Record<string, number> = {};

  for (const part of key.split('+')) {
    const [id, weight] = part.split('@');
    // An id the menu no longer carries is skipped rather than shown as a blank
    // line: the meal reads as what can still be cooked.
    if (!id || !ingredientOf(id) || picked.includes(id)) continue;
    picked.push(id);
    const n = Number(weight);
    if (Number.isFinite(n) && n > 0) grams[id] = n;
  }

  const packing = ingredientGroups.flatMap((g) => g.items.map((i) => i.id));
  picked.sort((a, b) => packing.indexOf(a) - packing.indexOf(b));
  return { picked, grams };
};

/** Both required groups answered — anything less is a side, not a meal. */
export const isCompleteMeal = (picked: string[]): boolean =>
  ingredientGroups
    .filter((group) => group.required)
    .every((group) => group.items.some((item) => picked.includes(item.id)));
