import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Chip from '../components/Chip';
import Hero from '../components/Hero';
import Button from '../components/Button';
import MealRow from '../components/MealRow';
import MacroRow from '../components/MacroRow';
import PricePill from '../components/PricePill';
import { colors, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { cycleNoteKey, rotationDays, usePlan } from '../state/PlanContext';
import {
  type BoxGoal,
  boxDaily,
  boxPerMeal,
  boxTotal,
  formatPrice,
  getBox,
  groupNumber,
  slotLabel,
} from '../data/menu';
import type { RootStackScreenProps } from '../navigation/RootNavigator';


export default function BoxDetailScreen({ route, navigation }: RootStackScreenProps<'BoxDetail'>) {
  const { id } = route.params;
  const { t, lang, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { plan, meals, pricing, dailyMacros, startFromBox } = usePlan();
  const [day, setDay] = useState(0);

  const box = getBox(id);

  // Landing here directly (deep link, back-nav) without the plan seeded.
  useEffect(() => {
    if (box && plan.boxId !== box.id) startFromBox(box.id as BoxGoal);
  }, [box, plan.boxId, startFromBox]);

  if (!box) {
    return (
      <Screen texture>
        <View />
      </Screen>
    );
  }

  const accent = colors[box.accent];
  const name = t(`box.${box.id}.name`);
  const seeded = plan.boxId === box.id && plan.dishIds.length > 0;
  const daily = seeded ? dailyMacros : boxDaily(box);
  // The headline is the sum of the very meals listed above it, so the footer can
  // be checked against the list by eye. Once the plan is seeded from this box
  // both sides are the same figures anyway; tuning the rotation moves both.
  const mealCount = seeded ? meals.length : box.dishes.length;
  const total = seeded ? meals.reduce((sum, m) => sum + m.price, 0) : boxTotal(box);
  const perMeal = seeded ? pricing.perMeal : boxPerMeal(box);
  // The rotation broken into days, shown one day at a time: six cards in a row
  // is a pile of dishes, three under a day tab is a schedule.
  const days = rotationDays(plan, meals);
  const activeDay = Math.min(day, Math.max(0, days.length - 1));
  const cycleNote = t(cycleNoteKey(days.length)).replace('{n}', formatNumber(days.length));

  return (
    <Screen scroll={false} edges={['bottom', 'left', 'right']} texture>
      <Hero source={box.image} scrim style={styles.hero}>
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
      </Hero>

      <View style={styles.sheet}>
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.desc}>{t(`box.${box.id}.desc`)}</Text>

          <View style={styles.group}>
            <Text style={styles.groupLabel}>{t('planMacros.perDay')}</Text>
            <Card padding={spacing.xl}>
              <MacroRow macros={daily} />
            </Card>
          </View>

          <View style={styles.group}>
            <Text style={styles.groupLabel}>{t('box.detail.inside')}</Text>

            {days.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayTabs}
              >
                {days.map((_, i) => (
                  <Chip
                    key={`day-${i}`}
                    label={t('rotation.day').replace('{n}', formatNumber(i + 1))}
                    selected={i === activeDay}
                    onPress={() => setDay(i)}
                    accent={accent}
                  />
                ))}
              </ScrollView>
            ) : null}

            {days.length > 0 ? <Text style={styles.cycle}>{cycleNote}</Text> : null}

            <View style={styles.meals}>
              {(days[activeDay] ?? []).map((meal, slotIndex) => {
                const slot = plan.mealSlots[slotIndex];
                return (
                  <View key={meal.dishId} style={styles.slot}>
                    {slot ? (
                      <View style={styles.slotHead}>
                        <Icon
                          path={icons[slot.icon]}
                          size={13}
                          color={colors.muted2}
                          strokeWidth={2}
                        />
                        <Text style={styles.slotLabel}>{slotLabel(slot, t)}</Text>
                      </View>
                    ) : null}
                    <MealRow
                      meal={meal}
                      onPress={() => navigation.navigate('DishDetail', { id: meal.dishId })}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PlanBuilder', { boxId: box.id })}
            accessibilityRole="button"
            accessibilityLabel={t('box.detail.tune')}
            style={styles.tune}
          >
            <View style={styles.tuneTile}>
              <Icon path={icons.puzzle} size={19} color={colors.tealText} strokeWidth={1.9} />
            </View>
            <View style={styles.tuneText}>
              <Text style={styles.tuneLabel}>{t('box.detail.tune')}</Text>
              <Text style={styles.tuneSub}>{t('box.detail.tuneSub')}</Text>
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
            <View style={styles.priceText}>
              <Text style={styles.priceLabel}>{t('box.detail.total')}</Text>
              <Text style={styles.priceMeta} numberOfLines={2}>
                {`${formatNumber(mealCount)} ${t('plan.mealsUnit')} · ${t(
                  'boxes.avgPerMeal',
                ).replace('{p}', formatPrice(groupNumber(perMeal), lang))}`}
              </Text>
            </View>
            <PricePill value={formatPrice(groupNumber(total), lang)} />
          </View>
          <Button
            label={t('box.detail.subscribe')}
            variant="primary"
            size="lg"
            full
            onPress={() => navigation.navigate('Subscribe')}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    // Height is the photo's own, set by Hero — only the fallback colour is
    // ours, for the moment before the image decodes.
    backgroundColor: colors.tealDark,
  },
  backBtn: {
    position: 'absolute',
    start: spacing.xxxl,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
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
    color: colors.goldLight,
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
    color: colors.body,
  },
  group: {
    gap: spacing.md,
  },
  groupLabel: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  meals: {
    gap: spacing.lg,
  },
  dayTabs: {
    gap: spacing.md,
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  cycle: {
    ...type.caption,
    color: colors.muted2,
    paddingBottom: spacing.xs,
  },
  slot: {
    gap: spacing.sm,
  },
  slotHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  slotLabel: {
    ...type.captionStrong,
    color: colors.muted2,
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
    backgroundColor: colors.tile,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  priceText: {
    flex: 1,
    gap: 1,
  },
  priceLabel: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  priceMeta: {
    ...type.caption,
    color: colors.muted,
  },
});
