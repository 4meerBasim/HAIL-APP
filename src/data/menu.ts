import type { ImageSourcePropType } from 'react-native';
import type { ColorToken } from '../theme';
import type { IconName } from '../components/icons';

export type Category = 'h' | 'r';

// What part of the meal a dish is, mirroring how the restaurant's own menu is
// sectioned. `cat` above is the diet split (healthy / regular) and answers a
// different question, so the two filter independently.
export type Course = 'main' | 'starter' | 'side' | 'dessert' | 'drink' | 'built';

export const courseKeys: Course[] = ['main', 'starter', 'side', 'dessert', 'drink'];

export interface Dish {
  id: string;
  name: string;
  sub: string;
  price: string;
  cat: Category;
  course: Course;
  pop: boolean;
  image: ImageSourcePropType;
}

// Catering photos came off the restaurant's live menu (SUPPORT_SITE) and
// are now bundled: every image in the app ships with it, so nothing on screen
// waits on a network that a customer in a lift does not have.

// The 21 offers exactly as the restaurant prints them on its own offer sheets:
// their wording, their component lists, their IQD prices, and the photograph
// from each sheet cropped out and bundled — so a card sells the plate it is
// actually a picture of. `name` is the headline dish and `sub` is the rest of
// what comes in the box, which is how the sheet itself splits the line.
//
// Two spellings are corrected against the print: بركر → برغر and
// "اللحمة الفرومة" → "اللحم المفروم". Everything else is verbatim.
const OFFER_PHOTOS: ImageSourcePropType[] = [
  require('../../assets/offers/offer-01.jpg'),
  require('../../assets/offers/offer-02.jpg'),
  require('../../assets/offers/offer-03.jpg'),
  require('../../assets/offers/offer-04.jpg'),
  require('../../assets/offers/offer-05.jpg'),
  require('../../assets/offers/offer-06.jpg'),
  require('../../assets/offers/offer-07.jpg'),
  require('../../assets/offers/offer-08.jpg'),
  require('../../assets/offers/offer-09.jpg'),
  require('../../assets/offers/offer-10.jpg'),
  require('../../assets/offers/offer-11.jpg'),
  require('../../assets/offers/offer-12.jpg'),
  require('../../assets/offers/offer-13.jpg'),
  require('../../assets/offers/offer-14.jpg'),
  require('../../assets/offers/offer-15.jpg'),
  require('../../assets/offers/offer-16.jpg'),
  require('../../assets/offers/offer-17.jpg'),
  require('../../assets/offers/offer-18.jpg'),
  require('../../assets/offers/offer-19.jpg'),
  require('../../assets/offers/offer-20.jpg'),
  require('../../assets/offers/offer-21.jpg'),
];

// Sheet numbers are 1-based, so offers read the way they are printed.
const offer = (n: number): ImageSourcePropType => OFFER_PHOTOS[n - 1];

// Stands in wherever a real photograph has not been shot yet: the cream field
// and the girih medallion the rest of the app is built from, so a card holding
// one still looks like the app rather than like a missing file.
const PLACEHOLDER: ImageSourcePropType = require('../../assets/placeholder-dish.jpg');

