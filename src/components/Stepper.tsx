import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import PressScale from './PressScale';
import { type IconPath, icons } from './icons';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';

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
  const { t } = useLanguage();

  return (
    <View style={[styles.row, style]}>
      <View style={styles.lead}>
        <Icon path={icon} size={20} color={iconColor} strokeWidth={1.9} />
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>

      <View style={styles.controls}>
        <PressScale
          disabled={!canDecrement}
          onPress={onDecrement}
          scaleTo={0.88}
          hitSlop={HIT}
          accessibilityLabel={`${t('common.decrease')} ${label ?? ''}`.trim()}
          accessibilityState={{ disabled: !canDecrement }}
          style={[styles.btn, !canDecrement && styles.btnOff]}
        >
          <Icon
            path={icons.minus}
            size={15}
            color={canDecrement ? accent : colors.faint2}
            strokeWidth={2.6}
          />
        </PressScale>

        <View style={styles.readout}>
          <Text style={styles.value}>{formatNumber(value)}</Text>
          {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        </View>

        <PressScale
          disabled={!canIncrement}
          onPress={onIncrement}
          scaleTo={0.88}
          hitSlop={HIT}
          accessibilityLabel={`${t('common.increase')} ${label ?? ''}`.trim()}
          accessibilityState={{ disabled: !canIncrement }}
          style={[styles.btn, !canIncrement && styles.btnOff]}
        >
          <Icon
            path={icons.plus}
            size={15}
            color={canIncrement ? accent : colors.faint2}
            strokeWidth={2.6}
          />
        </PressScale>
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
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  btnOff: {
    backgroundColor: colors.sandChip,
    shadowOpacity: 0,
    elevation: 0,
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
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
  },
  suffix: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.muted,
  },
});
