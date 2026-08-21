import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { colors } from '../theme';

interface Props {
  color?: string;
  thickness?: number;
  /** [dash, gap] in points. */
  dash?: [number, number];
}

// A dashed horizontal rule. React Native only honours `borderStyle: 'dashed'`
// when all four borders are uniform, so a single-side `borderTopWidth` with a
// dashed style logs "Unsupported dashed / dotted border style" and silently
// paints solid. Drawing the rule keeps the design and keeps the console clean.
export default function DashedRule({
  color = colors.sand,
  thickness = 1,
  dash = [4, 4],
}: Props) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    setWidth((prev) => (prev === next ? prev : next));
  };

  return (
    <View onLayout={onLayout} style={{ height: thickness, width: '100%' }}>
      {width > 0 ? (
        <Svg width={width} height={thickness}>
          <Line
            x1={0}
            y1={thickness / 2}
            x2={width}
            y2={thickness / 2}
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={dash}
          />
        </Svg>
      ) : null}
    </View>
  );
}
