import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import PressScale from './PressScale';
import type { IconPath } from './icons';
import { colors, fonts, radius, shadow } from '../theme';

export type ButtonVariant = 'primary' | 'amber' | 'teal' | 'light' | 'outline' | 'ghost';
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

// Taller than before: a 52pt-ish primary reads as a deliberate target and gives
// the label room to breathe at the larger type scale.
const SIZES: Record<ButtonSize, { padV: number; padH: number; font: number }> = {
  sm: { padV: 11, padH: 18, font: 14 },
  md: { padV: 15, padH: 22, font: 16 },
  lg: { padV: 18, padH: 26, font: 17.5 },
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
  let lift: ViewStyle | null = null;

  // Gold is the commit colour, the one the protein box already used and the one
  // the printed offer sheets put every price and offer number in. Subscribing
  // and ordering are the same act everywhere in the app, so they wear it
  // everywhere — a per-box accent CTA made the same button mean five things.
  if (variant === 'primary' || variant === 'amber') {
    bg = color ?? colors.gold;
    fg = colors.white;
    lift = shadow.cta;
  } else if (variant === 'teal') {
    bg = color ?? colors.teal;
    lift = shadow.card;
  } else if (variant === 'light') {
    bg = colors.card;
    fg = color ?? colors.tealDark;
  } else if (variant === 'outline') {
    bg = colors.card;
    fg = color ?? colors.ink;
    borderColor = colors.sand;
    borderWidth = 1;
  } else if (variant === 'ghost') {
    fg = color ?? colors.teal;
  }

  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.97}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        lift,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth,
          paddingVertical: s.padV,
          paddingHorizontal: s.padH,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      <View style={styles.inner}>
        {/* One line, always: a two-word label that wrapped made the button
            taller than the one beside it. Shrinking only kicks in when the
            label would not otherwise fit, so short labels are untouched. */}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={[styles.label, { color: textColor ?? fg, fontSize: s.font }]}
        >
          {label}
        </Text>
        {trailing ? (
          <Icon path={trailing} size={s.font + 2} color={textColor ?? fg} strokeWidth={2.2} />
        ) : null}
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.control,
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