export const dishes: Dish[] = [
  { id: 'pasta', name: 'باستا بني فورنو', sub: 'خضار سوتيه + نوع مقبلات + مشروب غازي', price: '7,500', cat: 'r', course: 'main', pop: false, image: offer(1) },
  { id: 'biryani', name: 'رز برياني مع فخذ دجاج', sub: 'نوعان مرق + طرشي + خبز + لبن', price: '11,000', cat: 'r', course: 'main', pop: true, image: offer(2) },
  { id: 'chicken-steak', name: 'ستيك دجاج بالمشروم', sub: 'تمن أبيض 300 غم + نوع مقبلات + خضار سوتيه + عصير طبيعي', price: '10,000', cat: 'h', course: 'main', pop: false, image: offer(3) },
  { id: 'burger', name: 'سندويش برغر', sub: 'بطاطا مقلية + نوع مقبلات + مشروب غازي', price: '7,500', cat: 'r', course: 'main', pop: false, image: offer(4) },
  { id: 'dolma', name: 'طبق دولمة لشخصين', sub: 'طرشي وخضار + خبز + لبن', price: '6,000', cat: 'h', course: 'main', pop: true, image: offer(5) },
  { id: 'fajita', name: 'ملفوف باذنجان وفاهيتا دجاج', sub: 'خبز + عصير طبيعي', price: '12,000', cat: 'r', course: 'main', pop: false, image: offer(6) },
  { id: 'noodles', name: 'طبق نودلز', sub: 'خضار سوتيه', price: '5,000', cat: 'h', course: 'main', pop: false, image: offer(7) },
  { id: 'fish', name: 'قطعة سمك', sub: 'تمن أحمر 400 غم + طرشي وخضار + خبز + لبن', price: '10,000', cat: 'h', course: 'main', pop: false, image: offer(8) },
  { id: 'maqluba-chicken', name: 'مقلوبة دجاج', sub: 'طرشي + خضار + خبز + لبن', price: '7,500', cat: 'r', course: 'main', pop: true, image: offer(9) },
  { id: 'mahshi', name: 'ملفوف باذنجان', sub: 'تمن أبيض 400 غم + طرشي وخضار + خبز + لبن', price: '7,500', cat: 'r', course: 'main', pop: false, image: offer(10) },
  { id: 'chicken-fillet', name: 'شرحات دجاج مطفاية', sub: 'تمن أبيض 300 غم + نوع مقبلات + خضار سوتيه + عصير طبيعي', price: '10,000', cat: 'h', course: 'main', pop: false, image: offer(11) },
  { id: 'lasagna', name: 'لزانيا لحم', sub: 'نوع مقبلات', price: '7,000', cat: 'r', course: 'main', pop: false, image: offer(12) },
  { id: 'rice-stews', name: 'تمن أبيض ونوعان مرق', sub: 'تمن 400 غم + طرشي وخضار + خبز + لبن', price: '5,000', cat: 'r', course: 'main', pop: false, image: offer(13) },
  { id: 'tashreeb', name: 'تشريب دجاج', sub: 'تمن باقلاء 400 غم + طرشي وخضار + خبز + لبن', price: '8,500', cat: 'r', course: 'main', pop: true, image: offer(14) },
  { id: 'half-chicken', name: 'طبق دجاج — نصف دجاجة', sub: 'تمن 600 غم + نوعان مرق + طرشي وخضار + خبز + نوعان لبن', price: '13,000', cat: 'r', course: 'main', pop: true, image: offer(15) },
  { id: 'maqluba-lamb', name: 'مقلوبة لحم', sub: 'طرشي وخضار + خبز + لبن', price: '7,500', cat: 'r', course: 'main', pop: false, image: offer(16) },
  { id: 'qalya', name: 'قلية عراقية', sub: 'تمن أبيض 400 غم + طرشي وخضار + خبز + لبن', price: '8,000', cat: 'r', course: 'main', pop: false, image: offer(17) },
  { id: 'quzi', name: 'قوزي لحم', sub: 'قطعة لحم 250 غم + تمن أبيض 400 غم + نوعان مرق + طرشي وخضار + خبز + لبن', price: '15,000', cat: 'r', course: 'main', pop: true, image: offer(18) },
  { id: 'liver', name: 'طبق كبدة', sub: 'نوع مقبلات + طرشي وخضار + خبز + عصير طبيعي', price: '8,500', cat: 'r', course: 'main', pop: false, image: offer(19) },
  { id: 'carrot-rice', name: 'تمن جزر باللحم المفروم', sub: 'تمن 400 غم + نوع مرق + طرشي وخضار + خبز + لبن', price: '6,000', cat: 'r', course: 'main', pop: false, image: offer(20) },
  { id: 'meatballs', name: 'مرق كرات لحم وبطاطا', sub: 'رز أبيض + طرشي + خبز + لبن', price: '7,500', cat: 'r', course: 'main', pop: false, image: offer(21) },

  // Sweets and drinks, ordered alongside a meal rather than instead of one.
  // Their photographs are not on the restaurant's public menu, so they carry
  // the placeholder plate until the real shots are exported: swapping one is a
  // change to its `image` and nothing else.
  { id: 'kunafa', name: 'كنافة بالقشطة', sub: 'قشطة + فستق + قطر', price: '4,000', cat: 'r', course: 'dessert', pop: true, image: PLACEHOLDER },
  { id: 'zalabia', name: 'زلابية', sub: 'عجين مقلي + قطر', price: '3,000', cat: 'r', course: 'dessert', pop: false, image: PLACEHOLDER },
  { id: 'mahalabia', name: 'مهلبية بالفستق', sub: 'حليب + ماء ورد + فستق', price: '3,500', cat: 'h', course: 'dessert', pop: false, image: PLACEHOLDER },
  { id: 'baklava', name: 'بقلاوة', sub: 'جوز + قطر', price: '4,500', cat: 'r', course: 'dessert', pop: false, image: PLACEHOLDER },

  { id: 'juice-orange', name: 'عصير برتقال طازج', sub: 'برتقال معصور عند الطلب', price: '2,500', cat: 'h', course: 'drink', pop: true, image: PLACEHOLDER },
  { id: 'juice-lemon-mint', name: 'ليمون بالنعناع', sub: 'ليمون + نعناع طازج', price: '2,500', cat: 'h', course: 'drink', pop: false, image: PLACEHOLDER },
  { id: 'juice-pomegranate', name: 'عصير رمان', sub: 'رمان معصور عند الطلب', price: '3,000', cat: 'h', course: 'drink', pop: false, image: PLACEHOLDER },
  { id: 'soft-drink', name: 'مشروب غازي', sub: 'علبة 330 مل', price: '1,000', cat: 'r', course: 'drink', pop: false, image: PLACEHOLDER },
  { id: 'water', name: 'ماء', sub: 'قنينة 500 مل', price: '500', cat: 'h', course: 'drink', pop: false, image: PLACEHOLDER },

  // Assembled to order on the build tab. It has no price of its own — the
  // parts carry it — and it is filtered out of every list by its course.
  { id: 'built-meal', name: 'وجبة من اختيارك', sub: 'مكوّنات مختارة', price: '0', cat: 'h', course: 'built', pop: false, image: PLACEHOLDER },
];

