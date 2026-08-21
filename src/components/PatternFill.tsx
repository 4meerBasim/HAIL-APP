import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { radius } from '../theme';

// Alpha-cut girih, the same tile the login and splash heroes use, so a card
// carries the brand's own ornament rather than a flat wash of colour.
const PATTERN_GOLD = require('../../assets/pattern-arabic-gold.png');

// A repeating Image only tiles when it is given explicit dimensions — percentages
// collapse it to a single stretched tile. So the sheet is drawn oversized and the
// parent clips it, which also means one size covers every card it is dropped into.
const SHEET = 900;

export interface PatternFillProps {
  opacity?: number;
  /** Match the host card's own corner radius. */
  radius?: number;
}

// Drop inside any card, before its content. The sheet clips itself rather than
// asking the card for `overflow: hidden` — on iOS that would clip the card's
// shadow away too.
export default function PatternFill({
  opacity = 0.3,
  radius: corner = radius.xl,
}: PatternFillProps) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity, borderRadius: corner, overflow: 'hidden' }]}
    >
      <Image source={PATTERN_GOLD} resizeMode="repeat" style={styles.sheet} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    width: SHEET,
    height: SHEET,
  },
});
