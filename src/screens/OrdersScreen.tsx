import React, { useMemo } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Button from '../components/Button';
import MacroRow from '../components/MacroRow';
import SectionHeader from '../components/SectionHeader';
import { colors, fonts, overlay, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { type PlanState, countActiveDays, usePlan } from '../state/PlanContext';
import { currencyMark, dayKeys, getDish, groupNumber, heroImage } from '../data/menu';
import { sumMacros } from '../data/nutrition';
import { toArabicDigits } from '../i18n/digits';
import type { TabScreenProps } from '../navigation/RootNavigator';

const PLAN_GRADIENT = [colors.tealDark, colors.teal] as const;
const SCRIM = [scrim.heroFade, scrim.hero] as const;
const UPCOMING_COUNT = 6;

const upcomingDays = (plan: PlanState, count: number): number[] => {
  const out: number[] = [];
  for (let i = 0; i < plan.dayCount && out.length < count; i += 1) {
    if (plan.weekdays.includes(i % 7)) out.push(i);
  }
  return out;
};

export default function OrdersScreen({ navigation }: TabScreenProps<'Orders'>) {
  const { t, lang, isRTL } = useLanguage();
  const {
    subscription,
    subscriptionMeals,
    subscriptionPricing,
    skipDay,
    postponeDay,
    clearException,
    cancelSubscription,
  } = usePlan();

  const skip = isRTL ? icons.skipBack : icons.skipForward;

  const upcoming = useMemo(
    () => (subscription ? upcomingDays(subscription, UPCOMING_COUNT) : []),
    [subscription],
  );

  const dayMacros = useMemo(() => {
    if (!subscription || subscriptionMeals.length === 0) return null;
    const avg = sumMacros(subscriptionMeals.map((m) => m.macros));
    const n = subscriptionMeals.length;
    return {
      calories: Math.round((avg.calories / n) * subscription.mealsPerDay),
      protein: Math.round((avg.protein / n) * subscription.mealsPerDay),
      carbs: Math.round((avg.carbs / n) * subscription.mealsPerDay),
      fat: Math.round((avg.fat / n) * subscription.mealsPerDay),
    };
  }, [subscription, subscriptionMeals]);

  if (!subscription || !subscriptionPricing) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>{t('orders.title')}</Text>
        </View>

        <View style={[styles.emptyCard, shadow.card]}>
          <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={SCRIM} locations={[0.15, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.emptyText}>
            <Text style={styles.emptyKicker}>{t('home.hero.kicker')}</Text>
            <Text style={styles.emptyTitle}>{t('orders.empty')}</Text>
          </View>
          <Button
            label={t('boxes.custom.cta')}
            variant="amber"
            size="md"
            onPress={() => navigation.navigate('Plans')}
            style={styles.emptyCta}
          />
        </View>
      </Screen>
    );
  }

  const exceptionFor = (dayIndex: number) =>
    subscription.exceptions.find((e) => e.dayIndex === dayIndex);

  // The rotation repeats across delivery days, so day N gets the next
  // `mealsPerDay` meals in the plan's order.
  const mealsForDay = (slot: number) =>
    subscriptionMeals.length === 0
      ? []
      : Array.from(
          { length: subscription.mealsPerDay },
          (_, k) => subscriptionMeals[(slot * subscription.mealsPerDay + k) % subscriptionMeals.length],
        );

  const planName = subscription.boxId ? t(`box.${subscription.boxId}.name`) : t('plans.custom');

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.headingBlock}>
        <Text style={styles.heading}>{t('orders.title')}</Text>
      </View>

      <LinearGradient
        colors={PLAN_GRADIENT}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.hero, shadow.raised]}
      >
        <View style={styles.heroHead}>
          <View style={styles.heroText}>
            <Text style={styles.heroName} numberOfLines={1}>
              {planName}
            </Text>
            <Text style={styles.heroMeta}>
              {`${toArabicDigits(countActiveDays(subscription), lang)} ${t('unit.days')} · ${toArabicDigits(subscription.mealsPerDay, lang)} ${t('unit.perDay')}`}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{t('orders.active')}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.total}>{groupNumber(subscriptionPricing.total)}</Text>
          <Text style={styles.totalUnit}>{currencyMark(lang)}</Text>
        </View>

        {dayMacros ? <MacroRow macros={dayMacros} size="sm" /> : null}

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

      <View style={styles.section}>
        <SectionHeader
          title={t('orders.upcoming')}
          subtitle={`${toArabicDigits(upcoming.length, lang)} ${t('unit.days')}`}
        />

        <View style={styles.days}>
          {upcoming.map((dayIndex, slot) => {
            const ex = exceptionFor(dayIndex);
            const dayMeals = mealsForDay(slot);
            const names = dayMeals
              .map((m) => {
                const d = getDish(m.dishId);
                if (!d) return m.dishId;
                return lang === 'ar' ? d.name : t(`dish.${m.dishId}.name`, d.name);
              })
              .join(' + ');
            const next = slot === 0 && !ex;

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
                          path={ex.kind === 'skip' ? skip : icons.clock}
                          size={11}
                          color={colors.coral}
                          strokeWidth={2.4}
                        />
                      ) : null}
                      <Text style={styles.dayStatus}>
                        {ex
                          ? ex.kind === 'skip'
                            ? t('orders.skipped')
                            : `${t('orders.postponed')} +${toArabicDigits((ex.movedTo ?? dayIndex) - dayIndex, lang)}`
                          : `${toArabicDigits(subscription.mealsPerDay, lang)} ${t('unit.meals')}`}
                      </Text>
                    </View>
                  </View>

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
                    <View style={styles.actions}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => postponeDay(dayIndex, 1)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        accessibilityRole="button"
                        accessibilityLabel={t('orders.postpone')}
                        style={styles.action}
                      >
                        <Icon path={icons.clock} size={17} color={colors.muted} strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => skipDay(dayIndex)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.skipDay')}
                        style={styles.action}
                      >
                        <Icon path={skip} size={17} color={colors.muted} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  )}
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
  headingBlock: {
    gap: spacing.xs,
  },
  heading: {
    ...type.h1,
    color: colors.ink,
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
    color: colors.amber,
  },
  emptyTitle: {
    ...type.h2,
    color: colors.white,
  },
  emptyCta: {
    borderRadius: radius.pill,
  },
  hero: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxxl,
    gap: spacing.xl,
  },
  heroHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    ...type.h3,
    color: colors.white,
  },
  heroMeta: {
    ...type.caption,
    color: overlay.white75,
  },
  statusPill: {
    backgroundColor: overlay.white16,
    borderWidth: 1,
    borderColor: overlay.white30,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: colors.white,
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
  section: {
    gap: spacing.xl,
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
  cancel: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.coral,
    textAlign: 'center',
  },
});
