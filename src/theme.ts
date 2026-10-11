import { Platform, TextStyle, ViewStyle } from 'react-native';

// Brand hues (teal, gold) come from the live Hail menu site's CSS custom
// properties. The neutrals do not: the site's cream page was built for a beige
// canvas, and tinting these toward the teal instead made the whole app read
// green. They are plain warm greys, so teal stays an accent rather than a mood.
export const colors = {
  teal: '#16a89a', // --jr-teal
  tealDark: '#0e8478', // --jr-teal-dark
  tealDarker: '#0a5f56',
  tealMid: '#12968a',
  tealText: '#0b6f65', // teal dark enough to read as text on cream
  gold: '#d6a23e', // --jr-gold
  goldLight: '#e7c77e', // --jr-gold-light
  goldText: '#7d570f', // gold dark enough to read as text on goldTint
  goldTint: 'rgba(214,162,62,0.14)',
  goldBorder: '#d6a23e', // the price chip's own outline — solid, not a wash
  brown: '#8a5a24', // ring around the brand logo, warm end of the gold ramp
  amber: '#d6a23e',
  amberText: '#3a2a05', // the label on a gold button — 8:1 against the fill
  amberIcon: '#8a6111',
  // The page is warm paper, not white, so a white card has something to sit on
  // top of. Every "flat, glued to the background" card comes from the two being
  // the same colour; here they never are.
  cream: '#f6f4f1', // page background
  card: '#ffffff', // cards, fields, buttons, sheets sitting on the page
  tile: '#eae7e1', // icon tiles and status pills that carry no meaning by color
  // A step deeper than `card`, because it is always a control nested inside one
  // — a stepper pill in a cart row, a remove button in a meal row.
  sandChip: '#eeeae3',
  sand: '#e3ded6', // hairlines and borders
  healthyBg: '#d9efea', // the healthy/regular dish distinction, and teal-on states
  healthyBorder: '#c3e5dd',
  regularBg: '#f7ecd7',
  // Text ramp, neutralised and darkened — the old one leaned yellow and ran too
  // light to read on a warm surface.
  ink: '#1f1e1d', // headings and primary text
  body: '#4a4844', // body copy
  muted: '#67655f', // secondary labels
  muted2: '#7d7b76', // tertiary / captions
  faint: '#98968f', // placeholder text
  faint2: '#bebbb4', // disabled glyphs
  faint3: '#d6d2ca', // empty-state strokes
  white: '#fff',
  green: '#2fae52',
  greenDark: '#1c8a44', // green that clears 3:1 as an icon stroke on greenBg/white
  greenBg: '#e4f6ea',
  coral: '#ef6f4c',
  coralBg: '#fdeae4',
  violet: '#7c5cbf',
  violetBg: '#efeafa',
  mapBg: '#e8ebe2',
  mapShape1: '#dfe6d5',
  mapShape2: '#dce9e8',
} as const;

// Translucent whites used over teal/dark gradients (design uses rgba(255,255,255,α)).
// Named by alpha ×100 so screens never inline an rgba literal.
export const overlay = {
  white05: 'rgba(255,255,255,0.05)',
  white06: 'rgba(255,255,255,0.06)',
  white08: 'rgba(255,255,255,0.08)',
  white12: 'rgba(255,255,255,0.12)',
  white14: 'rgba(255,255,255,0.14)',
  white16: 'rgba(255,255,255,0.16)',
  white20: 'rgba(255,255,255,0.2)',
  white22: 'rgba(255,255,255,0.22)',
  white25: 'rgba(255,255,255,0.25)',
  white30: 'rgba(255,255,255,0.3)',
  white70: 'rgba(255,255,255,0.7)',
  white75: 'rgba(255,255,255,0.75)',
  white80: 'rgba(255,255,255,0.8)',
  white90: 'rgba(255,255,255,0.9)',
  white96: 'rgba(255,255,255,0.96)',
} as const;

// Dark teal scrim gradient behind the Home hero copy (design: rgba(8,64,63,α)).
export const scrim = {
  hero: 'rgba(8,64,63,0.88)',
  heroFade: 'rgba(8,64,63,0)',
  // Behind the full-screen photo viewer — near-black so the food carries it.
  photo: 'rgba(0,0,0,0.94)',
  // Behind a modal card. Warm rather than neutral grey, so the cream sheet on
  // top of it does not read as cold.
  dialog: 'rgba(20,16,12,0.55)',
} as const;

