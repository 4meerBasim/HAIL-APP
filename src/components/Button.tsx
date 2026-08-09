import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import type { IconPath } from './icons';
import { colors, fonts, radius } from '../theme';

export type ButtonVariant = 'primary' | 'amber' | 'light' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  color?: string; // overrides the solid background (primary variant) — e.g. box accents
  textColor?: string;
  trailing?: IconPath; // trailing icon path, e.g. icons.arrowLeft
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const SIZES: Record<ButtonSize, { padV: number; padH: number; font: number }> = {
  sm: { padV: 9, padH: 14, font: 12.5 },
  md: { padV: 12, padH: 18, font: 14 },
  lg: { padV: 15, padH: 20, font: 15.5 },
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  full = false,
  color,
  textColor,
  trailing,
  disabled = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const s = SIZES[size];

  let bg: string = 'transparent';
  let fg: string = colors.white;
  let borderColor: string = 'transparent';
  let borderWidth = 0;

  if (variant === 'primary') {
    bg = color ?? colors.teal;
  } else if (variant === 'amber') {
    bg = colors.amber;
    fg = colors.amberText;
  } else if (variant === 'light') {
    bg = colors.white;
    fg = color ?? colors.tealDark;
  } else if (variant === 'outline') {
    bg = colors.white;
    fg = color ?? colors.ink;
    borderColor = colors.sand;
    borderWidth = 1.5;
  } else if (variant === 'ghost') {
    fg = color ?? colors.teal;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth,
          paddingVertical: s.padV,
          paddingHorizontal: s.padH,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View style={styles.inner}>
        <Text style={[styles.label, { color: textColor ?? fg, fontSize: s.font }]}>{label}</Text>
        {trailing ? (
          <Icon path={trailing} size={s.font + 2} color={textColor ?? fg} strokeWidth={2.2} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
});
