import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, TextStyle } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';

export interface RotatingHintProps {
  /** Shown in order, looping. One phrase renders as a plain line. */
  phrases: string[];
  /** How long each phrase holds before the next one lands. */
  hold?: number;
  style?: StyleProp<TextStyle>;
}

const FALL = 14;
const OUT_MS = 180;
const IN_MS = 260;

// The search hint reads as a list of things to try rather than one example:
// the phrase drops out of the field and the next falls in behind it. Cheap
// enough to run forever — one value, native driver, no layout in the loop.
export default function RotatingHint({ phrases, hold = 2200, style }: RotatingHintProps) {
  // Animated.Text is React Native's own, not the app's AppText, so it does not
  // inherit the reading-direction handling every other line on screen gets —
  // without this the hint alone sat on the wrong edge.
  const { isRTL } = useLanguage();
  const [index, setIndex] = useState(0);
  const shift = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phrases.length < 2) return;

    let alive = true;
    const timer = setInterval(() => {
      Animated.parallel([
        Animated.timing(shift, {
          toValue: FALL,
          duration: OUT_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: OUT_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished || !alive) return;
        setIndex((i) => (i + 1) % phrases.length);
        // Parked above the field, so the next phrase falls in the same
        // direction the last one left.
        shift.setValue(-FALL);
        Animated.parallel([
          Animated.timing(shift, {
            toValue: 0,
            duration: IN_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(fade, {
            toValue: 1,
            duration: IN_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, hold);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [phrases.length, hold, shift, fade]);

  return (
    <Animated.Text
      numberOfLines={1}
      style={[
        style,
        { textAlign: 'auto', writingDirection: isRTL ? 'rtl' : 'ltr' },
        { opacity: fade, transform: [{ translateY: shift }] },
      ]}
    >
      {phrases[index] ?? ''}
    </Animated.Text>
  );
}
