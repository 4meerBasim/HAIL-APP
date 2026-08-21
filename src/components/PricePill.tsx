import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Text from './AppText';
import { colors, fonts, radius, shadow, spacing } from '../theme';

export interface PricePillProps {
  value: string;
  note?: string; // trailing unit, e.g. "/ meal"
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

// A chip that sits *on* the card rather than being tinted into it. The old pill
// was an 18%-gold wash behind a half-transparent gold line: at price sizes that
// reads as a smudge, and it disappeared entirely on a warm surface. This one is
// solid white with a full-strength gold outline and its own shadow, so money
// stays the most legible thing on a card no matter what it is sitting over.
// Squared-off rounding, not a lozenge — a price is a tag, not a pill.
export default function PricePill({ value, note, size = 'md', style }: PricePillProps) {
  const small = size === 'sm';

  return (
    <View
      style={[
        styles.pill,
        small ? styles.pillSm : styles.pillMd,
        shadow.card,
        style,
      ]}
    >
      <Text style={[styles.value, small && styles.valueSm]}>{value}</Text>
      {note ? <Text style={[styles.note, small && styles.noteSm]}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
  },
  pillMd: {
    borderRadius: radius.sm,
    paddingVertical: 7,
    paddingHorizontal: spacing.xxl,
  },
  pillSm: {
    borderRadius: 11,
    paddingVertical: 5,
    paddingHorizontal: spacing.lg,
  },
  value: {
    fontFamily: fonts.heavy,
    fontSize: 16,
    color: colors.ink,
  },
  valueSm: {
    fontSize: 14,
  },
  note: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.goldText,
  },
  noteSm: {
    fontSize: 11,
  },
});
