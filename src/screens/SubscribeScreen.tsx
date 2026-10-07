import React, { useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { type IconPath, icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import Chip from '../components/Chip';
import Dialog from '../components/Dialog';
import Stepper from '../components/Stepper';
import MacroRow from '../components/MacroRow';
import PressScale from '../components/PressScale';
import PatternFill from '../components/PatternFill';
import Reveal from '../components/Reveal';
import { useCountUp, usePop, usePulse, useToggle } from '../animation';
import { colors, fonts, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import UpcomingMeals from '../components/UpcomingMeals';
import { usePlan, saverSaving } from '../state/PlanContext';
import { useAuth } from '../state/AuthContext';
import {
  type SaverKey,
  MAX_DAYS,
  MIN_DAYS,
  currencyMark,
  dayKeys,
  discountForDays,
  durationPresets,
  formatPrice,
  groupNumber,
  saverKeys,
} from '../data/menu';
import { formatNumber } from '../i18n/digits';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const PLAN_GRADIENT = [colors.tealDark, colors.teal] as const;

const SAVER_ICON: Record<SaverKey, { path: IconPath; color: string; tint: string }> = {
  fewerMeals: { path: icons.utensils, color: colors.amberIcon, tint: colors.regularBg },
  fewerDays: { path: icons.calendar, color: colors.tealText, tint: colors.healthyBg },
  swapCheaper: { path: icons.refresh, color: colors.violet, tint: colors.violetBg },
  longerTerm: { path: icons.hourglass, color: colors.greenDark, tint: colors.greenBg },
};

// Selected state crossfades a filled layer over the resting tile rather than
// swapping backgroundColor, which the native driver can't tween. The fill is
// inset negatively so it covers the resting border instead of sitting inside it.
function DayTile({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const anim = useToggle(on);
  const fill = {
    opacity: anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
  };

  return (
    <PressScale
      onPress={onPress}
      scaleTo={0.92}
      style={styles.day}
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.dayFill, fill]} />
      <Text style={styles.dayText}>{label}</Text>
      <Animated.View style={[styles.tileOverlay, { opacity: anim }]} pointerEvents="none">
        <Text style={[styles.dayText, styles.dayTextOn]}>{label}</Text>
      </Animated.View>
    </PressScale>
  );
}

function SavedPill({ label }: { label: string }) {
  const pop = usePop();
  return (
    <Animated.View style={[styles.savedPill, pop]}>
      <Text style={styles.savedText}>{label}</Text>
    </Animated.View>
  );
}

export default function SubscribeScreen({ navigation }: RootStackScreenProps<'Subscribe'>) {
  const { t, lang, isRTL } = useLanguage();
  const { status } = useAuth();
  const {
    plan,
    meals,
    pricing,
    dailyMacros,
    subscription,
    setDayCount,
    toggleWeekday,
    applySaver,
    confirm,
  } = usePlan();

  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  const chevron = isRTL ? icons.chevronLeft : icons.chevronRight;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Savers that can actually pay out lead, so the grid opens with what's worth
  // tapping instead of four tiles the user has to read to rule out.
  const savings = useMemo(
    () =>
      saverKeys
        .map((key) => ({ key, amount: saverSaving(plan, key) }))
        .sort((a, b) => b.amount - a.amount),
    [plan],
  );

  const bestPreset = useMemo(
    () =>
      durationPresets.reduce((best, p) =>
        discountForDays(p.days) > discountForDays(best.days) ? p : best,
      ),
    [],
  );

  const mark = currencyMark(lang);
  const planSummary = `${formatNumber(pricing.mealsPerDay)} ${t('plan.mealsUnit')} × ${formatNumber(plan.weekdays.length)} ${t('plan.daysWeekly')}`;

  // mealCount is activeDays × mealsPerDay, so a zero total is always one of two
  // empty pickers. Naming which one beats a dead button with no explanation.
  const blocked = pricing.mealCount === 0;

  const shownTotal = useCountUp(pricing.total);
  const totalPulse = usePulse(pricing.total);
  const headerLine = scrollY.interpolate({
    inputRange: [0, 14],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // The plan lives on the Plans tab now, so that is where confirming lands.
  const toPlans = () =>
    navigation.reset({
      index: 0,
      routes: [{ name: 'Tabs', params: { screen: 'Plans' } }],
    });

  const onConfirm = () => {
    // One plan at a time: a second subscription would run its own deliveries
    // against the same days, and nothing downstream — the tracker, the upcoming
    // list, the progress bar — is built to show two.
    if (subscription) {
      setAlreadySubscribed(true);
      return;
    }
    if (status !== 'authed') {
      navigation.navigate('Login');
      return;
    }
    confirm();
    toPlans();
  };

  return (
    <Screen scroll={false} texture>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={styles.backBtn}
        >
          <Icon path={icons.close} size={16} color={colors.ink} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('subscribe.title')}</Text>
        </View>
        <Animated.View style={[styles.headerLine, { opacity: headerLine }]} pointerEvents="none" />
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
      >
        <Reveal index={0} style={styles.group}>
          <Text style={styles.groupLabel}>{t('subscribe.duration')}</Text>
          <View style={styles.presetRow}>
            {durationPresets.map((p) => (
              <View key={p.key} style={styles.presetWrap}>
                <Chip
                  label={`${formatNumber(p.days)} ${t('unit.days')}`}
                  sublabel={`${t('plan.discount')} ${formatNumber(Math.round(discountForDays(p.days) * 100))}${t('common.percent')}`}
                  selected={plan.dayCount === p.days}
                  onPress={() => setDayCount(p.days)}
                  shape="rounded"
                  full
                />
                {p.key === bestPreset.key ? (
                  <View style={styles.bestWrap} pointerEvents="none">
                    <View style={styles.bestBadge}>
                      <Text style={styles.bestText}>{t('subscribe.bestValue')}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
          <Card padding={spacing.xxl} style={styles.stepperCard}>
            <Stepper
              icon={icons.calendar}
              label={t('subscribe.anyLength')}
              value={plan.dayCount}
              suffix={t('unit.days')}
              onDecrement={() => setDayCount(plan.dayCount - 1)}
              onIncrement={() => setDayCount(plan.dayCount + 1)}
              canDecrement={plan.dayCount > MIN_DAYS}
              canIncrement={plan.dayCount < MAX_DAYS}
            />
            <Text style={styles.stepperNote}>
              {`${t('plan.discount')} ${formatNumber(Math.round(pricing.discount * 100))}${t('common.percent')} · ${formatNumber(pricing.activeDays)} ${t('subscribe.deliveryDays')}`}
            </Text>
          </Card>
        </Reveal>

        <Reveal index={1} style={styles.group}>
          <View style={styles.groupHead}>
            <Text style={styles.groupLabel}>{t('plan.days')}</Text>
            <Text style={[styles.groupHint, plan.weekdays.length === 0 && styles.groupHintWarn]}>
              {`${formatNumber(plan.weekdays.length)} ${t('unit.days')}`}
            </Text>
          </View>
          <View style={styles.weekRow}>
            {dayKeys.map((key, i) => (
              <DayTile
                key={key}
                label={t(key)}
                on={plan.weekdays.includes(i)}
                onPress={() => toggleWeekday(i)}
              />
            ))}
          </View>
        </Reveal>

        {meals.length > 0 ? (
          <Reveal index={2} style={styles.group}>
            <View style={styles.groupHead}>
              <Text style={styles.groupLabel}>{t('builder.yourMeals')}</Text>
              <PressScale
                onPress={() => navigation.navigate('PlanMenu')}
                scaleTo={0.94}
                accessibilityLabel={t('planMenu.show')}
                style={styles.showMenuBtn}
              >
                <Text style={styles.showMenuText}>{t('planMenu.show')}</Text>
                <Icon path={chevron} size={13} color={colors.tealText} strokeWidth={2.4} />
              </PressScale>
            </View>
            <UpcomingMeals
              plan={plan}
              meals={meals}
              onPressMeal={(id) =>
                navigation.navigate('DishDetail', { id, fromPlan: true, building: true })
              }
            />
          </Reveal>
        ) : null}

        {pricing.mealCount > 0 ? (
          <Reveal index={3} style={styles.group}>
            <Text style={styles.groupLabel}>{t('macros.fullDayTitle')}</Text>
            <Card padding={spacing.xl}>
              <MacroRow macros={dailyMacros} fullDay />
            </Card>
          </Reveal>
        ) : null}

        <Reveal index={4} style={styles.group}>
          <Text style={styles.groupLabel}>{t('subscribe.savers')}</Text>
          <View style={styles.saverGrid}>
            {savings.map(({ key, amount }) => {
              const off = amount <= 0;
              return (
                <PressScale
                  key={key}
                  disabled={off}
                  onPress={() => applySaver(key)}
                  accessibilityLabel={t(`saver.${key}`)}
                  accessibilityState={{ disabled: off }}
                  style={[styles.saver, shadow.card, off && styles.saverOff]}
                >
                  <View style={[styles.saverTile, { backgroundColor: SAVER_ICON[key].tint }]}>
                    <Icon
                      path={SAVER_ICON[key].path}
                      size={19}
                      color={SAVER_ICON[key].color}
                      strokeWidth={1.9}
                    />
                  </View>
                  <View style={styles.saverText}>
                    <Text style={styles.saverLabel} numberOfLines={1}>
                      {t(`saver.${key}`)}
                    </Text>
                    <Text style={[styles.saverAmount, off && styles.saverAmountOff]}>
                      {off ? t('common.dash') : `−${groupNumber(amount)} ${mark} · ${t('unit.perWeek')}`}
                    </Text>
                  </View>
                </PressScale>
              );
            })}
          </View>
        </Reveal>
      </Animated.ScrollView>

      <Reveal index={5} style={styles.footer}>
        <LinearGradient
          colors={PLAN_GRADIENT}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[styles.summary, shadow.raised]}
        >
          <PatternFill radius={radius.xxl} />
          <View style={styles.summaryHead}>
            <Text style={styles.summaryMeta} numberOfLines={1}>
              {planSummary}
            </Text>
            {pricing.saved > 0 ? (
              <SavedPill
                label={`${t('plan.save')} ${formatPrice(groupNumber(pricing.saved), lang)}`}
              />
            ) : null}
          </View>

          <Animated.View style={[styles.totalRow, { transform: [{ scale: totalPulse }] }]}>
            <Text style={styles.total}>{groupNumber(shownTotal)}</Text>
            <Text style={styles.totalUnit}>
              {`${mark} / ${formatNumber(plan.dayCount)} ${t('unit.days')}`}
            </Text>
          </Animated.View>

          {blocked ? (
            <View style={styles.hintRow}>
              <Icon path={icons.calendar} size={13} color={colors.goldLight} strokeWidth={2.2} />
              <Text style={styles.hint} numberOfLines={1}>
                {t('subscribe.needDays')}
              </Text>
            </View>
          ) : (
            <Text style={styles.compare}>
              {`${formatPrice(groupNumber(pricing.perWeek), lang)} ${t('unit.perWeek')}`}
            </Text>
          )}

          <Button
            label={t('subscribe.confirm')}
            variant="primary"
            size="lg"
            full
            disabled={blocked}
            onPress={onConfirm}
            style={styles.cta}
          />
        </LinearGradient>
      </Reveal>

      <Dialog
        visible={alreadySubscribed}
        title={t('subscribe.exists.title')}
        message={t('subscribe.exists.message')}
        primaryLabel={t('subscribe.exists.keep')}
        onPrimary={() => setAlreadySubscribed(false)}
        secondaryLabel={t('subscribe.exists.replace')}
        onSecondary={() => {
          setAlreadySubscribed(false);
          confirm();
          toPlans();
        }}
        onClose={() => setAlreadySubscribed(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerText: {
    flex: 1,
    gap: 1,
  },
  headerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: colors.sand,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  title: {
    ...type.h1,
    color: colors.ink,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.giant,
    gap: spacing.giant,
  },
  group: {
    gap: spacing.md,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  groupLabel: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  groupHint: {
    ...type.caption,
    color: colors.muted2,
    flexShrink: 1,
  },
  groupHintWarn: {
    fontFamily: fonts.bold,
    color: colors.coral,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  presetWrap: {
    flex: 1,
  },
  bestWrap: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bestBadge: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  bestText: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    color: colors.white,
  },
  stepperCard: {
    gap: spacing.lg,
  },
  stepperNote: {
    ...type.caption,
    color: colors.muted,
  },
  weekRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  day: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.sand,
    backgroundColor: colors.card,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  dayFill: {
    position: 'absolute',
    top: -1.5,
    left: -1.5,
    right: -1.5,
    bottom: -1.5,
    borderRadius: radius.sm + 1.5,
    backgroundColor: colors.teal,
  },
  tileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.muted,
    textAlign: 'center',
  },
  dayTextOn: {
    fontFamily: fonts.bold,
    color: colors.white,
  },
  showMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  showMenuText: {
    ...type.captionStrong,
    color: colors.tealText,
  },
  saverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  saver: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  saverOff: {
    opacity: 0.45,
  },
  saverTile: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saverText: {
    flex: 1,
    gap: 1,
  },
  saverLabel: {
    ...type.captionStrong,
    color: colors.ink,
  },
  saverAmount: {
    ...type.micro,
    fontFamily: fonts.bold,
    color: colors.tealText,
  },
  saverAmountOff: {
    color: colors.faint2,
  },
  footer: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  summary: {
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxxl,
    gap: spacing.lg,
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryMeta: {
    ...type.caption,
    color: overlay.white75,
    flexShrink: 1,
  },
  savedPill: {
    backgroundColor: colors.goldLight,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  savedText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.amberText,
  },
  totalRow: {
    flexDirection: 'row',
    // Bottom rather than baseline: `type.money` runs a line box shorter than
    // the font's own, so its digits sit high inside it and a baseline-aligned
    // unit floats up with them.
    alignItems: 'flex-end',
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  total: {
    ...type.money,
    color: colors.white,
  },
  totalUnit: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: overlay.white75,
    paddingBottom: 7,
  },
  compare: {
    ...type.caption,
    color: overlay.white75,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hint: {
    ...type.caption,
    fontFamily: fonts.bold,
    color: colors.goldLight,
    flexShrink: 1,
  },
  cta: {
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
});
