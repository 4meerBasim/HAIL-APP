const AR_INDIC = '٠١٢٣٤٥٦٧٨٩'; // U+0660–0669
const FA_INDIC = '۰۱۲۳۴۵۶۷۸۹'; // U+06F0–06F9, the Persian/Urdu forms

// The app renders Western digits everywhere, in every language. Arabic-Indic
// numerals are never produced: a price, a count or an ETA has to stay the same
// glyph when the customer switches language mid-order, and Latin digits are
// what Iraqi delivery, banking and phone UIs use in practice.
//
// Digits are neutral-direction characters, so a Western number inside an Arabic
// sentence keeps its own left-to-right run without any wrapping — see the RTL
// note in AppText. That is why this is safe to apply to Arabic copy.

/** Rewrite any Arabic-Indic or Persian digits in `value` to Western 0-9. */
export const toWesternDigits = (value: string | number): string =>
  String(value).replace(/[٠-٩۰-۹]/g, (d) => {
    const ar = AR_INDIC.indexOf(d);
    return String(ar >= 0 ? ar : FA_INDIC.indexOf(d));
  });

/**
 * Render a number for display. Always Western digits, regardless of language —
 * takes no `lang` on purpose, so no call site can reintroduce a per-language
 * numeral script.
 */
export const formatNumber = (value: string | number): string => toWesternDigits(value);