/** A handful of real dishes to cycle through a search hint. */
export const searchHints = (): Dish[] => dishes.filter((d) => d.course === 'main' && d.pop);

/** Every sweet and every drink, in the order the kitchen lists them. */
export const dishesOfCourse = (course: Course): Dish[] =>
  dishes.filter((d) => d.course === course);

export const heroImage = offer(18);

// The offer sheets list what is in the box as a run of "+" separated parts.
// That list is the ingredient chips on the detail screen — no parallel table to
// keep in step with the menu, and it translates with the rest of the copy.
export const dishParts = (sub: string): string[] =>
  sub
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);

export const getDish = (id: string): Dish | undefined => dishes.find((d) => d.id === id);

// Courses the menu actually carries. Every offer sheet sells a complete meal, so
// today this is a single entry — and a filter row of four tabs where three are
// permanently empty is worse than no filter row at all. Screens check the length
// before drawing one, which also means the row comes back on its own the day the
// menu grows a starter or a dessert.
export const menuCourses: Course[] = courseKeys.filter((c) => dishes.some((d) => d.course === c));

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
  dishes: string[]; // dish ids that make up the box rotation — what a
  // subscription on it costs is derived from these by `priceOf`, never stored
  image: ImageSourcePropType;
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
    dishes: ['rice-stews', 'tashreeb', 'maqluba-chicken', 'biryani', 'carrot-rice', 'dolma'],
    image: offer(13),
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
    dishes: ['noodles', 'chicken-steak', 'fish', 'chicken-fillet', 'dolma'],
    image: offer(7),
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
    dishes: ['half-chicken', 'quzi', 'chicken-steak', 'liver', 'maqluba-lamb', 'biryani'],
    image: offer(15),
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
    dishes: ['fish', 'chicken-steak', 'chicken-fillet', 'liver'],
    image: offer(8),
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
    dishes: ['chicken-fillet', 'fish', 'noodles', 'dolma', 'chicken-steak'],
    image: offer(11),
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

