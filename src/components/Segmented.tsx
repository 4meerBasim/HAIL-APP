import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Text from './AppText';
import { colors, fonts, radius } from '../theme';

export interface SegmentedProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function Segmented({ label, selected, onPress, style }: SegmentedProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.segment,
        { backgroundColor: selected ? colors.teal : colors.sandChip },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? colors.white : colors.ink },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  segment: {
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
