import React from 'react';
import { Image, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from './AppText';
import MacroRow from './MacroRow';
import PricePill from './PricePill';
import Icon from './Icon';
import { icons } from './icons';
import { colors, fonts, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import {
  type DietBox,
  boxDaily,
  boxPerMeal,
  boxTotal,
  formatPrice,
  groupNumber,
} from '../data/menu';

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
  // The same two figures the box's own footer leads with, in the same order.
  // Leading with the per-meal rate here and the total in there meant the number
  // you tapped was never the number you landed on.
  const price = formatPrice(groupNumber(boxTotal(box)), lang);
  const perMeal = t('boxes.avgPerMeal').replace(
    '{p}',
    formatPrice(groupNumber(boxPerMeal(box)), lang),
  );

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={[styles.card, shadow.lifted, feature ? styles.feature : styles.grid, style]}
    >
      <View style={{ height: feature ? 132 : 104 }}>
        <Image source={box.image} style={styles.image} resizeMode="cover" />
        <LinearGradient colors={SCRIM} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />

        <View style={[styles.iconBadge, { backgroundColor: tint }]}>
          <Icon path={icons[box.icon]} size={18} color={accent} strokeWidth={1.9} />
        </View>

        {box.popular ? (
          <View style={styles.popular}>
            <Icon
              path={icons.star}
              size={10}
              color={colors.goldText}
              fill={colors.goldText}
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

        <MacroRow macros={boxDaily(box)} size="sm" />

        <View style={styles.price}>
          <PricePill value={price} size={feature ? 'md' : 'sm'} />
          <Text style={styles.perMeal} numberOfLines={2}>
            {`${formatNumber(box.dishes.length)} ${t('plan.mealsUnit')} · ${perMeal}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.sand,
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
    backgroundColor: colors.goldLight,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  popularText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: colors.goldText,
  },
  name: {
    position: 'absolute',
    bottom: 9,
    start: 12,
    end: 12,
    fontFamily: fonts.bold,
    fontSize: 15.5,
    color: colors.white,
  },
  nameFeature: {
    fontSize: 19,
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
    fontSize: 12.5,
    color: colors.muted,
  },
  price: {
    gap: 5,
  },
  perMeal: {
    ...type.micro,
    color: colors.muted2,
  },
});
