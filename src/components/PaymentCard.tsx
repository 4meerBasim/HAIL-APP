import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from './AppText';
import { colors, fonts, overlay, radius, shadow, spacing } from '../theme';
import { type CardBrand, PLACEHOLDER, cardFace, cvvLength } from '../data/card';

export type CardField = 'number' | 'holder' | 'expiry' | 'cvv';

export interface PaymentCardProps {
  digits: string;
  holder: string;
  expiry: string; // raw MMYY
  cvv: string;
  brand: CardBrand;
  focused: CardField | null;
}

const MEDALLION = require('../../assets/girih-medallion.png');

// One palette per brand so the whole card answers the first digit you type, not
// just a logo in the corner.
const FACES: Record<CardBrand, readonly [string, string]> = {
  visa: [colors.tealDarker, colors.tealMid],
  mastercard: ['#3f2a12', colors.brown],
  amex: ['#0b4a63', '#1c7f9e'],
  unknown: [colors.tealDarker, colors.tealDark],
};

const BRAND_MARK: Record<CardBrand, string> = {
  visa: 'VISA',
  mastercard: 'Mastercard',
  amex: 'AMEX',
  unknown: 'هيل',
};

// A single glyph on the card face. It owns its own animation and re-runs it
// whenever its character changes, which is what makes the model respond to each
// keystroke rather than to the field as a whole — the line never re-lays out,
// one slot just turns over.
function Glyph({ char, size, fixed = false }: { char: string; size: number; fixed?: boolean }) {
  const anim = useRef(new Animated.Value(1)).current;
  const previous = useRef(char);

  useEffect(() => {
    if (previous.current === char) return;
    previous.current = char;
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [char, anim]);

  if (char === ' ') return <View style={{ width: size * 0.42 }} />;

  const blank = char === PLACEHOLDER;

  return (
    <Animated.Text
      style={[
        styles.glyph,
        {
          fontSize: size,
          lineHeight: size * 1.34,
          // Digits get a fixed slot so a 4 replacing a # does not nudge every
          // character after it along the line. Letters do not — a name set on a
          // digit grid reads like a ransom note.
          width: fixed ? size * 0.66 : undefined,
          color: blank ? overlay.white30 : colors.white,
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.7, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
          ],
        },
      ]}
    >
      {char}
    </Animated.Text>
  );
}

// The soft frame that follows the field being edited. One per field rather than
// a single box that measures and moves: measuring on every keystroke is the
// expensive, jumpy way to do it, and a fade reads as well as a slide here.
function Focus({ on, style }: { on: boolean; style: object }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: on ? 1 : 0,
      duration: 190,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [on, anim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.focus,
        style,
        {
          opacity: anim,
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }],
        },
      ]}
    />
  );
}

