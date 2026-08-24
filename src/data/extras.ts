import type { IconName } from '../components/icons';

// What a single meal can be built out of when it is ordered on its own. A meal
// arriving under a subscription is fixed — the kitchen batches those — so none
// of this applies there.
//
// Sweets and drinks are not here: those are real menu items with their own
// photographs and prices, counted rather than chosen.

export interface Priced {
  id: string;
  /** Dinars on top of the dish's own price. */
  price: number;
}

export interface Size extends Priced {
  /** Portions of the plate as it is normally served. */
  portion: number;
  /** How many people it covers — the same word the catering trays use. */
  serves: number;
}

// Prices land on the 250 step the rest of the app quotes in.
export const sizes: Size[] = [
  { id: 'size.regular', price: 0, portion: 1, serves: 1 },
  { id: 'size.large', price: 2500, portion: 1.5, serves: 1 },
  { id: 'size.double', price: 5000, portion: 2, serves: 2 },
];

export const defaultSize = sizes[0].id;

// An extra is a thing you add — rice, bread — and each comes in kinds. The
// kitchen does not serve "rice", it serves white rice or red rice, so the row
// opens onto the kinds rather than pretending the choice is not there.
export interface ExtraGroup {
  id: string;
  icon: IconName;
  options: Priced[];
}

export const extraGroups: ExtraGroup[] = [
  {
    id: 'extra.rice',
    icon: 'wheat',
    options: [
      { id: 'rice.white', price: 1500 },
      { id: 'rice.red', price: 1500 },
      { id: 'rice.biryani', price: 2000 },
    ],
  },
  {
    id: 'extra.bread',
    icon: 'wheat',
    options: [
      { id: 'bread.white', price: 500 },
      { id: 'bread.brown', price: 500 },
      { id: 'bread.samoon', price: 500 },
    ],
  },
  {
    id: 'extra.salad',
    icon: 'leaf',
    options: [
      { id: 'salad.green', price: 1500 },
      { id: 'salad.tabbouleh', price: 2000 },
      { id: 'salad.fattoush', price: 2000 },
    ],
  },
  {
    id: 'extra.cheese',
    icon: 'droplet',
    options: [
      { id: 'cheese.mozzarella', price: 1000 },
      { id: 'cheese.baladi', price: 1000 },
    ],
  },
  {
    id: 'extra.pickles',
    icon: 'avocado',
    options: [
      { id: 'pickles.mixed', price: 500 },
      { id: 'pickles.cucumber', price: 500 },
    ],
  },
  {
    id: 'extra.sauce',
    icon: 'flame',
    options: [
      { id: 'sauce.hot', price: 500 },
      { id: 'sauce.garlic', price: 500 },
      { id: 'sauce.tahini', price: 750 },
    ],
  },
];

export const groupOfOption = (optionId: string): ExtraGroup | undefined =>
  extraGroups.find((g) => g.options.some((o) => o.id === optionId));

export const priceOf = (id: string): number => {
  const size = sizes.find((s) => s.id === id);
  if (size) return size.price;
  for (const group of extraGroups) {
    const option = group.options.find((o) => o.id === id);
    if (option) return option.price;
  }
  return 0;
};
