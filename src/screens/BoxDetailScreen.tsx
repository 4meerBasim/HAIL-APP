import React, { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import MealRow from '../components/MealRow';
import MacroRow from '../components/MacroRow';
import { colors, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { toArabicDigits } from '../i18n/digits';
import { useAuth } from '../state/AuthContext';
import { usePlan } from '../state/PlanContext';
import { type BoxGoal, boxDaily, formatPrice, getBox, groupNumber } from '../data/menu';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const SCRIM = [scrim.heroFade, scrim.hero] as const;

export default function BoxDetailScreen({ route, navigation }: RootStackScreenProps<'BoxDetail'>) {
  const { id } = route.params;
  const { t, lang, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { targets } = useAuth();
  const { plan, meals, pricing, dailyMacros, startFromBox } = usePlan();

  const box = getBox(id);

  // Landing here directly (deep link, back-nav) without the plan seeded.
  useEffect(() => {
    if (box && plan.boxId !== box.id) startFromBox(box.id as BoxGoal);
  }, [box, plan.boxId, startFromBox]);

  if (!box) {
    return (
      <Screen>
        <View />
      </Screen>
    );
  }

  const accent = colors[box.accent];
  const name = t(`box.${box.id}.name`);
  const daily = plan.dishIds.length > 0 ? dailyMacros : boxDaily(box);

  return (
    <Screen scroll={false} edges={['bottom', 'left', 'right']}>
      <View style={styles.hero}>
        <Image source={{ uri: box.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={SCRIM} locations={[0.3, 1]} style={StyleSheet.absoluteFill} />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={[styles.backBtn, { top: insets.top + 12 }]}
        >
          <Icon
            path={isRTL ? icons.chevronRight : icons.chevronLeft}
            size={14}
            color={colors.ink}
            strokeWidth={2.4}
          />
        </TouchableOpacity>

        <View style={styles.heroFoot}>
          <View style={[styles.heroTile, { backgroundColor: colors[box.tint] }]}>
            <Icon path={icons[box.icon]} size={22} color={accent} strokeWidth={1.9} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTag} numberOfLines={1}>
              {t(`box.${box.id}.tag`)}
            </Text>
            <Text style={styles.heroName} numberOfLines={2}>
              {name}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sheet}>
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.desc}>{t(`box.${box.id}.desc`)}</Text>

          <View style={styles.group}>
            <Text style={styles.groupLabel}>{t('planMacros.perDay')}</Text>
            <Card padding={spacing.xl} style={styles.macroCard}>
              <View style={styles.kcalRow}>
                <Text style={[styles.kcal, { color: accent }]}>
                  {toArabicDigits(daily.calories, lang)}
                </Text>
                <Text style={styles.kcalUnit}>{t('plan.kcalDay')}</Text>
              </View>
              <MacroRow macros={daily} target={targets ?? undefined} />
            </Card>
          </View>

          <View style={styles.group}>
            <Text style={styles.groupLabel}>{t('box.detail.inside')}</Text>
            <View style={styles.meals}>
              {meals.map((meal) => (
                <MealRow
                  key={meal.dishId}
                  meal={meal}
                  onPress={() => navigation.navigate('MealCustomize', { dishId: meal.dishId })}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PlanMacros')}
            accessibilityRole="button"
            accessibilityLabel={t('planMacros.title')}
            style={styles.tune}
          >
            <View style={styles.tuneTile}>
              <Icon path={icons.sliders} size={19} color={colors.tealText} strokeWidth={1.9} />
            </View>
            <View style={styles.tuneText}>
              <Text style={styles.tuneLabel}>{t('planMacros.title')}</Text>
              <Text style={styles.tuneSub}>{t('planMacros.subtitle')}</Text>
            </View>
            <Icon
              path={isRTL ? icons.chevronLeft : icons.chevronRight}
              size={15}
              color={colors.faint2}
              strokeWidth={2.2}
            />
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('box.detail.from')}</Text>
            <View style={styles.priceValue}>
              <Text style={[styles.price, { color: accent }]}>
                {formatPrice(groupNumber(pricing.perMealAvg), lang)}
              </Text>
              <Text style={styles.perMeal}>{t('box.detail.perMeal')}</Text>
            </View>
          </View>
          <Button
            label={t('box.detail.subscribe')}
            variant="primary"
            size="lg"
            full
            color={accent}
            onPress={() => navigation.navigate('Subscribe')}
            style={shadow.teal}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 270,
    flexShrink: 0,
    backgroundColor: colors.tealDark,
  },
  backBtn: {
    position: 'absolute',
    start: spacing.xxxl,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  heroFoot: {
    position: 'absolute',
    start: spacing.huge,
    end: spacing.huge,
    bottom: spacing.giant + spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  heroTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  heroTag: {
    ...type.captionStrong,
    color: colors.amber,
  },
  heroName: {
    ...type.h1,
    color: colors.white,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.sheet2,
    borderTopRightRadius: radius.sheet2,
    marginTop: -24,
    ...shadow.sheet,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.huge,
    paddingBottom: spacing.huge,
    gap: spacing.giant,
  },
  desc: {
    ...type.body,
    fontSize: 13,
    lineHeight: 24,
    color: colors.body,
  },
  group: {
    gap: spacing.md,
  },
  groupLabel: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  macroCard: {
    gap: spacing.xl,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  kcal: {
    ...type.h1,
  },
  kcalUnit: {
    ...type.caption,
    color: colors.muted2,
  },
  meals: {
    gap: spacing.lg,
  },
  tune: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: colors.sandChip,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  tuneTile: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.healthyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tuneText: {
    flex: 1,
    gap: 1,
  },
  tuneLabel: {
    ...type.title,
    color: colors.ink,
  },
  tuneSub: {
    ...type.caption,
    color: colors.muted2,
  },
  footer: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.sand,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  priceLabel: {
    ...type.caption,
    color: colors.muted,
  },
  priceValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  price: {
    ...type.h2,
  },
  perMeal: {
    ...type.caption,
    color: colors.muted2,
  },
});
