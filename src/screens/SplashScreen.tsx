import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors, fonts, overlay, spacing } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

// Backdrop is Login's, element for element — same gradient, same two girih
// patches at the same offsets. The handoff is then a crossfade of the middle of
// the screen rather than a cut between two different backgrounds.
const GRADIENT_COLORS = [colors.tealDark, colors.teal, colors.tealMid] as const;
const GRADIENT_LOCATIONS = [0, 0.62, 1] as const;

const LOGO = require('../../assets/logo-hail.png');
const PATTERN_GOLD = require('../../assets/pattern-arabic-gold.png');
const PATCH_TOP = 320;
const PATCH_SIDE = 225;

// The girih band printed across the foot of every offer sheet, lifted at its
// exact tile boundaries — 13 whole tiles, first teal and last gold — so a copy
// butted against another copy joins on a tile edge like any other. That is what
// lets it march forever without a seam.
const STRIP = require('../../assets/girih-strip.png');
const STRIP_ASPECT = 5464 / 361; // the crop's own proportions
const STRIP_H = 42;
// Fast enough to read as moving at a glance, slow enough not to pull the eye
// off the wordmark. Expressed as a speed so the loop takes the same time per
// tile on any screen, rather than the same time per lap.
const STRIP_SPEED = 58; // points per second

const INTRO_MS = 900;
// The splash has to be readable even when auth resolves instantly, so the outro
// cannot start before the intro has landed and held for a beat. The hold runs
// from mount, not from the end of the intro, so this is the floor for the whole
// screen: ~2.4s up, plus the outro, and the band gets a good second and a half
// of marching before anything starts to dissolve.
const HOLD_MS = 2400;
const OUTRO_MS = 560;
const DRIFT_MS = 16000;
// One revolution of the girih patches, on its own clock so the wash keeps
// breathing at DRIFT_MS while the turn stays slow. Matches LoginScreen.
const SPIN_MS = 40000;

export interface SplashScreenProps {
  // App state has settled and whatever is underneath is safe to reveal.
  ready?: boolean;
  onDone?: () => void;
}

