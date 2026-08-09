import type { ColorToken } from '../theme';
import type { IconName } from '../components/icons';

export type Category = 'h' | 'r';

export interface Dish {
  id: string;
  name: string;
  sub: string;
  price: string;
  cat: Category;
  pop: boolean;
  image: string;
}

const WIKI = 'https://commons.wikimedia.org/wiki/Special:FilePath/';
const img = (file: string): string => `${WIKI}${file}?width=600`;

export const dishes: Dish[] = [
  { id: 'masgouf', name: 'مسكوف شبوط بغدادي', sub: 'مشوي على الحطب · ٤٨٠ سعرة', price: '25,000', cat: 'h', pop: true, image: img('Masgouf.jpg') },
  { id: 'quzi', name: 'قوزي على تمن', sub: 'لحم غنم مع تمن بالزعفران', price: '18,000', cat: 'r', pop: true, image: img('Iraqi%20Quzi.jpg') },
  { id: 'dolma', name: 'دولمة عراقية', sub: 'ورق عنب وخضار محشية', price: '12,000', cat: 'r', pop: true, image: img('Iraqi%20Dolma-Mosul%2001.jpg') },
  { id: 'biryani', name: 'برياني عراقي', sub: 'مع دجاج ونثريات', price: '10,000', cat: 'r', pop: true, image: img('Hyderabadi%20Chicken%20Biryani.jpg') },
  { id: 'tashreeb', name: 'تشريب دجاج', sub: 'خبز تنور ومرق حمص', price: '9,000', cat: 'r', pop: true, image: img('Tashreeb.JPG') },
  { id: 'kubba', name: 'كبة الموصل', sub: 'محشية لحم وصنوبر', price: '8,000', cat: 'r', pop: false, image: img('Iraqi%20Kuba.jpg') },
  { id: 'bagilla', name: 'تمن وباقلاء', sub: 'بالشبنت ودهن حر · ٥٢٠ سعرة', price: '8,000', cat: 'h', pop: false, image: img('Rice%20and%20beans.jpg') },
  { id: 'bamia', name: 'مرق بامية بلحم الغنم', sub: 'مع تمن عنبر', price: '9,000', cat: 'r', pop: false, image: img('Bamia-Ocras%20tomate%20(cropped).JPG') },
  { id: 'jireesh', name: 'شوربة جريش', sub: 'حبوب قمح جريشة · ٢٤٠ سعرة', price: '5,000', cat: 'h', pop: true, image: img('Harees.JPG') },
  { id: 'shish', name: 'شيش طاووق صحي', sub: 'مع خضار مشوية · ٣٩٠ سعرة', price: '11,000', cat: 'h', pop: false, image: img('Iraqi%20Mixed%20Grill%20Platter%20with%20Traditional%20Accompaniments.jpg') },
  { id: 'salad', name: 'سلطة جرجير ورمان', sub: 'دبس رمان وجوز · ١٨٠ سعرة', price: '4,000', cat: 'h', pop: false, image: img('Fattoush%201.JPG') },
  { id: 'kleicha', name: 'كليجة بالتمر', sub: 'حلوى العيد · ٦ قطع', price: '3,000', cat: 'r', pop: false, image: img('Iraqi%20Dates%20Kleicha.jpg') },
];

export const heroImage = `${WIKI}Iraqi%20dinner%20spread.jpg?width=1200`;

export const getDish = (id: string): Dish | undefined => dishes.find((d) => d.id === id);

// ── Diet boxes ──────────────────────────────────────────────────────────────
// Curated, goal-based meal-plan boxes — the app's headline subscription product.
// Each box is a pre-composed rotation the user subscribes to and can then
// fine-tune in the plan builder. Accent tokens resolve against `colors` in theme.
// Macro figures are shown so customers can compare boxes; nothing edits them.
export type BoxGoal = 'balanced' | 'lean' | 'protein' | 'keto' | 'diabetic';

export interface DietBox {
  id: BoxGoal;
  icon: IconName;
  accent: ColorToken; // primary accent color token
  tint: ColorToken; // soft tint background token
  kcal: number; // daily calories, across the box's three meal times
  protein: number; // daily protein (g)
  carbs: number; // daily carbs (g)
  fat: number; // daily fat (g)
  perMeal: number; // headline subscription price for one meal of the box
  dishes: string[]; // dish ids that make up the box rotation
  image: string;
  popular?: boolean;
}

