import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Text from './AppText';
import { colors, fonts, radius, spacing } from '../theme';

export interface PricePillProps {
  value: string;
  note?: string; // trailing unit, e.g. "/ meal"
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

// The brand's signature pill from the live menu site: an 18% gold fill behind a
// 55% gold border. Reserved for prices so money reads the same everywhere.
export default function PricePill({ value, note, size = 'md', style }: PricePillProps) {
  const small = size === 'sm';

  return (
    <View
      style={[
        styles.pill,
        { paddingVertical: small ? 3 : 5, paddingHorizontal: small ? spacing.md : spacing.lg },
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
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: radius.pill,
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.goldText,
  },
  valueSm: {
    fontSize: 12,
  },
  note: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.goldText,
    opacity: 0.85,
  },
  noteSm: {
    fontSize: 9.5,
  },
});
