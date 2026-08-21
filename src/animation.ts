import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { MONEY_STEP } from './data/menu';

// One spring for state changes and one curve for entrances, shared app-wide so
// motion reads as a single system. Spring values match TabBar's, which was the
// first screen to animate. Everything runs on the native driver except the
// count-up, which feeds a text child and so cannot.
const SPRING = { friction: 8, tension: 90, useNativeDriver: true } as const;
const ENTER_MS = 380;
const STAGGER_MS = 55;

// 0 → 1 on select. Drive opacity/scale off this to crossfade a selected layer
// over the resting one — the native driver can't tween backgroundColor, so a
// stacked layer is how a colour change gets to be smooth.
export function useToggle(on: boolean) {
  const anim = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, { ...SPRING, toValue: on ? 1 : 0 }).start();
  }, [on, anim]);

  return anim;
}

// Entrance: fade up, staggered by index so a screen resolves top-down instead
// of snapping in as one block.
export function useReveal(index = 0) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: ENTER_MS,
      delay: index * STAGGER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };
}

// Scale-in for something that appears mid-session rather than on mount — the
// savings pill arriving the moment a plan first qualifies.
export function usePop() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { ...SPRING, toValue: 1 }).start();
  }, [anim]);

  return {
    opacity: anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
  };
}

// Tweens the figure itself so a price edit reads as a change rather than a
// repaint. JS-driven by necessity: the output is text, not a transform.
// `step` snaps every intermediate frame to the same increment the figure itself
// is quoted in. Rounding to the nearest dinar instead let a total that starts
// and ends on a clean number spend half a second reading 402,317.
export function useCountUp(value: number, duration = 420, step = MONEY_STEP) {
  const anim = useRef(new Animated.Value(value)).current;
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setShown(Math.round(v / step) * step));
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [anim, value, duration, step]);

  return shown;
}

// One-shot bump when the watched value changes. Pairs with useCountUp so the
// total lifts as it retallies. Skips the first run so mounting stays still.
export function usePulse(watch: unknown) {
  const anim = useRef(new Animated.Value(1)).current;
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1.05,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(anim, { ...SPRING, toValue: 1 }),
    ]).start();
  }, [watch, anim]);

  return anim;
}

// Breathing loop for the live dot on an in-flight order — the one thing on the
// screen that should look like it's still running.
export function usePulseLoop() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return anim;
}