export const dietBoxes: DietBox[] = [
  {
    id: 'balanced',
    icon: 'bowl',
    accent: 'teal',
    tint: 'healthyBg',
    kcal: 1800,
    protein: 90,
    carbs: 247,
    fat: 50,
    perMeal: 6000,
    dishes: ['bagilla', 'jireesh', 'shish', 'salad', 'tashreeb', 'bamia'],
    image: img('Rice%20and%20beans.jpg'),
    popular: true,
  },
  {
    id: 'lean',
    icon: 'flame',
    accent: 'green',
    tint: 'greenBg',
    kcal: 1300,
    protein: 85,
    carbs: 159,
    fat: 36,
    perMeal: 5500,
    dishes: ['salad', 'jireesh', 'shish', 'bamia', 'bagilla'],
    image: img('Fattoush%201.JPG'),
    popular: true,
  },
  {
    id: 'protein',
    icon: 'dumbbell',
    accent: 'amber',
    tint: 'regularBg',
    kcal: 2200,
    protein: 150,
    carbs: 262,
    fat: 61,
    perMeal: 7500,
    dishes: ['shish', 'masgouf', 'tashreeb', 'quzi', 'kubba', 'biryani'],
    image: img('Iraqi%20Mixed%20Grill%20Platter%20with%20Traditional%20Accompaniments.jpg'),
  },
  {
    id: 'keto',
    icon: 'avocado',
    accent: 'violet',
    tint: 'violetBg',
    kcal: 1600,
    protein: 110,
    carbs: 30,
    fat: 116,
    perMeal: 8000,
    dishes: ['shish', 'masgouf', 'kubba', 'bamia'],
    image: img('Masgouf.jpg'),
  },
  {
    id: 'diabetic',
    icon: 'stethoscope',
    accent: 'tealText',
    tint: 'healthyBg',
    kcal: 1700,
    protein: 95,
    carbs: 224,
    fat: 47,
    perMeal: 6000,
    dishes: ['jireesh', 'bagilla', 'salad', 'bamia', 'shish'],
    image: img('Harees.JPG'),
  },
];

export const getBox = (id: string): DietBox | undefined => dietBoxes.find((b) => b.id === id);

// A box's advertised daily macros as a plain Macros value (display only).
export const boxDaily = (box: DietBox): Macros => ({
  calories: box.kcal,
  protein: box.protein,
  carbs: box.carbs,
  fat: box.fat,
});

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Per-dish nutrition shown on the dish-detail macros row.
export const macros: Record<string, Macros> = {
  masgouf: { calories: 480, protein: 42, carbs: 18, fat: 22 },
  quzi: { calories: 820, protein: 45, carbs: 78, fat: 34 },
  dolma: { calories: 560, protein: 16, carbs: 62, fat: 28 },
  biryani: { calories: 720, protein: 38, carbs: 82, fat: 26 },
  tashreeb: { calories: 650, protein: 40, carbs: 66, fat: 24 },
  kubba: { calories: 480, protein: 22, carbs: 46, fat: 24 },
  bagilla: { calories: 520, protein: 18, carbs: 74, fat: 16 },
  bamia: { calories: 430, protein: 28, carbs: 34, fat: 20 },
  jireesh: { calories: 240, protein: 14, carbs: 32, fat: 6 },
  shish: { calories: 390, protein: 46, carbs: 12, fat: 16 },
  salad: { calories: 180, protein: 5, carbs: 16, fat: 11 },
  kleicha: { calories: 360, protein: 5, carbs: 58, fat: 13 },
};