export const radius = {
  sm: 14,
  md: 16,
  card: 18,
  lg: 20,
  xl: 22,
  xxl: 24,
  sheet: 28,
  sheet2: 32,
  control: 18, // buttons and input fields
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 14,
  xxxl: 16,
  huge: 20,
  giant: 26,
} as const;

// Two shadows per surface would be ideal; React Native gives one, so each token
// picks the radius/opacity pair that reads as its own height. `card` is a
// contact shadow, `lifted` is the one a product card floats on, `cta` is warm
// because it falls from a gold button and a grey shadow under gold looks dirty.
export const shadow: Record<'card' | 'lifted' | 'cta' | 'raised' | 'bar' | 'sheet', ViewStyle> = {
  card: {
    shadowColor: '#2a2622',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  lifted: {
    shadowColor: '#241f1a',
    shadowOpacity: 0.15,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9,
  },
  cta: {
    shadowColor: '#8a6111',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  raised: {
    shadowColor: '#241f1a',
    shadowOpacity: 0.18,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  // A pinned header the page scrolls under. `sheet` mirrored: cast downward,
  // and softer, because a bar sits far closer to the content than a sheet does.
  bar: {
    shadowColor: '#241f1a',
    shadowOpacity: 0.09,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  sheet: {
    shadowColor: '#241f1a',
    shadowOpacity: 0.1,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: -12 },
    elevation: 10,
  },
};

// Plus Jakarta Sans is the English UI face, IBM Plex Sans Arabic the Arabic one.
// Styles name the English families; text components swap in the Arabic
// equivalent through `localFont`. Plex Arabic stops at 700, so heavy maps to
// bold there. Playfair Display 800 is reserved for the "Hail" wordmark only.
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  heavy: 'PlusJakartaSans_800ExtraBold',
  wordmark: 'PlayfairDisplay_800ExtraBold',
} as const;

const arabicFonts: Record<string, string> = {
  [fonts.regular]: 'IBMPlexSansArabic_400Regular',
  [fonts.medium]: 'IBMPlexSansArabic_500Medium',
  [fonts.semibold]: 'IBMPlexSansArabic_600SemiBold',
  [fonts.bold]: 'IBMPlexSansArabic_700Bold',
  [fonts.heavy]: 'IBMPlexSansArabic_700Bold',
};

export const localFont = (family: string | undefined, lang: 'ar' | 'en'): string | undefined =>
  family && lang === 'ar' ? (arabicFonts[family] ?? family) : family;

// The type scale was sized against Cairo. Plus Jakarta Sans sets the same
// English line about 11% wider, which crowded cards, so English text runs at
// 90% — back to Cairo's measure. Line heights are kept, so layout heights hold.
const ENGLISH_SCALE = 0.9;

export const localSize = (size: number, lang: 'ar' | 'en'): number =>
  lang === 'en' ? size * ENGLISH_SCALE : size;

// Shared type scale. Screens compose these instead of hand-picking font sizes so
// headings, body and captions stay consistent app-wide (color is applied per use).
//
// Every step runs ~10% larger than the first pass, and the smallest step is
// 12.5pt rather than 11.5 — Arabic letterforms carry more detail per glyph than
// Latin ones and go muddy first, so the floor of the scale is where legibility
// is won or lost. Line heights are generous for the same reason: Arabic
// ascenders and the dots below ب/ج need the room.
// A field holding a number, a card or an email reads left-to-right and sits on
// the left in both languages. iOS gets there from 'auto' plus the LTR writing
// direction. Android ignores writingDirection on inputs, so 'auto' would follow
// the RTL layout for a digits-only value; its 'left' is a physical gravity that
// RTL never mirrors, which is the one place a physical side is correct.
export const ltrField: TextStyle = {
  textAlign: Platform.OS === 'ios' ? 'auto' : 'left',
  writingDirection: 'ltr',
};

export const type = {
  // The one live total on a screen — plan summary hero.
  money: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 48 },
  display: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 41 },
  h1: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 35 },
  h2: { fontFamily: fonts.bold, fontSize: 20.5, lineHeight: 29 },
  h3: { fontFamily: fonts.bold, fontSize: 17.5, lineHeight: 25 },
  title: { fontFamily: fonts.semibold, fontSize: 16.5, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 26 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 26 },
  caption: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20 },
  captionStrong: { fontFamily: fonts.semibold, fontSize: 13.5, lineHeight: 20 },
  micro: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 18 },
} as const;

export type ColorToken = keyof typeof colors;