// Per-offer nutrition shown on the dish-detail macros row. These count the
// whole box the sheet sells — rice, stew, pickles, bread and the drink — not
// the headline plate on its own, which is why every figure reads as a full meal.
export const macros: Record<string, Macros> = {
  pasta: { calories: 1080, protein: 44, carbs: 128, fat: 40 },
  biryani: { calories: 1240, protein: 58, carbs: 152, fat: 42 },
  'chicken-steak': { calories: 980, protein: 56, carbs: 108, fat: 32 },
  burger: { calories: 1150, protein: 42, carbs: 130, fat: 50 },
  dolma: { calories: 860, protein: 26, carbs: 104, fat: 36 },
  fajita: { calories: 1120, protein: 52, carbs: 118, fat: 44 },
  noodles: { calories: 620, protein: 20, carbs: 88, fat: 20 },
  fish: { calories: 1040, protein: 54, carbs: 122, fat: 32 },
  'maqluba-chicken': { calories: 990, protein: 46, carbs: 118, fat: 34 },
  mahshi: { calories: 950, protein: 34, carbs: 126, fat: 32 },
  'chicken-fillet': { calories: 940, protein: 55, carbs: 104, fat: 30 },
  lasagna: { calories: 880, protein: 40, carbs: 82, fat: 42 },
  'rice-stews': { calories: 880, protein: 28, carbs: 130, fat: 26 },
  tashreeb: { calories: 1060, protein: 48, carbs: 132, fat: 34 },
  'half-chicken': { calories: 1420, protein: 72, carbs: 168, fat: 48 },
  'maqluba-lamb': { calories: 1080, protein: 48, carbs: 120, fat: 44 },
  qalya: { calories: 1010, protein: 46, carbs: 122, fat: 36 },
  quzi: { calories: 1320, protein: 62, carbs: 146, fat: 52 },
  liver: { calories: 940, protein: 50, carbs: 96, fat: 36 },
  'carrot-rice': { calories: 960, protein: 38, carbs: 124, fat: 32 },
  meatballs: { calories: 1010, protein: 42, carbs: 124, fat: 36 },
};

// ── Event catering ──────────────────────────────────────────────────────────
// Party trays as the restaurant actually sells them: same four صواني, same
// prices, same photos. `serves` is how many guests one tray covers, which is
// what turns a headcount into a suggested order.
export type OccasionKey = 'wake' | 'wedding' | 'graduation' | 'corporate';

export const occasionKeys: OccasionKey[] = ['wake', 'wedding', 'graduation', 'corporate'];

export interface CateringTray {
  id: string;
  price: number;
  serves: number;
  image: ImageSourcePropType;
}

export const cateringTrays: CateringTray[] = [
  { id: 'chicken', price: 24000, serves: 4, image: require('../../assets/catering/chicken.jpg') },
  { id: 'ribs', price: 45000, serves: 6, image: require('../../assets/catering/ribs.jpg') },
  { id: 'shoulder', price: 45000, serves: 6, image: require('../../assets/catering/shoulder.jpg') },
  { id: 'mixed', price: 55000, serves: 8, image: require('../../assets/catering/mixed.jpg') },
];

export const cateringHero: ImageSourcePropType = require('../../assets/catering/hero.jpg');

export const MIN_GUESTS = 10;
export const MAX_GUESTS = 500;
export const GUEST_STEP = 10;

export const getTray = (id: string): CateringTray | undefined =>
  cateringTrays.find((tr) => tr.id === id);

// Fills the headcount from the largest tray down, so a suggestion is a couple of
// big trays rather than a dozen small ones.
export const suggestTrays = (guests: number): Record<string, number> => {
  const out: Record<string, number> = {};
  let left = guests;
  const bySize = [...cateringTrays].sort((a, b) => b.serves - a.serves);
  for (const tray of bySize) {
    if (left <= 0) break;
    const isSmallest = tray === bySize[bySize.length - 1];
    const n = isSmallest ? Math.ceil(left / tray.serves) : Math.floor(left / tray.serves);
    if (n > 0) {
      out[tray.id] = n;
      left -= n * tray.serves;
    }
  }
  return out;
};

