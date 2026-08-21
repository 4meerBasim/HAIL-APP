import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: number;
  background?: string;
  raised?: boolean; // stronger shadow
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export default function Card({
  children,
  onPress,
  padding = 14,
  background = colors.card,
  raised = false,
  style,
  accessibilityLabel,
}: CardProps) {
  const base = [
    styles.card,
    raised ? shadow.raised : shadow.card,
    { padding, backgroundColor: background },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={base}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
  // The hairline is not decoration — a white card on warm paper needs an edge as
  // well as a shadow, or it dissolves the moment the shadow is clipped by a
  // parent with overflow hidden.
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.sand,
  },
});
