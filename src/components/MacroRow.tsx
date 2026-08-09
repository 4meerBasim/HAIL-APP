import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { icons } from './icons';
import { colors, fonts, radius, spacing } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { toArabicDigits } from '../i18n/digits';
import type { Macros } from '../data/menu';

// Macros read as icon + number, never as words — the icon carries the meaning
// so the same row works in Arabic and English without translation.
export const MACRO_ICON = {
  calories: icons.flame,
  protein: icons.meat,
  carbs: icons.wheat,
  fat: icons.droplet,
} as const;

// Each macro keeps its own hue everywhere it appears (row cells, steppers).
export const MACRO_COLOR = {
  calories: colors.amberIcon,
  protein: colors.tealText,
  carbs: colors.body,
  fat: colors.greenDark,
} as const;

const MACRO_TINT = {
  calories: colors.regularBg,
  protein: colors.healthyBg,
  carbs: colors.sandChip,
  fat: colors.greenBg,
} as const;

const ORDER = ['calories', 'protein', 'carbs', 'fat'] as const;

export interface MacroRowProps {
  macros: Macros;
  target?: Macros;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export default function MacroRow({ macros, target, size = 'md', style }: MacroRowProps) {
  const { lang } = useLanguage();
  const small = size === 'sm';

  return (
    <View style={[styles.row, style]}>
      {ORDER.map((key) => {
        const value = Math.round(macros[key]);
        const goal = target ? Math.round(target[key]) : null;
        const over = goal !== null && value > goal;
        return (
          <View
            key={key}
            style={[
              styles.cell,
              { backgroundColor: MACRO_TINT[key], paddingVertical: small ? 5 : 7 },
            ]}
          >
            <Icon
              path={MACRO_ICON[key]}
              size={small ? 12 : 15}
              color={MACRO_COLOR[key]}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.value,
                small && styles.valueSm,
                over && styles.valueOver,
              ]}
            >
              {toArabicDigits(value, lang)}
              {goal !== null ? (
                <Text style={styles.goal}>{` / ${toArabicDigits(goal, lang)}`}</Text>
              ) : null}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'center',
  },
  valueSm: {
    fontSize: 11,
  },
  valueOver: {
    color: colors.coral,
  },
  goal: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.muted2,
  },
});
