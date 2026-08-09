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
// so the same row works in Arabic and English without translation. Read-only:
// nothing in the app edits these figures, they are here to compare dishes.
const MACRO_ICON = {
  calories: icons.flame,
  protein: icons.meat,
  carbs: icons.wheat,
  fat: icons.droplet,
} as const;

const MACRO_COLOR = {
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
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export default function MacroRow({ macros, size = 'md', style }: MacroRowProps) {
  const { t, lang } = useLanguage();
  const small = size === 'sm';

  return (
    <View style={[styles.row, style]}>
      {ORDER.map((key) => {
        const value = Math.round(macros[key]);
        return (
          <View
            key={key}
            style={[
              styles.cell,
              { backgroundColor: MACRO_TINT[key], paddingVertical: small ? 5 : 7 },
            ]}
            accessibilityLabel={`${t(`detail.${key}`)} ${toArabicDigits(value, lang)}`}
          >
            <Icon
              path={MACRO_ICON[key]}
              size={small ? 12 : 15}
              color={MACRO_COLOR[key]}
              strokeWidth={2.2}
            />
            <Text style={[styles.value, small && styles.valueSm]}>
              {toArabicDigits(value, lang)}
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
});
