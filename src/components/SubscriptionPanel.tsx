import React, { useMemo, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Text from './AppText';
import Icon from './Icon';
import { icons } from './icons';
import Button from './Button';
import Dialog from './Dialog';
import PatternFill from './PatternFill';
import PressScale from './PressScale';
import SectionHeader from './SectionHeader';
import UpcomingDays from './UpcomingDays';
import { usePulseLoop } from '../animation';
import { colors, fonts, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { count } from '../i18n/count';
import { planProgress, usePlan } from '../state/PlanContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

const PLAN_GRADIENT = [colors.tealDark, colors.teal] as const;
// Two days live on the card; the one after them is the teaser.
const PEEK_COUNT = 2;
// Cream over the last row rather than a hard crop — a row sliced mid-card reads
// as a rendering fault, the same row dissolving reads as "there is more".
const PEEK_FADE = ['rgba(246,244,241,0)', colors.cream] as const;

// The live indicator on a running plan — a halo breathing out of the dot, the
// one thing here that should look like it's still moving.
function LiveDot() {
  const anim = usePulseLoop();
  const halo = {
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
  };

  return (
    <View style={styles.liveWrap}>
      <Animated.View style={[styles.liveDot, styles.liveHalo, halo]} pointerEvents="none" />
      <View style={styles.liveDot} />
    </View>
  );
}

// Everything about the plan the customer is on: what it is, how far through it
// is, what arrives next, and the way out. It lives on Plans because that is the
// tab named after it — Orders is for deliveries, and a subscription is not one.
export default function SubscriptionPanel() {
  const { t } = useLanguage();
  const { subscription, subscriptionPricing, cancelSubscription } = usePlan();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cancelling, setCancelling] = useState(false);

  const progress = useMemo(
    () => (subscription ? planProgress(subscription) : null),
    [subscription],
  );

  // The date the paid span closes. A calendar date is something the customer
  // can plan around; "23 days left" is the same fact in a form they have to do
  // arithmetic on, and it is already the first counter below.
  const endLabel = useMemo(() => {
    if (!progress) return '';
    if (progress.finished) return t('orders.finished');
    const end = new Date(progress.endsAt);
    return `${t('orders.endsOn')} ${formatNumber(end.getDate())} ${t(`month.${end.getMonth()}`)}`;
  }, [progress, t]);

  if (!subscription || !subscriptionPricing || !progress) return null;

  const percent = Math.round(progress.ratio * 100);
  const planName = subscription.boxId ? t(`box.${subscription.boxId}.name`) : t('plans.custom');

  return (
    <View style={styles.section}>
      {/* No edit action: the plan is paid for and running, and the only changes
          that make sense on a live one are per-day — skip or postpone — which
          the rows below already carry. */}
      <SectionHeader title={t('plans.active')} />

      <LinearGradient
        colors={PLAN_GRADIENT}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.planCard, shadow.raised]}
      >
        <PatternFill />
        <View style={styles.planHead}>
          <View style={styles.planText}>
            <Text style={styles.planName} numberOfLines={1}>
              {planName}
            </Text>
            <Text style={styles.planMeta} numberOfLines={1}>
              {`${count('count.meals', subscriptionPricing.mealsPerDay, t)} ${t('unit.perDay')} · ${endLabel}`}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <LiveDot />
            <Text style={styles.statusText}>{t('orders.active')}</Text>
          </View>
        </View>

        {/* Bar first, numbers under it. The bar is the thing read at a glance
            and the caption is the footnote, so the caption carries the count
            rather than repeating it in a third place. */}
        <View style={styles.progressBlock}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLead}>
              {`${formatNumber(progress.deliveredDays)} ${t('orders.ofTotal')} ${formatNumber(progress.totalDays)} ${t('unit.days')}`}
            </Text>
            <Text style={styles.progressTrail}>
              {progress.finished
                ? t('orders.finished')
                : `${formatNumber(percent)}${t('common.percent')}`}
            </Text>
          </View>
        </View>

        {/* Two live counters, both of which fall as the plan runs down. */}
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatNumber(progress.remainingDays)}</Text>
            <Text style={styles.statLabel}>{t('orders.remainingDays')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatNumber(progress.remainingMeals)}</Text>
            <Text style={styles.statLabel}>{t('orders.remainingMeals')}</Text>
          </View>
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

      {/* A finished plan has nothing ahead of it, so the list, the fade and the
          link to the full run all go with it. */}
      {progress.remainingDays > 0 ? (
        <>
          <SectionHeader
            title={t('orders.upcoming')}
            subtitle={count('count.days', progress.remainingDays, t)}
          />

          {/* The next two days, live: their meals open, their days can be
              skipped or postponed from here. */}
          <UpcomingDays
            count={PEEK_COUNT}
            revealFrom={2}
            onPressMeal={(id, siblings) => navigation.navigate('DishDetail', { id, siblings, fromPlan: true })}
          />

          {/* The day after them, cut off under a fade and inert — the whole
              block is one target for the full run, so a press anywhere on the
              half-shown card goes where the arrow does. */}
          {progress.remainingDays > PEEK_COUNT ? (
            <PressScale
              onPress={() => navigation.navigate('Upcoming')}
              scaleTo={0.99}
              accessibilityLabel={t('orders.upcoming.all')}
              style={styles.moreBlock}
            >
              <View style={styles.peek} pointerEvents="none">
                <UpcomingDays
                  from={PEEK_COUNT}
                  count={1}
                  revealFrom={2 + PEEK_COUNT}
                  onPressMeal={() => {}}
                />
                <LinearGradient colors={PEEK_FADE} style={styles.peekFade} pointerEvents="none" />
              </View>

              <View style={styles.more}>
                <Text style={styles.moreText}>{t('orders.upcoming.all')}</Text>
                <View style={styles.moreArrow}>
                  <Icon path={icons.chevronDown} size={13} color={colors.tealText} strokeWidth={2.4} />
                </View>
              </View>
            </PressScale>
          ) : null}
        </>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setCancelling(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={t('orders.cancel')}
      >
        <Text style={styles.cancel}>{t('orders.cancel')}</Text>
      </TouchableOpacity>

      {/* Cancelling wipes the plan and every meal booked under it, and nothing
          in the app can bring it back — so it is asked, not assumed. */}
      <Dialog
        visible={cancelling}
        title={t('orders.cancel.title')}
        message={t('orders.cancel.message')}
        primaryLabel={t('orders.cancel.keep')}
        onPrimary={() => setCancelling(false)}
        secondaryLabel={t('orders.cancel.confirm')}
        onSecondary={() => {
          setCancelling(false);
          cancelSubscription();
        }}
        onClose={() => setCancelling(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.xl,
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
  statusPill: {
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
  statusText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
  liveWrap: {
    width: 6,
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  liveHalo: {
    position: 'absolute',
  },
  // Progress is measured in delivery days, not calendar days — a Sun-to-Thu
  // plan is not half done because half the calendar span elapsed.
  progressBlock: {
    gap: spacing.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  progressLead: {
    ...type.caption,
    fontSize: 12,
    color: overlay.white75,
  },
  progressTrail: {
    ...type.caption,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: overlay.white16,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.goldLight,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: overlay.white08,
    borderRadius: radius.md,
    paddingVertical: spacing.xl,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  statValue: {
    ...type.h3,
    color: colors.white,
  },
  statLabel: {
    ...type.caption,
    fontSize: 12,
    color: overlay.white75,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: overlay.white16,
  },
  trackBtn: {
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  moreBlock: {
    gap: spacing.md,
  },
  // Half a card is enough to show the list keeps going. Clipped so the fade has
  // an edge to sit on, and bled sideways so the crop does not shave the row's
  // own shadow off with it.
  peek: {
    maxHeight: 68,
    overflow: 'hidden',
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  peekFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 44,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  moreText: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.tealText,
  },
  moreArrow: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.healthyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.coral,
    textAlign: 'center',
  },
});