// Per-dish ingredient chips, referenced by i18n key (detail.ing.*).
export const ingredientKeys: Record<string, string[]> = {
  masgouf: [
    'detail.ing.carp',
    'detail.ing.molasses',
    'detail.ing.tomatoOnion',
    'detail.ing.spices',
    'detail.ing.bread',
  ],
  quzi: [
    'detail.ing.lamb',
    'detail.ing.rice',
    'detail.ing.saffron',
    'detail.ing.pineNuts',
    'detail.ing.spices',
  ],
  dolma: [
    'detail.ing.vineLeaves',
    'detail.ing.rice',
    'detail.ing.tomatoOnion',
    'detail.ing.molasses',
    'detail.ing.spices',
  ],
  biryani: [
    'detail.ing.rice',
    'detail.ing.chicken',
    'detail.ing.saffron',
    'detail.ing.pineNuts',
    'detail.ing.spices',
  ],
  tashreeb: [
    'detail.ing.chicken',
    'detail.ing.bread',
    'detail.ing.chickpeas',
    'detail.ing.tomatoOnion',
    'detail.ing.spices',
  ],
  kubba: [
    'detail.ing.bulgur',
    'detail.ing.lamb',
    'detail.ing.pineNuts',
    'detail.ing.spices',
  ],
  bagilla: [
    'detail.ing.rice',
    'detail.ing.broadBeans',
    'detail.ing.dill',
    'detail.ing.ghee',
  ],
  bamia: [
    'detail.ing.okra',
    'detail.ing.lamb',
    'detail.ing.tomatoOnion',
    'detail.ing.rice',
    'detail.ing.spices',
  ],
  jireesh: [
    'detail.ing.crackedWheat',
    'detail.ing.chicken',
    'detail.ing.ghee',
    'detail.ing.spices',
  ],
  shish: [
    'detail.ing.chicken',
    'detail.ing.yogurt',
    'detail.ing.garlic',
    'detail.ing.spices',
  ],
  salad: [
    'detail.ing.arugula',
    'detail.ing.pomegranate',
    'detail.ing.walnuts',
    'detail.ing.molasses',
  ],
  kleicha: [
    'detail.ing.dates',
    'detail.ing.flour',
    'detail.ing.cardamom',
    'detail.ing.ghee',
  ],
};

export const formatPrice = (price: string, lang: 'ar' | 'en'): string =>
  lang === 'ar' ? `${price} د.ع` : `IQD ${price}`;

// Money is always Western digits grouped with commas (design + BUILD-SPEC digit rules).
export const groupNumber = (n: number): string => Math.round(n).toLocaleString('en-US');

