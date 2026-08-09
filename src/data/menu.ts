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

// The three dishes the kitchen puts forward on Home when no category filter is on.
export const featuredIds: string[] = ['masgouf', 'quzi', 'jireesh'];

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
