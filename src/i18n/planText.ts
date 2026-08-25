import { durationPresets } from '../data/menu';
import { count } from './count';

type Translate = (key: string, fallback?: string) => string;

/**
 * A plan length as the word a customer would use — "شهر", not "30 يوم". Falls
 * back to a plain day count for a custom length, which is the only shape a
 * span outside the presets has a name for.
 */
export const durationLabel = (dayCount: number, t: Translate): string => {
  const preset = durationPresets.find((p) => p.days === dayCount);
  return preset ? t(`duration.${preset.key}`) : count('count.days', dayCount, t);
};

/**
 * What a subscription total buys, in the two numbers a customer decides on:
 * how many meals land each delivery day, and how long the plan runs — "3 وجبات
 * باليوم · لمدة شهر".
 *
 * Shared by the box card and the box page so the figure you tap is the figure
 * you land on; the two drifted the moment they each kept their own copy. Both
 * pair it with the price for that same span — a rotation total under a "for a
 * month" line would read as a month costing two days' worth.
 */
export const planRhythm = (mealsPerDay: number, dayCount: number, t: Translate): string => {
  const meals = t('boxes.perDay').replace('{m}', count('count.meals', mealsPerDay, t));
  const span = t('boxes.forDuration').replace('{d}', durationLabel(dayCount, t));
  return `${meals} · ${span}`;
};