export default function SplashScreen({ ready = false, onDone }: SplashScreenProps) {
  const { t, isRTL } = useLanguage();
  const { width, height } = useWindowDimensions();

  const intro = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const march = useRef(new Animated.Value(0)).current;
  const outro = useRef(new Animated.Value(0)).current;
  const [held, setHeld] = useState(false);

  // Whole points: a fractional copy width rounds differently per copy and opens
  // a hairline of background between them halfway through the lap.
  const stripW = Math.round(STRIP_H * STRIP_ASPECT);
  // Enough copies to still cover the screen when the run has slid a full width.
  const copies = Math.ceil(width / stripW) + 1;

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: INTRO_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Never settles, so the texture keeps breathing for as long as the splash
    // is up — a still pattern reads as a frozen screen if auth is slow.
    const loop = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: DRIFT_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();

    const turn = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: SPIN_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    turn.start();

    // Exactly one strip width per lap, so the copy that arrives lands where the
    // one that left started and the reset is invisible.
    const ticker = Animated.loop(
      Animated.timing(march, {
        toValue: 1,
        duration: (stripW / STRIP_SPEED) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    ticker.start();

    const timer = setTimeout(() => setHeld(true), HOLD_MS);
    return () => {
      clearTimeout(timer);
      loop.stop();
      turn.stop();
      ticker.stop();
    };
  }, [drift, intro, march, spin, stripW]);

  useEffect(() => {
    if (!ready || !held) {
      return;
    }
    Animated.timing(outro, {
      toValue: 1,
      duration: OUTRO_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onDone?.();
      }
    });
  }, [held, onDone, outro, ready]);

  const fade = outro.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  // Texture settles inward as it appears, then turns about its own centre. The
  // patches are circles clipped by borderRadius, so a full revolution leaves
  // the silhouette untouched and only the girih inside moves. `drift` is a
  // linear loop, so 0→360deg wraps without a visible seam.
  const patchStyle = {
    opacity: intro.interpolate({ inputRange: [0, 1], outputRange: [0, 0.78] }),
    transform: [
      { scale: intro.interpolate({ inputRange: [0, 1], outputRange: [1.3, 1] }) },
      {
        rotate: spin.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  const washStyle = {
    opacity: intro.interpolate({ inputRange: [0, 1], outputRange: [0, 0.09] }),
    transform: [
      { scale: intro.interpolate({ inputRange: [0, 1], outputRange: [1.18, 1] }) },
      {
        translateY: drift.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, -26, 0],
        }),
      },
    ],
  };

  // Brand lifts very slightly as the screen dissolves, so it reads as handing
  // the page over rather than blinking out.
  const brandStyle = {
    transform: [
      {
        scale: Animated.multiply(
          intro.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }),
          outro.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }),
        ),
      },
    ],
  };

  const titleStyle = {
    opacity: intro.interpolate({ inputRange: [0.35, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [
      {
        translateY: intro.interpolate({
          inputRange: [0.35, 1],
          outputRange: [18, 0],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const taglineStyle = {
    opacity: intro.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
  };

  // The band rises into place last, then runs in the reading direction: leftward
  // under English, rightward under Arabic. Both ends of the range are a whole
  // strip apart, so either direction loops seamlessly.
  const stripEnter = {
    opacity: intro.interpolate({ inputRange: [0.5, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [
      {
        translateY: intro.interpolate({
          inputRange: [0.5, 1],
          outputRange: [STRIP_H, 0],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const stripRun = {
    transform: [
      {
        translateX: march.interpolate({
          inputRange: [0, 1],
          outputRange: isRTL ? [-stripW, 0] : [0, -stripW],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.root, { opacity: fade }]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={GRADIENT_LOCATIONS}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.18, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* A repeating Image tiles off its own intrinsic size only when given
          explicit dimensions, so the wash is sized from the window. */}
      <Animated.View style={[styles.wash, washStyle]} pointerEvents="none">
        <Image source={PATTERN_GOLD} resizeMode="repeat" style={{ width, height: height + 80 }} />
      </Animated.View>

      <Animated.View style={[styles.patchTop, patchStyle]} pointerEvents="none">
        <Image source={PATTERN_GOLD} resizeMode="repeat" style={styles.patchTopFill} />
      </Animated.View>
      <Animated.View style={[styles.patchSide, patchStyle]} pointerEvents="none">
        <Image source={PATTERN_GOLD} resizeMode="repeat" style={styles.patchSideFill} />
      </Animated.View>

      <View style={styles.center}>
        <Animated.View style={[styles.brand, brandStyle]}>
          <View style={styles.logoRing}>
            <Image source={LOGO} style={styles.logo} resizeMode="cover" />
          </View>
          <Animated.Text style={[styles.title, titleStyle]}>{t('brand.name')}</Animated.Text>
          <Animated.Text style={[styles.tagline, taglineStyle]}>{t('brand.tagline')}</Animated.Text>
        </Animated.View>
      </View>

      {/* `direction: ltr` opts the run out of RTL mirroring: the copies have to
          lie head-to-tail in layout order for the translate to be a lap, and
          which way it travels is decided by the interpolation, not by Yoga. */}
      <Animated.View style={[styles.strip, stripEnter]} pointerEvents="none">
        <Animated.View style={[styles.stripRun, stripRun]}>
          {Array.from({ length: copies }, (_, i) => (
            <Image
              key={i}
              source={STRIP}
              resizeMode="stretch"
              style={{ width: stripW, height: STRIP_H }}
            />
          ))}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.tealDark,
    overflow: 'hidden',
  },
  wash: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    bottom: -40,
  },
  patchTop: {
    position: 'absolute',
    top: -105,
    start: -100,
    width: PATCH_TOP,
    height: PATCH_TOP,
    borderRadius: PATCH_TOP / 2,
    overflow: 'hidden',
  },
  patchTopFill: {
    width: PATCH_TOP,
    height: PATCH_TOP,
  },
  patchSide: {
    position: 'absolute',
    top: 150,
    end: -85,
    width: PATCH_SIDE,
    height: PATCH_SIDE,
    borderRadius: PATCH_SIDE / 2,
    overflow: 'hidden',
  },
  patchSideFill: {
    width: PATCH_SIDE,
    height: PATCH_SIDE,
  },
  strip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: STRIP_H,
    overflow: 'hidden',
    direction: 'ltr',
  },
  stripRun: {
    flexDirection: 'row',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  logoRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 3,
    borderColor: colors.brown,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 102,
    height: 102,
    borderRadius: 51,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 44,
    lineHeight: 64,
    color: colors.white,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: overlay.white90,
    textAlign: 'center',
  },
});
