import React, { useEffect, useMemo, useState } from 'react';
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
import { planRhythm } from '../i18n/planText';
import { cycleNoteKey, rotationDays, usePlan } from '../state/PlanContext';
import { useAuth } from '../state/AuthContext';
import { planFromBox, priceOf, rotationDaySlots } from '../data/plan';
import {
  type BoxGoal,
  boxDaily,
  formatPrice,
  formatTime,
  getBox,
  groupNumber,
  slotLabel,
} from '../data/menu';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

export default function BoxDetailScreen({ route, navigation }: RootStackScreenProps<'BoxDetail'>) {
  const { id } = route.params;
  const { t, lang, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { plan, meals, pricing, startFromBox } = usePlan();
  const { status } = useAuth();
  const [day, setDay] = useState(0);

  const box = getBox(id);

  // Landing here directly (deep link, back-nav) without the plan seeded.
  useEffect(() => {
    if (box && plan.boxId !== box.id) startFromBox(box.id as BoxGoal);
  }, [box, plan.boxId, startFromBox]);

  // The headline is the whole subscription, not one turn of the rotation listed
  // below it: the line under it names a span, and a rotation total under "for a
  // month" reads as a month costing two days' worth. `priceOf` is the same call
  // Subscribe makes, so the price does not move when the customer gets there.
  // Worked out above the missing-box return so the hook runs on every render.
  const fallback = useMemo(() => (box ? priceOf(planFromBox(box)) : null), [box]);

  // An id that names no box — a stale link, a box since retired — gets a way
  // back rather than a blank page with no controls on it.
  if (!box || !fallback) {
    return (
      <Screen texture>
        <View style={styles.missing}>
          <Text style={styles.missingText}>{t('box.missing')}</Text>
          <Button
            label={t('common.back')}
            variant="outline"
            size="md"
            onPress={() => navigation.goBack()}
          />
        </View>
      </Screen>
    );
  }

  const accent = colors[box.accent];
  const name = t(`box.${box.id}.name`);
  const seeded = plan.boxId === box.id && plan.dishIds.length > 0;
  // The box's advertised daily macros are the one source of truth for the
  // "full day" card, so the detail agrees with the Plans card (BoxCard also
  // reads `boxDaily`). The seeded plan's `dailyMacros` is not it: a box opens
  // with a single default meal time, so that figure is an average day of a
  // one-meal plan and read far below the box's headline (998 vs 1800 kcal).
  const daily = boxDaily(box);
  const money = seeded ? pricing : fallback;
  // The rotation broken into days, shown one day at a time: six cards in a row
  // is a pile of dishes, three under a day tab is a schedule.
  const days = rotationDays(plan, meals);
  // Kept in slot shape for the list below, which prints the meal time above the
  // dishes that arrive at it.
  const daySlots = rotationDaySlots(plan, meals);
  const activeDay = Math.min(day, Math.max(0, days.length - 1));
  const cycleNote = t(cycleNoteKey(days.length)).replace('{n}', formatNumber(days.length));

  // Read off the live plan rather than the box, since the meal times and the
  // length on screen are the ones the customer may already have tuned.
  const rhythm = planRhythm(money.mealsPerDay, plan.dayCount, t);

  // Tuning a box is building a plan, and a plan ends at a checkout that needs a
  // number to deliver to. Browsing the box stays open to everyone.
  const openBuilder = () => {
    if (status !== 'authed') {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('PlanBuilder', { boxId: box.id });
  };

  return (
    <Screen scroll={false} edges={['bottom', 'left', 'right']} texture>
      <View style={styles.page}>
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
        >
          {/* Inside the scroller, like the meal page: reading about the box puts
              the photo away instead of holding it on screen the whole time. The
              name sits on the photo, so it travels with it. */}
          <Hero source={box.image} scrim style={styles.hero}>
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
          <Text style={styles.desc}>{t(`box.${box.id}.desc`)}</Text>

          {/* "Per day" alone read as if it could be one meal's figures. */}
          <View style={styles.group}>
            <Text style={styles.groupLabel}>{t('macros.fullDayTitle')}</Text>
            <Card padding={spacing.xl}>
              <MacroRow macros={daily} fullDay />
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
              {/* Grouped by meal time rather than run together: a slot can carry
                  more than one dish, so a meal's place in the day's flat list is
                  no longer its slot's index. The heading is printed once and the
                  dishes that arrive at that hour sit under it. */}
              {(daySlots[activeDay] ?? []).map((slotMeals, slotIndex) => {
                const slot = plan.mealSlots[slotIndex];
                if (slotMeals.length === 0) return null;
                return (
                  <View key={slot?.id ?? slotIndex} style={styles.slot}>
                    {slot ? (
                      <View style={styles.slotHead}>
                        <Icon
                          path={icons[slot.icon]}
                          size={13}
                          color={colors.muted2}
                          strokeWidth={2}
                        />
                        <Text style={styles.slotLabel}>{slotLabel(slot, t)}</Text>
                        <Text style={styles.slotTime}>{formatTime(slot.time, t)}</Text>
                      </View>
                    ) : null}
                    {slotMeals.map((meal, i) => (
                      <MealRow
                        key={`${meal.dishId}-${i}`}
                        meal={meal}
                        // The box on screen is the plan being built (seeded by
                        // `startFromBox` above), so tailoring a meal lands on it
                        // rather than on a subscription already running.
                        onPress={() =>
                          navigation.navigate('DishDetail', {
                            id: meal.dishId,
                            fromPlan: true,
                            building: true,
                          })
                        }
                      />
                    ))}
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openBuilder}
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
          </View>
        </ScrollView>

        {/* The two things that do not travel: the way back, and the price the
            customer is deciding on. */}
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

        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <View style={styles.priceText}>
              <Text style={styles.priceLabel}>{t('box.detail.total')}</Text>
              <Text style={styles.priceMeta} numberOfLines={2}>
                {rhythm}
              </Text>
            </View>
            <PricePill value={formatPrice(groupNumber(money.total), lang)} />
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
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.huge,
  },
  missingText: {
    ...type.body,
    color: colors.muted2,
    textAlign: 'center',
  },
  page: {
    flex: 1,
    overflow: 'hidden',
  },
  scroller: {
    flex: 1,
  },
  // Grows to the viewport so a short box still fills the page — without it the
  // sheet stops where its content does and the screen texture shows through
  // between it and the footer.
  scrollBody: {
    flexGrow: 1,
  },
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
  // Rides up over the photo and keeps going: the picture is part of the scroll,
  // so reading about the box puts it away.
  sheet: {
    flexGrow: 1,
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.sheet2,
    borderTopRightRadius: radius.sheet2,
    marginTop: -24,
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.huge,
    paddingBottom: spacing.huge,
    gap: spacing.giant,
    ...shadow.sheet,
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
  slotTime: {
    ...type.micro,
    color: colors.tealText,
    textAlign: 'auto',
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
