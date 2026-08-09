import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import type { IconPath } from './icons';
import { colors, fonts, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { toArabicDigits } from '../i18n/digits';

const HIT = { top: 8, bottom: 8, left: 8, right: 8 };

export interface StepperProps {
  icon: IconPath;
  value: number;
  label?: string;
  suffix?: string;
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement?: boolean;
  canIncrement?: boolean;
  accent?: string;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
}

export default function Stepper({
  icon,
  value,
  label,
  suffix,
  onDecrement,
  onIncrement,
  canDecrement = true,
  canIncrement = true,
  accent = colors.teal,
  iconColor = colors.muted,
  style,
}: StepperProps) {
  const { lang } = useLanguage();

  return (
    <View style={[styles.row, style]}>
      <View style={styles.lead}>
        <Icon path={icon} size={20} color={iconColor} strokeWidth={1.9} />
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!canDecrement}
          onPress={onDecrement}
          hitSlop={HIT}
          accessibilityRole="button"
          accessibilityLabel={label ? `− ${label}` : '−'}
          style={[styles.btn, !canDecrement && styles.btnOff]}
        >
          <Text style={[styles.sign, { color: canDecrement ? accent : colors.faint2 }]}>−</Text>
        </TouchableOpacity>

        <View style={styles.readout}>
          <Text style={styles.value}>{toArabicDigits(value, lang)}</Text>
          {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!canIncrement}
          onPress={onIncrement}
          hitSlop={HIT}
          accessibilityRole="button"
          accessibilityLabel={label ? `+ ${label}` : '+'}
          style={[styles.btn, !canIncrement && styles.btnOff]}
        >
          <Text style={[styles.sign, { color: canIncrement ? accent : colors.faint2 }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  lead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
  },
  label: {
    ...type.title,
    color: colors.ink,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.sand,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOff: {
    backgroundColor: colors.sandChip,
  },
  sign: {
    fontFamily: fonts.bold,
    fontSize: 19,
    lineHeight: 22,
    textAlign: 'center',
  },
  readout: {
    minWidth: 66,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 3,
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.ink,
    textAlign: 'center',
  },
  suffix: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.muted,
  },
});
