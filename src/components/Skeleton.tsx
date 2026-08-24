import React from 'react';
import { Animated, DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { usePulseLoop } from '../animation';
import { colors, radius, shadow, spacing } from '../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  /** Corner radius; defaults to the pill used for text-sized blocks. */
  round?: number;
  style?: StyleProp<ViewStyle>;
}

// A placeholder that breathes on the app's own pulse — the same loop the live
// dot runs on, so nothing on screen is timing to a different clock. Sand rather
// than grey: the page is cream, and a neutral grey block reads as a hole in it.
export default function Skeleton({ width = '100%', height = 12, round, style }: SkeletonProps) {
  const anim = usePulseLoop();
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.block,
        { width, height, borderRadius: round ?? Math.min(height / 2, radius.sm) },
        { opacity },
        style,
      ]}
    />
  );
}

export interface SkeletonCardProps {
  /** Roughly how tall the real card is, so the page does not jump when it lands. */
  height?: number;
  style?: StyleProp<ViewStyle>;
}

// The shape of a hero card — the subscription panel on Orders, the promo on
// Plans — while the stored plan is still coming back from storage.
export function SkeletonCard({ height = 132, style }: SkeletonCardProps) {
  return (
    <View style={[styles.card, shadow.card, { height }, style]}>
      <View style={styles.cardHead}>
        <Skeleton width={38} height={38} round={radius.sm} />
        <View style={styles.cardHeadText}>
          <Skeleton width="55%" height={13} />
          <Skeleton width="35%" height={10} />
        </View>
      </View>
      <Skeleton width="100%" height={8} round={radius.pill} />
      <Skeleton width="70%" height={10} />
    </View>
  );
}

export interface SkeletonRowsProps {
  count?: number;
  style?: StyleProp<ViewStyle>;
}

// One block per list row: a delivery day, a saved card, an order in the
// archive. The count is the number of rows the real list usually opens with,
// so the placeholder occupies the space the content is about to.
export function SkeletonRows({ count = 3, style }: SkeletonRowsProps) {
  return (
    <View style={[styles.rows, style]}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.row, shadow.card]}>
          <Skeleton width={52} height={34} round={radius.sm} />
          <View style={styles.rowText}>
            <Skeleton width="65%" height={12} />
            <Skeleton width="40%" height={10} />
          </View>
          <Skeleton width={34} height={34} round={radius.pill} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.sand,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.sand,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxl,
    justifyContent: 'space-between',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  cardHeadText: {
    flex: 1,
    gap: spacing.md,
  },
  rows: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  rowText: {
    flex: 1,
    gap: spacing.md,
  },
});