// Parse a grouped price string ("25,000") back to a number, tolerant of any suffix.
export const parsePrice = (price: string): number => {
  const n = parseInt(price.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
};

// The bare currency mark for the active language ('د.ع' / 'IQD'), reusing formatPrice.
export const currencyMark = (lang: 'ar' | 'en'): string => formatPrice('', lang).trim();

// ── Subscription pricing ────────────────────────────────────────────────────
// One meal on a subscription costs BASE_PER_MEAL when the rotation sits on the
// menu average; a box overrides that with its own headline rate. Swapping in
// pricier or cheaper dishes moves the rate through `basketIndex`, so the number
// always tracks what the customer actually chose.
export const BASE_PER_MEAL = 6000;

export const menuAveragePrice =
  dishes.reduce((sum, d) => sum + parsePrice(d.price), 0) / dishes.length;

// A basket's à-la-carte average as a multiple of the menu average. Empty = 1.
export const basketIndex = (dishIds: string[]): number => {
  if (dishIds.length === 0) return 1;
  const total = dishIds.reduce((sum, id) => sum + parsePrice(getDish(id)?.price ?? '0'), 0);
  return total / dishIds.length / menuAveragePrice;
};

// Duration is always a raw number of days; the presets are just shortcuts and
// the discount is a pure function of that number, so a custom 23-day plan is
// priced on exactly the same curve as the "month" preset.
export interface DurationPreset {
  key: 'week' | 'twoWeeks' | 'month';
  days: number;
}

export const durationPresets: DurationPreset[] = [
  { key: 'week', days: 7 },
  { key: 'twoWeeks', days: 14 },
  { key: 'month', days: 30 },
];

export const MIN_DAYS = 3;
export const MAX_DAYS = 90;
export const DEFAULT_DAY_COUNT = 30;

const discountTiers: { minDays: number; disc: number }[] = [
  { minDays: 90, disc: 0.22 },
  { minDays: 30, disc: 0.18 },
  { minDays: 14, disc: 0.1 },
  { minDays: 7, disc: 0.05 },
  { minDays: 0, disc: 0 },
];

export const MAX_DISCOUNT = discountTiers[0].disc;

export const discountForDays = (days: number): number =>
  discountTiers.find((t) => days >= t.minDays)?.disc ?? 0;

// The shortest span that would earn a bigger discount than `days`, for the
// "commit longer" saver. Returns `days` unchanged once the top tier is reached.
export const nextDiscountDays = (days: number): number =>
  [...discountTiers]
    .map((t) => t.minDays)
    .reverse()
    .find((m) => m > days) ?? days;

// i18n keys for the 7 weekday short labels, in Sat-to-Fri order.
export const dayKeys = [
  'day.sat',
  'day.sun',
  'day.mon',
  'day.tue',
  'day.wed',
  'day.thu',
  'day.fri',
] as const;

export const DEFAULT_DAYS: number[] = [0, 1, 2, 3, 4];

// i18n keys for the 3 meal times, in breakfast-to-dinner order. How many the
// customer picks IS the meals-per-day count.
export const timeKeys = ['time.breakfast', 'time.lunch', 'time.dinner'] as const;

export const timeIcons: IconName[] = ['sun', 'utensils', 'moon'];

export const DEFAULT_TIMES: number[] = [1, 2];

export const ALL_TIMES: number[] = timeKeys.map((_, i) => i);

export type TrackingStatus = 'preparing' | 'ontheway' | 'delivered';

export const trackingStepIndex: Record<TrackingStatus, number> = {
  preparing: 0,
  ontheway: 1,
  delivered: 2,
};

export const trackingSteps: string[] = ['قيد التحضير', 'في الطريق', 'تم التوصيل'];

export const trackingHeadlines: Record<TrackingStatus, string> = {
  preparing: 'مطبخنا يحضّر طلبك',
  ontheway: 'كرار في الطريق إليك',
  delivered: 'وصل طلبك — بالعافية!',
};

export const DEFAULT_TRACKING: TrackingStatus = 'ontheway';

export const trackingOrder = {
  number: '٤٨٢١',
  meal: 'وجبة الغداء',
  minutes: '١٨',
} as const;

export const trackingDriver = {
  name: 'كرار محمد',
  role: 'سائق جريش · دراجة كهربائية',
} as const;

// ── Schedule exceptions ─────────────────────────────────────────────────────
// A subscription runs on its selected weekdays, minus any one-off dates the
// customer skips, plus any deliveries they've pushed to a later date.
export type ExceptionKind = 'skip' | 'postpone';

export interface ScheduleException {
  id: string;
  kind: ExceptionKind;
  dayIndex: number; // day offset from plan start
  movedTo?: number; // for 'postpone', the day offset it was moved to
}

export const MAX_POSTPONE_DAYS = 7;

// Levers offered at checkout to bring the price down. All four are measured
// against the weekly cost, the one number every lever moves in the same
// direction: committing longer adds days but unlocks a bigger discount.
export type SaverKey = 'fewerMeals' | 'fewerDays' | 'swapCheaper' | 'longerTerm';

export const saverKeys: SaverKey[] = ['fewerMeals', 'fewerDays', 'swapCheaper', 'longerTerm'];

// ── Order history ───────────────────────────────────────────────────────────
// One order is in flight (it opens Tracking); the rest are delivered receipts a
// customer can reorder from. Lines reference dish ids so names, images and
// prices always come from `dishes` — an order never carries its own copy.
export type OrderStatus = 'active' | 'delivered';

export interface OrderLine {
  dishId: string;
  qty: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  whenKey: string; // i18n key for the relative date shown on the receipt
  lines: OrderLine[];
}

export const orders: Order[] = [
  {
    id: '4821',
    status: 'active',
    whenKey: 'orders.when.today',
    lines: [
      { dishId: 'masgouf', qty: 1 },
      { dishId: 'salad', qty: 1 },
    ],
  },
  {
    id: '4802',
    status: 'delivered',
    whenKey: 'orders.when.lastThu',
    lines: [
      { dishId: 'dolma', qty: 1 },
      { dishId: 'kleicha', qty: 1 },
    ],
  },
  {
    id: '4771',
    status: 'delivered',
    whenKey: 'orders.when.lastFri',
    lines: [{ dishId: 'quzi', qty: 2 }],
  },
  {
    id: '4736',
    status: 'delivered',
    whenKey: 'orders.when.lastWeek',
    lines: [
      { dishId: 'tashreeb', qty: 1 },
      { dishId: 'bagilla', qty: 1 },
      { dishId: 'jireesh', qty: 1 },
    ],
  },
];

export const orderTotal = (order: Order): number =>
  order.lines.reduce((sum, line) => {
    const dish = getDish(line.dishId);
    return dish ? sum + parsePrice(dish.price) * line.qty : sum;
  }, 0);

export const orderItemCount = (order: Order): number =>
  order.lines.reduce((sum, line) => sum + line.qty, 0);
