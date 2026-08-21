import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Text from './AppText';
import { colors, fonts, overlay, radius, spacing } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import type { Macros } from '../data/menu';

// Read-only: nothing in the app edits these figures, they are here to compare
// dishes. The three grams share one line and calories get their own below —
// calories are the number people scan for, and a different unit besides.
const ORDER = ['fat', 'carbs', 'protein'] as const;

export interface MacroRowProps {
  macros: Macros;
  size?: 'sm' | 'md';
  // On the teal plan gradient ink numerals disappear, so the block goes white.
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
}

// No icons: a dumbbell next to a number does not say "protein" to anyone who
// did not already know. What makes a figure obvious is the figure being big and
// the word under it being a real word in full, dark enough to read — so the
// numerals run at heading weight and the labels are spelled out rather than
// abbreviated. Calories then get a filled band of their own, because they are
// the line people actually scan for and a rule alone did not separate them.
export default function MacroRow({ macros, size = 'md', onDark = false, style }: MacroRowProps) {
  const { t } = useLanguage();
  const small = size === 'sm';
  const gram = t('detail.gram');

  return (
    <View style={[styles.wrap, small && styles.wrapSm, style]}>
      <View style={styles.row}>
        {ORDER.map((key, i) => (
          <React.Fragment key={key}>
            {i > 0 ? (
              <View
                style={[styles.divider, small && styles.dividerSm, onDark && styles.onDarkLine]}
              />
            ) : null}
            <View style={styles.cell}>
              <Text style={[styles.value, small && styles.valueSm, onDark && styles.onDarkValue]}>
                {`${formatNumber(Math.round(macros[key]))}${gram}`}
              </Text>
              <Text
                style={[styles.label, small && styles.labelSm, onDark && styles.onDarkLabel]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {t(`detail.${key}`)}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <View style={[styles.calories, small && styles.caloriesSm, onDark && styles.onDarkBand]}>
        <Text
          style={[styles.caloriesValue, small && styles.caloriesValueSm, onDark && styles.onDarkValue]}
        >
          {formatNumber(Math.round(macros.calories))}
        </Text>
        <Text
          style={[styles.caloriesLabel, small && styles.labelSm, onDark && styles.onDarkLabel]}
          numberOfLines={1}
        >
          {t('detail.calories')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  wrapSm: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: 1,
    height: 34,
    backgroundColor: colors.sand,
  },
  dividerSm: {
    height: 30,
  },
  calories: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.sandChip,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
  },
  caloriesSm: {
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  value: {
    fontFamily: fonts.heavy,
    fontSize: 20,
    lineHeight: 28,
    color: colors.ink,
  },
  valueSm: {
    fontSize: 17,
    lineHeight: 24,
  },
  caloriesValue: {
    fontFamily: fonts.heavy,
    fontSize: 20,
    lineHeight: 28,
    color: colors.ink,
  },
  caloriesValueSm: {
    fontSize: 17,
    lineHeight: 24,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  labelSm: {
    fontSize: 12,
    lineHeight: 17,
  },
  caloriesLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  onDarkValue: {
    color: colors.white,
  },
  onDarkLabel: {
    color: overlay.white75,
  },
  onDarkLine: {
    backgroundColor: overlay.white20,
  },
  onDarkBand: {
    backgroundColor: overlay.white12,
  },
});