export default function PaymentCard({
  digits,
  holder,
  expiry,
  cvv,
  brand,
  focused,
}: PaymentCardProps) {
  const flip = useRef(new Animated.Value(0)).current;
  const flipped = focused === 'cvv';

  useEffect(() => {
    Animated.spring(flip, {
      toValue: flipped ? 1 : 0,
      friction: 9,
      tension: 55,
      useNativeDriver: true,
    }).start();
  }, [flipped, flip]);

  const face = cardFace(digits, brand);
  const name = (holder.trim() || 'FULL NAME').toUpperCase().slice(0, 22);
  const mm = expiry.slice(0, 2).padEnd(2, PLACEHOLDER);
  const yy = expiry.slice(2, 4).padEnd(2, PLACEHOLDER);
  const code = cvv.padEnd(cvvLength(brand), PLACEHOLDER);

  // Both faces are always mounted and counter-rotated; opacity swaps them at
  // the halfway point because backfaceVisibility is not dependable across both
  // platforms, and a face bleeding through the other is worse than a hard cut
  // at the one frame the card is edge-on.
  const front = {
    opacity: flip.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [1, 1, 0, 0] }),
    transform: [
      { perspective: 1200 },
      { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) },
    ],
  };

  const back = {
    opacity: flip.interpolate({ inputRange: [0, 0.499, 0.5, 1], outputRange: [0, 0, 1, 1] }),
    transform: [
      { perspective: 1200 },
      { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }) },
    ],
  };

  return (
    // `direction: ltr` — a card number reads left to right on the plastic no
    // matter what language the app is in, and a row would otherwise mirror.
    <View style={styles.stage}>
      <Animated.View style={[styles.card, shadow.raised, front]}>
        <LinearGradient
          colors={FACES[brand]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Image source={MEDALLION} style={styles.watermark} resizeMode="contain" />

        <View style={styles.faceTop}>
          <View style={styles.chip}>
            <View style={styles.chipLine} />
            <View style={styles.chipLine} />
          </View>
          <Text style={styles.brand} numberOfLines={1}>
            {BRAND_MARK[brand]}
          </Text>
        </View>

        <View style={styles.numberRow}>
          <Focus on={focused === 'number'} style={styles.focusNumber} />
          {face.map((char, i) => (
            <Glyph key={i} char={char} size={21} fixed />
          ))}
        </View>

        <View style={styles.faceFoot}>
          <View style={styles.holderBlock}>
            <Focus on={focused === 'holder'} style={styles.focusHolder} />
            <Text style={styles.fieldLabel}>CARD HOLDER</Text>
            <View style={styles.glyphRow}>
              {name.split('').map((char, i) => (
                <Glyph key={i} char={char} size={13} />
              ))}
            </View>
          </View>

          <View style={styles.expiryBlock}>
            <Focus on={focused === 'expiry'} style={styles.focusExpiry} />
            <Text style={styles.fieldLabel}>EXPIRES</Text>
            <View style={styles.glyphRow}>
              <Glyph char={mm[0]} size={13} fixed />
              <Glyph char={mm[1]} size={13} fixed />
              <Text style={styles.slash}>/</Text>
              <Glyph char={yy[0]} size={13} fixed />
              <Glyph char={yy[1]} size={13} fixed />
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.card, styles.cardBack, shadow.raised, back]}>
        <LinearGradient
          colors={FACES[brand]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.stripe} />
        <View style={styles.signature}>
          <View style={styles.signatureBar} />
          <View style={styles.cvvBox}>
            {code.split('').map((char, i) => (
              <Glyph key={i} char={char} size={15} fixed />
            ))}
          </View>
        </View>
        <Text style={styles.backNote}>CVV</Text>
      </Animated.View>
    </View>
  );
}

const CARD_H = 208;

const styles = StyleSheet.create({
  stage: {
    height: CARD_H,
    direction: 'ltr',
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    padding: spacing.huge,
    justifyContent: 'space-between',
    backgroundColor: colors.tealDark,
  },
  cardBack: {
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    paddingTop: spacing.giant,
  },
  watermark: {
    position: 'absolute',
    width: 190,
    height: 190,
    right: -52,
    bottom: -54,
    opacity: 0.12,
  },
  faceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    width: 42,
    height: 32,
    borderRadius: 7,
    backgroundColor: colors.goldLight,
    borderWidth: 1,
    borderColor: colors.gold,
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  chipLine: {
    height: 1.5,
    backgroundColor: overlay.white70,
    borderRadius: 1,
  },
  brand: {
    fontFamily: fonts.heavy,
    fontSize: 17,
    letterSpacing: 1.2,
    color: colors.white,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glyphRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  glyph: {
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  faceFoot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  holderBlock: {
    flexShrink: 1,
  },
  expiryBlock: {
    alignItems: 'flex-start',
  },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 8.5,
    letterSpacing: 1.1,
    color: overlay.white70,
    marginBottom: 2,
  },
  slash: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 17.4,
    color: overlay.white70,
    paddingHorizontal: 1,
  },
  focus: {
    position: 'absolute',
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: overlay.white30,
    backgroundColor: overlay.white08,
  },
  focusNumber: {
    top: -9,
    bottom: -9,
    left: -10,
    right: -10,
  },
  focusHolder: {
    top: -7,
    bottom: -6,
    left: -9,
    right: -9,
  },
  focusExpiry: {
    top: -7,
    bottom: -6,
    left: -9,
    right: -9,
  },
  stripe: {
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  signature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.giant,
    marginHorizontal: spacing.huge,
  },
  signatureBar: {
    flex: 1,
    height: 34,
    borderRadius: 5,
    backgroundColor: overlay.white80,
  },
  cvvBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 58,
    height: 34,
    paddingHorizontal: spacing.lg,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
  },
  backNote: {
    fontFamily: fonts.semibold,
    fontSize: 8.5,
    letterSpacing: 1.1,
    color: overlay.white70,
    marginTop: spacing.md,
    marginHorizontal: spacing.huge,
    textAlign: 'right',
  },
});
