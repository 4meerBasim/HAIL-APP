import { digitsOnly } from './card';

// Iraqi mobile numbers are ten digits after the country code, always starting
// with 7 — 07XX XXX XXXX written locally, +964 7XX XXX XXXX written abroad.
const LOCAL_LENGTH = 10;
const COUNTRY_CODE = '964';

export const DIAL_CODE = '+964';

// One stored shape for a number however it was typed. The same line reaches us
// as 07701234567, +964 770 123 4567 or 770-123-4567 depending on whether the
// customer copied it from a contact card, and two spellings of one number would
// otherwise both sit in the list and neither would match the other.
export function normalizePhone(value: string): string {
  let digits = digitsOnly(value);
  if (digits.startsWith(COUNTRY_CODE)) digits = digits.slice(COUNTRY_CODE.length);
  // A leading zero is the local trunk prefix, not part of the number.
  return digits.replace(/^0+/, '').slice(0, LOCAL_LENGTH);
}

export function phoneValid(value: string): boolean {
  const local = normalizePhone(value);
  return local.length === LOCAL_LENGTH && local.startsWith('7');
}

export const samePhone = (a: string, b: string): boolean =>
  normalizePhone(a) === normalizePhone(b);

// Displayed in the local 0770 123 4567 grouping rather than with the dial code:
// it is the form customers read back off their own handset. Falls back to the
// raw digits while a number is still being typed, so the field does not jump.
export function formatPhone(value: string): string {
  const local = normalizePhone(value);
  if (local.length !== LOCAL_LENGTH) return local;
  return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}