// ── Support contact ─────────────────────────────────────────────────────────
// The website is the restaurant's live menu host and is verified. The phone
// line is a PLACEHOLDER — swap both numbers for the real support line before
// release, or the call and WhatsApp rows dial nowhere. E.164, no spaces, so
// `tel:` and `wa.me` can both take them as-is.
export const SUPPORT_PHONE = '+9647700000000';
export const SUPPORT_WHATSAPP = '9647700000000';
export const SUPPORT_SITE = 'https://menu.jareesh.com';

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

// ── Money ───────────────────────────────────────────────────────────────────
// Every figure the app works out for itself — a subscription rate, a plan
// total, a saving — lands on a 250 dinar step. Nobody quotes 6,293 for a meal:
// a price that looks calculated rather than set reads as a mistake even when
// the arithmetic behind it is right. The menu's own prices are already round,
// so this only ever bites on derived numbers.
export const MONEY_STEP = 250;

export const roundMoney = (amount: number): number =>
  Math.max(0, Math.round(amount / MONEY_STEP) * MONEY_STEP);

// ── Subscription pricing ────────────────────────────────────────────────────
// One rule, applied to every dish and every box: a meal on a subscription is
// its à-la-carte price less this, with the duration discount on top of that.
// The rate used to be anchored to a per-box headline number divided by a basket
// index, which meant a box could advertise 7,500 a meal while the meals listed
// inside it added up to something else entirely. Deriving both from the same
// per-dish figure is what makes the total under the button equal the meals
// above it, and it is a rule you can say out loud to a customer.
export const SUBSCRIPTION_SAVING = 0.15;

export const subscriptionPrice = (dishId: string): number =>
  roundMoney(parsePrice(getDish(dishId)?.price ?? '0') * (1 - SUBSCRIPTION_SAVING));

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

// Three tiers, topping out at 15%. A month is the longest commitment that is
// worth paying for — beyond it the customer earns nothing extra, so 90 days is
// no longer its own tier and falls into the 30-day one.
const discountTiers: { minDays: number; disc: number }[] = [
  { minDays: 30, disc: 0.15 },
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

// i18n keys for the 7 weekday short labels, in Sun-to-Sat order — the week as
// it is read here, and the same order JS getDay() numbers it in.
export const dayKeys = [
  'day.sun',
  'day.mon',
  'day.tue',
  'day.wed',
  'day.thu',
  'day.fri',
  'day.sat',
] as const;

export const DEFAULT_DAYS: number[] = [0, 1, 2, 3, 4];

// A slot is one eating occasion in the daily rotation. The three built-ins carry
// an i18n key; anything the customer adds carries a literal `name` they typed,
// so it is shown verbatim in whatever language they wrote it in.
//
// `time` is when that meal should arrive, as minutes from midnight. A number
// rather than a string so slots sort by it and the picker can step it without
// parsing; the clock face is built back at render time by `formatTime`.
export interface MealSlot {
  id: string;
  labelKey?: string;
  name?: string;
  icon: IconName;
  time: number;
}

/** Minutes from midnight, for a slot with no time of its own yet. */
export const DEFAULT_SLOT_TIME = 12 * 60;

export const builtInSlots: MealSlot[] = [
  { id: 'breakfast', labelKey: 'time.breakfast', icon: 'sun', time: 8 * 60 },
  { id: 'lunch', labelKey: 'time.lunch', icon: 'utensils', time: 13 * 60 },
  { id: 'dinner', labelKey: 'time.dinner', icon: 'moon', time: 20 * 60 },
];

export const CUSTOM_SLOT_ICON: IconName = 'clock';
export const MAX_SLOTS = 6;

export const slotLabel = (slot: MealSlot, t: (k: string, f?: string) => string): string =>
  slot.name ?? (slot.labelKey ? t(slot.labelKey) : slot.id);

/**
 * A slot's delivery time on a 12-hour face — "8:00 ص". Western digits in both
 * languages, like every other number in the app (see `digits.ts`); only the
 * period marker is translated.
 *
 * Clamped and wrapped rather than trusted: `time` comes back out of storage,
 * where an older build or a hand-edited plan can leave anything.
 */
export const formatTime = (minutes: number, t: (k: string, f?: string) => string): string => {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hour24 = Math.floor(total / 60);
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minute = String(total % 60).padStart(2, '0');
  return `${hour}:${minute} ${t(hour24 < 12 ? 'time.am' : 'time.pm')}`;
};

// A plan opens with one meal time. The customer adds the rest — a second
// delivery a day is a real cost, so it is chosen rather than assumed.
export const defaultSlots = (): MealSlot[] => [{ ...builtInSlots[0] }];

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
  number: '4821',
  meal: 'وجبة الغداء',
  minutes: '18',
} as const;

