import React from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useReveal } from '../animation';

export interface RevealProps {
  children: React.ReactNode;
  // Position in the stagger, not a delay in ms — keeps call sites readable when
  // sections are reordered.
  index?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Reveal({ children, index = 0, style }: RevealProps) {
  const anim = useReveal(index);
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}
