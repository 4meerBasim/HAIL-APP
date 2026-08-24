import type { IconName } from '../components/icons';

// A meal built from nothing, part by part, rather than picked off a list of
// finished plates. The kitchen assembles it to order, so what the customer is
// choosing here is what physically goes in the box.

export interface Ingredient {
  id: string;
  price: number;
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
      { id: 'base.white-rice', price: 2500 },
      { id: 'base.red-rice', price: 2500 },
      { id: 'base.biryani-rice', price: 3000 },
      { id: 'base.bulgur', price: 2500 },
      { id: 'base.samoon', price: 1000 },
    ],
  },
  {
    id: 'build.protein',
    icon: 'meat',
    required: true,
    items: [
      { id: 'protein.grilled-chicken', price: 6000 },
      { id: 'protein.chicken-shish', price: 6500 },
      { id: 'protein.kebab', price: 7500 },
      { id: 'protein.lamb-chunks', price: 8500 },
      { id: 'protein.fish', price: 7000 },
      { id: 'protein.falafel', price: 3000 },
    ],
  },
  {
    id: 'build.veg',
    icon: 'leaf',
    required: false,
    items: [
      { id: 'veg.green-salad', price: 1500 },
      { id: 'veg.tabbouleh', price: 2000 },
      { id: 'veg.fattoush', price: 2000 },
      { id: 'veg.grilled-veg', price: 2000 },
      { id: 'veg.pickles', price: 500 },
    ],
  },
  {
    id: 'build.sauce',
    icon: 'droplet',
    required: false,
    items: [
      { id: 'sauce.tahini', price: 750 },
      { id: 'sauce.garlic', price: 500 },
      { id: 'sauce.hot', price: 500 },
      { id: 'sauce.yoghurt', price: 750 },
    ],
  },
  {
    id: 'build.extra',
    icon: 'star',
    required: false,
    items: [
      { id: 'plus.cheese', price: 1000 },
      { id: 'plus.egg', price: 750 },
      { id: 'plus.nuts', price: 1250 },
      { id: 'plus.soup', price: 2000 },
    ],
  },
];

/** The id a built meal is carried under — a real dish, priced by its parts. */
export const BUILT_MEAL_ID = 'built-meal';

export const ingredientPrice = (id: string): number => {
  for (const group of ingredientGroups) {
    const item = group.items.find((i) => i.id === id);
    if (item) return item.price;
  }
  return 0;
};

/** Both required groups answered — anything less is a side, not a meal. */
export const isCompleteMeal = (picked: string[]): boolean =>
  ingredientGroups
    .filter((group) => group.required)
    .every((group) => group.items.some((item) => picked.includes(item.id)));
