import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, radius as radii } from '../theme';

interface Props {
  color?: string;
  thickness?: number;
  radius?: number;
  /** [dash, gap] in points. */
  dash?: [number, number];
}

// A dashed rounded outline, drawn rather than bordered. `borderStyle: 'dashed'`
// combined with a `borderRadius` is unsupported in React Native — it warns
// "Unsupported dashed / dotted border style" and falls back to a solid border,
// which loses the dashed affordance that marks a card as "build your own".
//
// Absolutely positioned so it traces the parent's box without taking part in
// layout; the parent keeps its own `borderRadius` for the background fill and
// simply drops its border props.
export default function DashedOutline({
  color = colors.teal,
  thickness = 1.5,
  radius = radii.lg,
  dash = [6, 5],
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  // Inset by half the stroke: SVG centres a stroke on the path, so a rect on
  // the exact bounds would clip its outer half at every edge.
  const inset = thickness / 2;

  return (
    <View onLayout={onLayout} style={StyleSheet.absoluteFill} pointerEvents="none">
      {size.width > 0 && size.height > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Rect
            x={inset}
            y={inset}
            width={Math.max(0, size.width - thickness)}
            height={Math.max(0, size.height - thickness)}
            rx={Math.max(0, radius - inset)}
            ry={Math.max(0, radius - inset)}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={dash}
          />
        </Svg>
      ) : null}
    </View>
  );
}
