import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { formatNumber } from '../i18n/digits';

export interface BadgeProps {
  count: number;
  /** The surface underneath — the ring is what lifts the badge off the icon. */
  ringColor?: string;
  fill?: string;
  ink?: string;
  style?: StyleProp<ViewStyle>;
}

const H = 20;
const FONT = 11.5;
// Cairo's own cap height, read off the font: OS/2 sCapHeight 700 / 1000 upem.
const CAP = 0.7;
const SIDE = 5.5; // padding either side of the digits before the pill grows
const MAX = 99;

// Coral rather than gold: gold is the commit colour, worn by every subscribe
// and add-to-cart button in the app, and a count is not a call to action. Coral
// is the app's own alert colour, it is nowhere near the teal it sits on, and it
// takes white type at better contrast than gold ever did.
//
// Drawn rather than laid out. A React Native <Text> is positioned by its line
// box, and this font's box is 1.874em tall against a 0.7em digit — so the digit
// sits wherever the ascent leaves it, and every lineHeight that fixes one size
// breaks another. Here the baseline is placed at the circle's centre plus half
// a cap height, which is the definition of a vertically centred digit and holds
// at any size or weight.
export default function Badge({
  count,
  ringColor = colors.white,
  fill = colors.coral,
  ink = colors.white,
  style,
}: BadgeProps) {
  if (count <= 0) return null;

  const label = count > MAX ? `${formatNumber(MAX)}+` : formatNumber(count);
  // Cairo's digits are near tabular at ~0.56em; the pill only grows once the
  // count outgrows the circle.
  const width = Math.max(H, Math.ceil(label.length * FONT * 0.56 + SIDE * 2));

  return (
    <View style={[styles.wrap, { width, height: H }, style]}>
      <Svg width={width} height={H}>
        <Rect
          x={0.9}
          y={0.9}
          width={width - 1.8}
          height={H - 1.8}
          rx={(H - 1.8) / 2}
          fill={fill}
          stroke={ringColor}
          strokeWidth={1.8}
        />
        <SvgText
          x={width / 2}
          y={H / 2 + (CAP * FONT) / 2}
          fontFamily={fonts.bold}
          fontSize={FONT}
          fill={ink}
          textAnchor="middle"
        >
          {label}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: -5,
    end: -6,
    borderRadius: H / 2,
  },
});
