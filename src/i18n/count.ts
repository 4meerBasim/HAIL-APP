import { formatNumber } from './digits';

type Translate = (key: string, fallback?: string) => string;

// Arabic counts a noun in four shapes where English has two: واحدة for one, a
// dual form for two, the plural for 3–10, and the singular again from 11 up.
// Pasting the digit in front of a fixed plural — "1 وجبات" — is the one thing
// that reads as machine translation to an Arabic speaker.
const form = (n: number): 'one' | 'two' | 'few' | 'many' => {
  if (n === 1) return 'one';
  if (n === 2) return 'two';
  const mod = n % 100;
  return mod >= 3 && mod <= 10 ? 'few' : 'many';
};

/**
 * `count('count.meals', 2, t)` → 'وجبتان'. The chosen key's `{n}` is filled
 * with the number; the one and two forms spell it out and leave it unused.
 */
export const count = (base: string, n: number, t: Translate): string =>
  t(`${base}.${form(n)}`).replace('{n}', formatNumber(n));
