import type { Lang } from './LanguageContext';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

// Convert Western digits to Arabic-Indic. In `en` the value is returned unchanged,
// so callers can pass the active language and get the right script per place.
export const toArabicDigits = (value: string | number, lang: Lang = 'ar'): string =>
  lang === 'ar' ? String(value).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]) : String(value);

// Convert Arabic-Indic digits back to Western (used where money/counts must stay Latin).
export const toWesternDigits = (value: string | number): string =>
  String(value).replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
