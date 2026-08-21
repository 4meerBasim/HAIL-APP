import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Text from './AppText';
import PressScale from './PressScale';
import { colors, fonts, radius } from '../theme';

export type ChipShape = 'pill' | 'rounded';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  sublabel?: string; // optional second line (e.g. discount under a duration)
  shape?: ChipShape;
  accent?: string; // selected background / active tint (defaults to teal)
  restColor?: string; // unselected label color (defaults to body)
  full?: boolean; // flex to fill a row
  style?: StyleProp<ViewStyle>;
}

export default function Chip({
  label,
  selected,
  onPress,
  sublabel,
  shape = 'pill',
  accent = colors.teal,
  restColor = colors.body,
  full = false,
  style,
}: ChipProps) {
  const bg = selected ? accent : colors.card;
  const border = selected ? accent : colors.sand;
  const fg = selected ? colors.white : restColor;

  return (
    <PressScale
      onPress={onPress}
      scaleTo={0.95}
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: border,
          borderRadius: shape === 'pill' ? radius.pill : radius.md,
          flex: full ? 1 : undefined,
          alignSelf: full ? undefined : 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: fg, fontFamily: selected ? fonts.bold : fonts.semibold },
        ]}
      >
        {label}
      </Text>
      {sublabel ? (
        <Text style={[styles.sublabel, { color: fg }]}>{sublabel}</Text>
      ) : null}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 15,
    textAlign: 'center',
  },
  sublabel: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    opacity: 0.8,
    textAlign: 'center',
  },
});
