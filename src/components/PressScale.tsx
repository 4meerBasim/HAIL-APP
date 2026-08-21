import React, { useRef } from 'react';
import {
  AccessibilityRole,
  AccessibilityState,
  Animated,
  Insets,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';

// Animating the Pressable itself keeps layout, visuals and the transform on one
// view — wrapping the children in an inner Animated.View instead would swallow
// any flexDirection or flex the caller passed in `style`.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  // Smaller controls need a deeper dip to register as pressed at all.
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  hitSlop?: Insets;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityLabel?: string;
}

// Touch feedback that holds while the finger is down, which activeOpacity alone
// doesn't communicate on a tile big enough to look static.
export default function PressScale({
  children,
  onPress,
  disabled = false,
  scaleTo = 0.96,
  style,
  hitSlop,
  accessibilityRole = 'button',
  accessibilityState,
  accessibilityLabel,
}: PressScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const to = (toValue: number) =>
    Animated.spring(scale, { toValue, friction: 8, tension: 180, useNativeDriver: true }).start();

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => to(disabled ? 1 : scaleTo)}
      onPressOut={() => to(1)}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
