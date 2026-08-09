import React from 'react';
import { Image, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from './AppText';
import MacroRow from './MacroRow';
import Icon from './Icon';
import { icons } from './icons';
import { colors, fonts, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { BOX_REFERENCE_MEALS, DietBox, boxDaily, formatPrice, groupNumber } from '../data/menu';
import { mealPrice, scaleMacros } from '../data/nutrition';

const SCRIM = [scrim.heroFade, scrim.hero] as const;

export interface BoxCardProps {
  box: DietBox;
  onPress: () => void;
  variant?: 'feature' | 'grid';
  style?: StyleProp<ViewStyle>;
}

export default function BoxCard({ box, onPress, variant = 'grid', style }: BoxCardProps) {
  const { t, lang } = useLanguage();
  const feature = variant === 'feature';
  const accent = colors[box.accent];
  const tint = colors[box.tint];
  const name = t(`box.${box.id}.name`);
  const daily = boxDaily(box);
  const from = mealPrice(scaleMacros(daily, 1 / BOX_REFERENCE_MEALS));

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={[styles.card, shadow.card, feature ? styles.feature : styles.grid, style]}
    >
      <View style={{ height: feature ? 132 : 104 }}>
        <Image source={{ uri: box.image }} style={styles.image} resizeMode="cover" />
        <LinearGradient colors={SCRIM} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />

        <View style={[styles.iconBadge, { backgroundColor: tint }]}>
          <Icon path={icons[box.icon]} size={18} color={accent} strokeWidth={1.9} />
        </View>

        {box.popular ? (
          <View style={styles.popular}>
            <Icon
              path={icons.star}
              size={10}
              color={colors.amberText}
              fill={colors.amberText}
              strokeWidth={1.6}
            />
            {feature ? <Text style={styles.popularText}>{t('boxes.popular')}</Text> : null}
          </View>
        ) : null}

        <Text style={[styles.name, feature && styles.nameFeature]} numberOfLines={1}>
          {name}
        </Text>
      </View>

      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.body}>
        <Text style={styles.tagline} numberOfLines={1}>
          {t(`box.${box.id}.tag`)}
        </Text>

        <MacroRow macros={daily} size="sm" />

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: accent }]}>
            {formatPrice(groupNumber(from), lang)}
          </Text>
          <Text style={styles.perMeal}>{t('boxes.perMeal')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  feature: {
    width: '100%',
  },
  grid: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.sand,
  },
  iconBadge: {
    position: 'absolute',
    top: 8,
    start: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popular: {
    position: 'absolute',
    top: 11,
    end: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.amber,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  popularText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.amberText,
  },
  name: {
    position: 'absolute',
    bottom: 9,
    start: 12,
    end: 12,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },
  nameFeature: {
    fontSize: 17,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  tagline: {
    ...type.caption,
    fontSize: 11,
    color: colors.muted2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  price: {
    ...type.h3,
    fontSize: 14,
  },
  perMeal: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.muted2,
  },
});
