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
  /** Optional: a stepper under an already-named card says nothing new with a
   *  glyph, and the space it costs is space the buttons need. */
  icon?: IconPath;
  value: number;
  label?: string;
  suffix?: string;
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement?: boolean;
  canIncrement?: boolean;
  accent?: string;
  iconColor?: string;
  /** For narrow containers — a column of a two-up grid rather than a full-width
   *  card. Smaller buttons and a tighter readout, so the row still fits. */
  compact?: boolean;
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
  compact = false,
  style,
}: StepperProps) {
  const { t } = useLanguage();
  // Nothing to lead with means the controls own the row: minus at one edge,
  // plus at the other, the figure centred between them. Rendering an empty
  // lead instead would park the whole group at the end of the row.
  const hasLead = Boolean(icon || label);

  return (
    <View style={[styles.row, style]}>
      {hasLead ? (
        <View style={styles.lead}>
          {icon ? <Icon path={icon} size={20} color={iconColor} strokeWidth={1.9} /> : null}
          {label ? <Text style={styles.label}>{label}</Text> : null}
        </View>
      ) : null}

      <View
        style={[
          styles.controls,
          compact && styles.controlsCompact,
          !hasLead && styles.controlsAlone,
        ]}
      >
        <PressScale
          disabled={!canDecrement}
          onPress={onDecrement}
          scaleTo={0.88}
          hitSlop={HIT}
          accessibilityLabel={`${t('common.decrease')} ${label ?? ''}`.trim()}
          accessibilityState={{ disabled: !canDecrement }}
          style={[styles.btn, compact && styles.btnCompact, !canDecrement && styles.btnOff]}
        >
          <Icon
            path={icons.minus}
            size={15}
            color={canDecrement ? accent : colors.faint2}
            strokeWidth={2.6}
          />
        </PressScale>

        <View style={[styles.readout, compact && styles.readoutCompact]}>
          <Text style={[styles.value, compact && styles.valueCompact]}>{formatNumber(value)}</Text>
          {suffix ? (
            <Text style={[styles.suffix, compact && styles.suffixCompact]}>{suffix}</Text>
          ) : null}
        </View>

        <PressScale
          disabled={!canIncrement}
          onPress={onIncrement}
          scaleTo={0.88}
          hitSlop={HIT}
          accessibilityLabel={`${t('common.increase')} ${label ?? ''}`.trim()}
          accessibilityState={{ disabled: !canIncrement }}
          style={[styles.btn, compact && styles.btnCompact, !canIncrement && styles.btnOff]}
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
  controlsCompact: {
    gap: spacing.sm,
  },
  // With no lead beside them the controls take the row: the two buttons sit on
  // the edges and the figure centres itself between them.
  controlsAlone: {
    flex: 1,
    justifyContent: 'space-between',
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
  btnCompact: {
    width: 30,
    height: 30,
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
  readoutCompact: {
    minWidth: 0,
    flexShrink: 1,
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
  },
  valueCompact: {
    fontSize: 15,
  },
  suffix: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.muted,
  },
  suffixCompact: {
    fontSize: 11,
  },
});
