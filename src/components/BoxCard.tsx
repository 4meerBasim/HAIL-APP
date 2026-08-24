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
import { planRhythm } from '../i18n/planText';
import { type DietBox, boxDaily, formatPrice, groupNumber } from '../data/menu';
import { planFromBox, priceOf } from '../data/plan';

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
  // Priced as the subscription it is, not as one turn of its rotation: the
  // headline is what a default plan on this box actually costs, so the number
  // you tap is the number you land on and the span under it is the span it
  // covers. Same call the box page and Subscribe make, so all three agree.
  const plan = planFromBox(box);
  const pricing = priceOf(plan);
  const price = formatPrice(groupNumber(pricing.total), lang);
  const rhythm = planRhythm(pricing.mealsPerDay, plan.dayCount, t);

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
          <View style={[styles.popular, !feature && styles.popularSolo, shadow.card]}>
            <Icon
              path={icons.star}
              size={10}
              color={colors.gold}
              fill={colors.gold}
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

        {/* The card carries no heading over these figures, so the block has to
            say what it covers itself — a calorie count read as one meal's when
            it is the day's is the whole reason the box looks wrong. */}
        <MacroRow macros={boxDaily(box)} size="sm" fullDay />

        <View style={styles.price}>
          <PricePill value={price} size={feature ? 'md' : 'sm'} />
          <Text style={styles.perMeal} numberOfLines={2}>
            {rhythm}
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
  // White on the photo rather than gold-on-gold with a gold outline: the badge
  // had three golds stacked on it and read as a sticker. The star carries the
  // colour; the pill just lifts it off the picture.
  popular: {
    position: 'absolute',
    top: spacing.lg,
    end: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 24,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
  },
  // With no label there is nothing to pad: a circle, not a squashed pill.
  popularSolo: {
    width: 24,
    paddingHorizontal: 0,
  },
  popularText: {
    fontFamily: fonts.bold,
    fontSize: 11,
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
