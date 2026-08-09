import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';
import type { IconPath } from './icons';

export interface IconProps {
  path: IconPath;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  viewBox?: string;
}

export default function Icon({
  path,
  size = 24,
  color = colors.ink,
  strokeWidth = 2,
  fill = 'none',
  viewBox = '0 0 24 24',
}: IconProps) {
  const paths = typeof path === 'string' ? [path] : path;
  return (
    <Svg width={size} height={size} viewBox={viewBox} fill="none">
      {paths.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          fill={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
