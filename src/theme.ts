import { ViewStyle } from 'react-native';

// Palette lifted from the live Jareesh menu site, which publishes its own
// tokens as CSS custom properties (--jr-teal, --jr-gold, --jr-cream …).
// Token names are unchanged so every screen picks the brand up automatically;
// only the values moved. Gold replaces the old amber accent.
export const colors = {
  teal: '#16a89a', // --jr-teal
  tealDark: '#0e8478', // --jr-teal-dark
  tealDarker: '#0a5f56',
  tealMid: '#12968a',
  tealText: '#0e8478',
  gold: '#d6a23e', // --jr-gold
  goldLight: '#e7c77e', // --jr-gold-light
  goldText: '#9a6f17', // gold dark enough to read as text on goldTint
  goldTint: 'rgba(214,162,62,0.18)', // price/category pill fill
  goldBorder: 'rgba(214,162,62,0.55)', // price/category pill border
  amber: '#d6a23e',
  amberText: '#4a3708',
  amberIcon: '#9a6f17',
  cream: '#f8f3da', // --jr-cream-soft, the page background
  card: '#fffdf2', // --jr-card, card surface (warmer than pure white)
  sand: '#e7debb', // --jr-line
  sandChip: '#f4eec9', // --jr-cream
  healthyBg: '#ddf1ee',
  healthyBorder: '#cfe9e5',
  regularBg: '#f6ecd2',
  ink: '#2a2c2e', // --jr-charcoal
  body: '#6b6559',
  muted: '#8a8472', // --jr-muted
  muted2: '#a49d89',
  faint: '#b3ab99',
  faint2: '#c9c0ad',
  faint3: '#d8cfbd',
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
} as const;

export const radius = {
  sm: 12,
  md: 14,
  card: 16,
  lg: 18,
  xl: 20,
  xxl: 22,
  sheet: 26,
  sheet2: 28,
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

export const shadow: Record<'card' | 'teal' | 'raised' | 'sheet', ViewStyle> = {
  card: {
    shadowColor: '#103c3b',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  teal: {
    shadowColor: '#159d9b',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  raised: {
    shadowColor: '#0b5f5e',
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  sheet: {
    shadowColor: '#103c3b',
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 12,
  },
};

// Cairo is the brand's UI/Arabic face; headings on the site run at 800.
// Playfair Display 800 is reserved for the "Jareesh" wordmark only.
export const fonts = {
  regular: 'Cairo_400Regular',
  medium: 'Cairo_500Medium',
  semibold: 'Cairo_600SemiBold',
  bold: 'Cairo_700Bold',
  heavy: 'Cairo_800ExtraBold',
  wordmark: 'PlayfairDisplay_800ExtraBold',
} as const;

// Shared type scale. Screens compose these instead of hand-picking font sizes so
// headings, body and captions stay consistent app-wide (color is applied per use).
export const type = {
  // The one live total on a screen — plan summary hero (design: 30px/700).
  money: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 38 },
  display: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32 },
  h1: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 29 },
  h2: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 25 },
  h3: { fontFamily: fonts.bold, fontSize: 15.5, lineHeight: 22 },
  title: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 13.5, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 11.5, lineHeight: 16 },
  captionStrong: { fontFamily: fonts.semibold, fontSize: 11.5, lineHeight: 16 },
  micro: { fontFamily: fonts.medium, fontSize: 10.5, lineHeight: 14 },
} as const;

export type ColorToken = keyof typeof colors;
