import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts, localFont } from '../theme';
import { formatNumber } from '../i18n/digits';
import { useLanguage } from '../i18n/LanguageContext';

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
// Each face's own cap height, read off the font: OS/2 sCapHeight / 1000 upem.
const CAP = { en: 0.745, ar: 0.698 } as const;
// Widest digit advance per face, from the same files.
const DIGIT = { en: 0.71, ar: 0.6 } as const;
const SIDE = 5.5; // padding either side of the digits before the pill grows
const MAX = 99;

// Coral rather than gold: gold is the commit colour, worn by every subscribe
// and add-to-cart button in the app, and a count is not a call to action. Coral
// is the app's own alert colour, it is nowhere near the teal it sits on, and it
// takes white type at better contrast than gold ever did.
//
// Drawn rather than laid out. A React Native <Text> is positioned by its line
// box, and the font's box is far taller than its digits — so the digit
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
  const { lang } = useLanguage();
  if (count <= 0) return null;

  const label = count > MAX ? `${formatNumber(MAX)}+` : formatNumber(count);
  // The pill only grows once the
  // count outgrows the circle.
  const width = Math.max(H, Math.ceil(label.length * FONT * DIGIT[lang] + SIDE * 2));

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
          y={H / 2 + (CAP[lang] * FONT) / 2}
          fontFamily={localFont(fonts.bold, lang)}
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
