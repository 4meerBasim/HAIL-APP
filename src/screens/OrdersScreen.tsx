import React, { useMemo } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Button from '../components/Button';
import Card from '../components/Card';
import MacroRow from '../components/MacroRow';
import SectionHeader from '../components/SectionHeader';
import { colors, fonts, overlay, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { toArabicDigits } from '../i18n/digits';
import {
  DEFAULT_TRACKING,
  MAX_POSTPONE_DAYS,
  type Order,
  currencyMark,
  dayKeys,
  formatPrice,
  getDish,
  groupNumber,
  heroImage,
  orderItemCount,
  orderTotal,
  orders,
  timeKeys,
} from '../data/menu';
import { type PlanState, postponedBy, postponedOffPlan, usePlan } from '../state/PlanContext';
import { useCart } from '../state/CartContext';
import type { TabScreenProps } from '../navigation/RootNavigator';

const PLAN_GRADIENT = [colors.tealDark, colors.teal] as const;
const ORDER_GRADIENT = [colors.tealDark, colors.teal] as const;
const SCRIM = [scrim.heroFade, scrim.hero] as const;
const MAX_THUMBS = 3;
const UPCOMING_COUNT = 6;

// The next delivery slots on the plan: day offsets that land on a selected weekday.
const upcomingDays = (plan: PlanState, count: number): number[] => {
  const out: number[] = [];
  for (let i = 0; i < plan.dayCount && out.length < count; i += 1) {
    if (plan.weekdays.includes(i % 7)) out.push(i);
  }
  return out;
};

export default function OrdersScreen({ navigation }: TabScreenProps<'Orders'>) {
  const { t, lang, isRTL } = useLanguage();
  const { addItem } = useCart();
  const {
    subscription,
    subscriptionMeals,
    subscriptionPricing,
    subscriptionMacros,
    editSubscription,
    skipDay,
    postponeDay,
    clearException,
    cancelSubscription,
  } = usePlan();

  const skipIcon = isRTL ? icons.skipBack : icons.skipForward;

  const active = orders.find((o) => o.status === 'active') ?? null;
  const past = orders.filter((o) => o.status !== 'active');

  const upcoming = useMemo(
    () => (subscription ? upcomingDays(subscription, UPCOMING_COUNT) : []),
    [subscription],
  );

  const dishName = (id: string): string => {
    const dish = getDish(id);
    if (!dish) return id;
    return lang === 'ar' ? dish.name : t(`dish.${id}.name`, dish.name);
  };

  const summarize = (order: Order): string =>
    order.lines
      .map((line) =>
        line.qty > 1
          ? `${dishName(line.dishId)} ×${toArabicDigits(line.qty, lang)}`
          : dishName(line.dishId),
      )
      .join(' + ');

  const reorder = (order: Order) => {
    order.lines.forEach((line) => addItem(line.dishId, line.qty));
    navigation.navigate('Cart');
  };

  // The rotation repeats across delivery days, so slot N gets the next
  // `mealsPerDay` meals in the plan's order.
  const mealsForSlot = (slot: number) => {
    if (!subscription || subscriptionMeals.length === 0) return [];
    const perDay = subscription.mealTimes.length;
    return Array.from(
      { length: perDay },
      (_, k) => subscriptionMeals[(slot * perDay + k) % subscriptionMeals.length],
    );
  };

  const planName = subscription
    ? subscription.boxId
      ? t(`box.${subscription.boxId}.name`)
      : t('plans.custom')
    : '';

  const openPlans = () => navigation.navigate('Plans');

  const openEditor = () => {
    editSubscription();
    navigation.navigate('Subscribe');
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('orders.title')}</Text>

      {subscription && subscriptionPricing ? (
        <View style={styles.section}>
          <SectionHeader
            title={t('plans.active')}
            actionLabel={t('common.edit')}
            onAction={openEditor}
          />

          <LinearGradient
            colors={PLAN_GRADIENT}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={[styles.planCard, shadow.raised]}
          >
            <View style={styles.planHead}>
              <View style={styles.planText}>
                <Text style={styles.planName} numberOfLines={1}>
                  {planName}
                </Text>
                <Text style={styles.planMeta} numberOfLines={1}>
                  {`${toArabicDigits(subscriptionPricing.activeDays, lang)} ${t('unit.days')} · ${toArabicDigits(subscriptionPricing.mealsPerDay, lang)} ${t('unit.perDay')} · ${subscription.mealTimes.map((i) => t(timeKeys[i])).join(' · ')}`}
                </Text>
              </View>
              <View style={styles.statusPillOnDark}>
                <View style={styles.liveDot} />
                <Text style={styles.statusTextOnDark}>{t('orders.active')}</Text>
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.total}>{groupNumber(subscriptionPricing.total)}</Text>
              <Text style={styles.totalUnit}>{currencyMark(lang)}</Text>
            </View>

            {subscriptionMacros ? <MacroRow macros={subscriptionMacros} size="sm" /> : null}

            <Button
              label={t('orders.track')}
              variant="light"
              size="md"
              full
              trailing={icons.truck}
              onPress={() => navigation.navigate('Tracking')}
              style={styles.trackBtn}
            />
          </LinearGradient>

          <SectionHeader
            title={t('orders.upcoming')}
            subtitle={`${toArabicDigits(upcoming.length, lang)} ${t('unit.days')}`}
          />

          <View style={styles.days}>
            {upcoming.map((dayIndex, slot) => {
              const ex = subscription.exceptions.find((e) => e.dayIndex === dayIndex);
              const dayMeals = mealsForSlot(slot);
              const names = dayMeals.map((m) => dishName(m.dishId)).join(' + ');
              const next = slot === 0 && !ex;
              const shifted = postponedBy(subscription, dayIndex);
              const offPlan = postponedOffPlan(subscription, dayIndex);
              const canPostponeMore = shifted < MAX_POSTPONE_DAYS;

              return (
                <View
                  key={dayIndex}
                  style={[styles.day, ex ? styles.dayException : styles.dayNormal, shadow.card]}
                >
                  <View style={styles.dayTop}>
                    <View style={[styles.dayChip, next ? styles.dayChipNext : styles.dayChipRest]}>
                      <Text style={[styles.dayChipText, next && styles.dayChipTextNext]}>
                        {t(dayKeys[dayIndex % 7])}
                      </Text>
                    </View>

                    <View style={styles.dayInfo}>
                      <Text style={[styles.dayName, ex && styles.dayNameOff]} numberOfLines={1}>
                        {names}
                      </Text>
                      <View style={styles.dayStatusRow}>
                        {ex ? (
                          <Icon
                            path={ex.kind === 'skip' ? skipIcon : icons.clock}
                            size={11}
                            color={colors.coral}
                            strokeWidth={2.4}
                          />
                        ) : null}
                        <Text style={styles.dayStatus} numberOfLines={1}>
                          {ex
                            ? ex.kind === 'skip'
                              ? t('orders.skipped')
                              : `${t(offPlan ? 'orders.pushedOff' : 'orders.postponed')} +${toArabicDigits(shifted, lang)} ${t('unit.days')}`
                            : subscription.mealTimes.map((i) => t(timeKeys[i])).join(' · ')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actions}>
                      {ex?.kind !== 'skip' ? (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          disabled={!canPostponeMore}
                          onPress={() => postponeDay(dayIndex, shifted + 1)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          accessibilityRole="button"
                          accessibilityLabel={t('orders.postpone')}
                          accessibilityState={{ disabled: !canPostponeMore }}
                          style={[styles.action, !canPostponeMore && styles.actionOff]}
                        >
                          <Icon
                            path={icons.clock}
                            size={17}
                            color={canPostponeMore ? colors.muted : colors.faint2}
                            strokeWidth={2}
                          />
                        </TouchableOpacity>
                      ) : null}

                      {ex ? (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => clearException(ex.id)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          accessibilityRole="button"
                          accessibilityLabel={t('orders.undo')}
                          style={[styles.action, styles.actionOnTint]}
                        >
                          <Icon path={icons.undo} size={17} color={colors.muted} strokeWidth={2} />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => skipDay(dayIndex)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          accessibilityRole="button"
                          accessibilityLabel={t('common.skipDay')}
                          style={styles.action}
                        >
                          <Icon path={skipIcon} size={17} color={colors.muted} strokeWidth={2} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {dayMeals.length > 0 ? (
                    <View style={styles.thumbs}>
                      {dayMeals.map((m, k) => {
                        const d = getDish(m.dishId);
                        return d ? (
                          <Image
                            key={`${m.dishId}-${k}`}
                            source={{ uri: d.image }}
                            style={[styles.thumb, ex && styles.thumbOff]}
                          />
                        ) : null;
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={cancelSubscription}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t('orders.cancel')}
          >
            <Text style={styles.cancel}>{t('orders.cancel')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.emptyCard, shadow.card]}>
          <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={SCRIM} locations={[0.15, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.emptyText}>
            <Text style={styles.emptyKicker}>{t('plans.active')}</Text>
            <Text style={styles.emptyTitle}>{t('orders.noPlan')}</Text>
          </View>
          <Button
            label={t('boxes.custom.cta')}
            variant="amber"
            size="md"
            onPress={openPlans}
            style={styles.emptyCta}
          />
        </View>
      )}

      {active ? (
        <View style={styles.section}>
          <SectionHeader title={t('orders.current')} />

          <LinearGradient
            colors={ORDER_GRADIENT}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={[styles.planCard, shadow.raised]}
          >
            <View style={styles.planHead}>
              <View style={styles.planText}>
                <Text style={styles.planName}>{`#${toArabicDigits(active.id, lang)}`}</Text>
                <Text style={styles.planMeta}>
                  {`${t(active.whenKey)} · ${toArabicDigits(orderItemCount(active), lang)} ${t('orders.items')}`}
                </Text>
              </View>
              <View style={styles.statusPillOnDark}>
                <View style={styles.liveDot} />
                <Text style={styles.statusTextOnDark}>{t(`track.step.${DEFAULT_TRACKING}`)}</Text>
              </View>
            </View>

            <Text style={styles.activeItems} numberOfLines={2}>
              {summarize(active)}
            </Text>

            <View style={styles.totalRow}>
              <Text style={styles.total}>{groupNumber(orderTotal(active))}</Text>
              <Text style={styles.totalUnit}>{currencyMark(lang)}</Text>
            </View>

            <Button
              label={t('orders.track')}
              variant="light"
              size="md"
              full
              trailing={icons.truck}
              onPress={() => navigation.navigate('Tracking')}
              style={styles.trackBtn}
            />
          </LinearGradient>
        </View>
      ) : null}

      {past.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title={t('orders.past')} />

          {past.map((order) => (
            <Card key={order.id} padding={spacing.xl} style={styles.pastCard}>
              <View style={styles.pastHead}>
                <View style={styles.pastText}>
                  <Text style={styles.pastItems} numberOfLines={2}>
                    {summarize(order)}
                  </Text>
                  <Text style={styles.pastMeta}>
                    {`${t(order.whenKey)} · ${formatPrice(groupNumber(orderTotal(order)), lang)}`}
                  </Text>
                </View>
                <View style={styles.deliveredPill}>
                  <Icon path={icons.check} size={11} color={colors.tealText} strokeWidth={2.6} />
                  <Text style={styles.deliveredText}>{t('orders.delivered')}</Text>
                </View>
              </View>

              <View style={styles.pastFoot}>
                <View style={styles.thumbs}>
                  {order.lines.slice(0, MAX_THUMBS).map((line) => {
                    const dish = getDish(line.dishId);
                    return dish ? (
                      <Image key={line.dishId} source={{ uri: dish.image }} style={styles.thumb} />
                    ) : null;
                  })}
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => reorder(order)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.reorder')}
                  style={styles.reorderBtn}
                >
                  <Icon path={icons.refresh} size={14} color={colors.teal} strokeWidth={2.1} />
                  <Text style={styles.reorderText}>{t('common.reorder')}</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.md,
    paddingBottom: spacing.giant,
    gap: spacing.giant,
  },
  heading: {
    ...type.h1,
    color: colors.ink,
  },
  section: {
    gap: spacing.xl,
  },
  emptyCard: {
    height: 210,
    borderRadius: radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: spacing.huge,
    gap: spacing.xl,
    backgroundColor: colors.tealDark,
  },
  emptyText: {
    gap: spacing.xs,
  },
  emptyKicker: {
    ...type.captionStrong,
    color: colors.goldLight,
  },
  emptyTitle: {
    ...type.h2,
    color: colors.white,
  },
  emptyCta: {
    borderRadius: radius.pill,
  },
  planCard: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxxl,
    gap: spacing.xl,
  },
  planHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  planText: {
    flex: 1,
    gap: 2,
  },
  planName: {
    ...type.h3,
    color: colors.white,
  },
  planMeta: {
    ...type.caption,
    color: overlay.white75,
  },
  statusPillOnDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: overlay.white16,
    borderWidth: 1,
    borderColor: overlay.white30,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  statusTextOnDark: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: colors.white,
  },
  activeItems: {
    ...type.body,
    color: overlay.white90,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  total: {
    ...type.money,
    color: colors.white,
  },
  totalUnit: {
    ...type.body,
    color: overlay.white80,
  },
  trackBtn: {
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  days: {
    gap: spacing.lg,
  },
  day: {
    borderRadius: radius.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  dayNormal: {
    backgroundColor: colors.white,
  },
  dayException: {
    backgroundColor: colors.sandChip,
  },
  dayTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  dayChip: {
    minWidth: 52,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipNext: {
    backgroundColor: colors.healthyBg,
  },
  dayChipRest: {
    backgroundColor: colors.sandChip,
  },
  dayChipText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.ink,
    textAlign: 'center',
  },
  dayChipTextNext: {
    color: colors.tealDark,
  },
  dayInfo: {
    flex: 1,
    gap: 1,
  },
  dayName: {
    ...type.title,
    fontSize: 13,
    color: colors.ink,
  },
  dayNameOff: {
    color: colors.muted2,
  },
  dayStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayStatus: {
    ...type.caption,
    fontSize: 11,
    color: colors.body,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  action: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.sandChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOnTint: {
    backgroundColor: colors.white,
  },
  actionOff: {
    opacity: 0.5,
  },
  cancel: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.coral,
    textAlign: 'center',
  },
  pastCard: {
    borderRadius: radius.card,
    gap: spacing.xl,
  },
  pastHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  pastText: {
    flex: 1,
    gap: 3,
  },
  pastItems: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  pastMeta: {
    ...type.caption,
    color: colors.muted2,
  },
  deliveredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.healthyBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  deliveredText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: colors.tealText,
  },
  pastFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  thumbs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  thumb: {
    width: 40,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.sand,
  },
  thumbOff: {
    opacity: 0.45,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.healthyBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  reorderText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.teal,
  },
});