// Demo geography for the live-tracking map, Karrada to Jadriyah in Baghdad.
// Fixed waypoints rather than a routing service: the tracked order is sample
// data, and a real route would need a directions API and a key for a screen
// that is not yet wired to a backend. Swap `trackingRoute` for the polyline
// from that API when one exists — nothing else on the screen has to change.
export const trackingRestaurant = { lat: 33.3062, lng: 44.4152 } as const;
export const trackingDestination = { lat: 33.2794, lng: 44.3872 } as const;

export const trackingRoute: [number, number][] = [
  [33.3062, 44.4152],
  [33.3018, 44.4131],
  [33.2971, 44.4088],
  [33.2926, 44.4031],
  [33.2884, 44.3979],
  [33.2843, 44.3931],
  [33.2794, 44.3872],
];

// How far along `trackingRoute` the driver sits in each state, 0–1.
export const trackingProgress: Record<TrackingStatus, number> = {
  preparing: 0,
  ontheway: 0.55,
  delivered: 1,
};

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
// There is no seed list: an order only exists once the customer confirms a
// cart, and `OrdersContext` owns them from there. Lines reference dish ids so
// names, images and prices always come from `dishes` — an order never carries
// its own copy.
export type OrderStatus = 'active' | 'delivered';

export interface OrderLine {
  dishId: string;
  qty: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  placedAt: number; // epoch ms — the receipt's relative date is derived from this
  lines: OrderLine[];
  /** What the customer asked the kitchen for, in their own words. */
  note?: string;
  /** What the driver should do on arrival — see `dropKeys`. */
  drop?: DropChoice;
}

// What happens when the driver reaches the address. Kept short and concrete:
// each one is a different thing for the driver to do, not a different way of
// saying "deliver it".
export type DropChoice = 'hand' | 'door' | 'lobby';

export const dropKeys: DropChoice[] = ['hand', 'door', 'lobby'];

/** A rough door-to-door estimate, in minutes, quoted as a range. */
export const DELIVERY_MINUTES: [number, number] = [35, 50];

/** Charged per order on top of delivery, the way the branch bills it. */
export const SERVICE_FEE = 500;

// Order numbers start where the branch's paper book left off, so the first one
// a customer places doesn't read as #1.
const FIRST_ORDER_ID = 4821;

export const nextOrderId = (existing: Order[]): string =>
  String(
    existing.reduce((max, order) => Math.max(max, Number(order.id) || 0), FIRST_ORDER_ID - 1) + 1,
  );

// Calendar days apart, not 24-hour chunks: an order placed last night is
// "yesterday" at breakfast, not "today" until the clock catches up.
const startOfDay = (ms: number): number => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const daysSince = (placedAt: number, now: number = Date.now()): number =>
  Math.max(0, Math.round((startOfDay(now) - startOfDay(placedAt)) / 86_400_000));

// Flat fee, charged once per order. Lives here rather than in CartScreen so a
// receipt adds up the same way the checkout that produced it did.
export const DELIVERY_FEE = 2000;

export const orderTotal = (order: Order): number =>
  order.lines.reduce((sum, line) => {
    const dish = getDish(line.dishId);
    return dish ? sum + parsePrice(dish.price) * line.qty : sum;
  }, 0);

export const orderItemCount = (order: Order): number =>
  order.lines.reduce((sum, line) => sum + line.qty, 0);

// What the customer actually paid — the number a receipt should lead with.
export const orderGrandTotal = (order: Order): number => orderTotal(order) + DELIVERY_FEE;

export const orderLineTotal = (line: OrderLine): number => {
  const dish = getDish(line.dishId);
  return dish ? parsePrice(dish.price) * line.qty : 0;
};
