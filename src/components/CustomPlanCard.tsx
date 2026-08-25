import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { icons } from './icons';
import DashedOutline from './DashedOutline';
import PressScale from './PressScale';
import { colors, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export interface CustomPlanCardProps {
  onPress: () => void;
}

/**
 * The way into the plan builder, offered under the ready-made boxes.
 *
 * The whole card is the control — not a button parked inside it. A card this
 * size reads as pressable on sight, so a tap that lands on the title or the
 * icon and does nothing is read as the app being broken rather than as the
 * customer having missed a target.
 *
 * Dashed rather than filled, like every other "build your own" surface here:
 * it is an invitation to make something, not a product on the shelf.
 */
export default function CustomPlanCard({ onPress }: CustomPlanCardProps) {
  const { t, isRTL } = useLanguage();

  return (
    <PressScale
      onPress={onPress}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={`${t('builder.title')} — ${t('builder.subtitle')}`}
      style={styles.card}
    >
      <DashedOutline />

      <View style={styles.tile}>
        <Icon path={icons.puzzle} size={19} color={colors.teal} strokeWidth={1.8} />
      </View>

      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {t('builder.title')}
        </Text>
        <Text style={styles.sub} numberOfLines={2}>
          {t('builder.subtitle')}
        </Text>
      </View>

      <Icon
        path={isRTL ? icons.chevronLeft : icons.chevronRight}
        size={15}
        color={colors.faint2}
        strokeWidth={2.2}
      />
    </PressScale>
  );
}

const styles = StyleSheet.create({
  // No border of its own: DashedOutline draws the edge, and a solid border
  // under it would show through the gaps in the dashes.
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  tile: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...type.bodyStrong,
    color: colors.ink,
    textAlign: 'auto',
  },
  sub: {
    ...type.caption,
    color: colors.muted2,
    textAlign: 'auto',
  },
});
