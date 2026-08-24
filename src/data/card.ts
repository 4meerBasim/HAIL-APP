// Card entry rules, kept away from the screen so the model and the form agree
// on what a number is without either owning the definition.

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'unknown';

// Brand names are brand names in any language, so they are not translated —
// and they are here rather than on a screen because two screens now show them.
export const brandLabel: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  unknown: 'Card',
};

export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

// Enough of the IIN ranges to name the brands the restaurant actually takes.
// Deliberately prefix-only: a full BIN table belongs on a server, and getting
// the brand wrong here costs a logo, not a declined payment.
export const detectBrand = (digits: string): CardBrand => {
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  return 'unknown';
};

// Amex is 15 digits in 4-6-5; everything else is 16 in four groups of four.
export const groupsFor = (brand: CardBrand): number[] =>
  brand === 'amex' ? [4, 6, 5] : [4, 4, 4, 4];

export const numberLength = (brand: CardBrand): number => (brand === 'amex' ? 15 : 16);
export const cvvLength = (brand: CardBrand): number => (brand === 'amex' ? 4 : 3);

// Pads with the placeholder glyph so the model always shows a full card and
// each position is a stable slot — that is what lets a single character animate
// when it changes instead of the whole line re-laying out.
export const PLACEHOLDER = '#';

export const cardFace = (digits: string, brand: CardBrand): string[] => {
  const padded = digits.padEnd(numberLength(brand), PLACEHOLDER);
  const out: string[] = [];
  let at = 0;
  groupsFor(brand).forEach((size, i) => {
    if (i > 0) out.push(' ');
    for (let k = 0; k < size; k += 1) out.push(padded[at + k] ?? PLACEHOLDER);
    at += size;
  });
  return out;
};

export const formatNumberInput = (digits: string, brand: CardBrand): string => {
  const parts: string[] = [];
  let at = 0;
  for (const size of groupsFor(brand)) {
    if (at >= digits.length) break;
    parts.push(digits.slice(at, at + size));
    at += size;
  }
  return parts.join(' ');
};

export const formatExpiryInput = (digits: string): string => {
  const mm = digits.slice(0, 2);
  const yy = digits.slice(2, 4);
  return yy ? `${mm}/${yy}` : mm;
};

// Catches a transposed digit, which is the mistake a customer actually makes.
export const luhnValid = (digits: string): boolean => {
  if (digits.length < 12) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
};

// `now` is passed in rather than read here so the check stays pure and the
// caller decides what "today" means.
export const expiryValid = (digits: string, now: Date): boolean => {
  if (digits.length !== 4) return false;
  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2, 4));
  if (month < 1 || month > 12) return false;
  // Valid through the last day of the stated month.
  return new Date(year, month, 1).getTime() > now.getTime();
};

// What gets persisted. Never the full number and never the CVV — a PAN sitting
// in AsyncStorage is plain text on the device, and the CVV must not be stored
// at all by anyone, ever.
export interface StoredCard {
  brand: CardBrand;
  last4: string;
  holder: string;
  expiry: string; // MM/YY
}
