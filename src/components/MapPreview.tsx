import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, radius } from '../theme';

export interface MapPreviewProps {
  height?: number;
  style?: StyleProp<ViewStyle>;
}

// A drawn map, not a live one. The cart needs to say "here is where this is
// going", which a picture answers as well as a tile server does — and it costs
// no network, no key and no wait on a screen the customer is trying to leave.
// Tapping it is what opens the real map.
export default function MapPreview({ height = 132, style }: MapPreviewProps) {
  return (
    <View style={[styles.map, { height }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 320 132">
        <Rect x={0} y={0} width={320} height={132} fill={colors.mapBg} />

        {/* Blocks and a river bend: enough shape to read as a city without
            pretending to be this city. */}
        <Rect x={18} y={14} width={86} height={44} rx={6} fill={colors.mapShape1} />
        <Rect x={214} y={10} width={90} height={38} rx={6} fill={colors.mapShape1} />
        <Rect x={30} y={82} width={70} height={38} rx={6} fill={colors.mapShape2} />
        <Rect x={196} y={74} width={104} height={46} rx={6} fill={colors.mapShape1} />
        <Path
          d="M0 70 C 60 58, 96 92, 150 78 S 250 52, 320 66"
          stroke={colors.mapShape2}
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M118 0 L 132 132"
          stroke={colors.cream}
          strokeWidth={9}
          fill="none"
          opacity={0.7}
        />

        {/* The pin sits where the eye lands, not where the data says. */}
        <Circle cx={160} cy={66} r={22} fill={colors.teal} opacity={0.16} />
        <Path
          d="M160 46a11 11 0 0 1 11 11c0 8-11 19-11 19s-11-11-11-19a11 11 0 0 1 11-11z"
          fill={colors.teal}
        />
        <Circle cx={160} cy={57} r={4} fill={colors.white} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.mapBg,
  },
});
