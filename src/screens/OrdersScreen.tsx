import React, { useMemo } from 'react';
import {
  Animated,
  ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { type IconPath, icons } from '../components/icons';
import Button from '../components/Button';
import Card from '../components/Card';
import PatternFill from '../components/PatternFill';
import PressScale from '../components/PressScale';
import Reveal from '../components/Reveal';
import SectionHeader from '../components/SectionHeader';
import UpcomingMeals from '../components/UpcomingMeals';
import { usePulseLoop, useReveal, useToggle } from '../animation';
import { colors, fonts, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useOrderText } from '../i18n/orderText';
import { formatNumber } from '../i18n/digits';
import {
  DEFAULT_TRACKING,
  MAX_POSTPONE_DAYS,
  currencyMark,
  dayKeys,
  getDish,
  groupNumber,
  orderGrandTotal,
  orderItemCount,
  slotLabel,
} from '../data/menu';
import {
  postponedBy,
  postponedOffPlan,
  planProgress,
  upcomingDeliveries,
  usePlan,
} from '../state/PlanContext';
import { useOrders } from '../state/OrdersContext';
import type { TabScreenProps } from '../navigation/RootNavigator';

const PLAN_GRADIENT = [colors.tealDark, colors.teal] as const;
const UPCOMING_COUNT = 6;

// The live indicator on an in-flight order — a halo breathing out of the dot,
// the one thing here that should look like it's still moving.
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

interface DayRowProps {
  index: number;
  label: string;
  names: string;
  statusText: string;
  exKind?: 'skip' | 'postpone';
  next: boolean;
  canPostponeMore: boolean;
  images: ImageSourcePropType[];
  skipIcon: IconPath;
  onSkip: () => void;
  onPostpone: () => void;
  onUndo: () => void;
}

// Skipping or postponing repaints the whole row, so the tint and the thumbnails
// cross-fade together rather than snapping between two states.
function DayRow({
  index,
  label,
  names,
  statusText,
  exKind,
  next,
  canPostponeMore,
  images,
  skipIcon,
  onSkip,
  onPostpone,
  onUndo,
}: DayRowProps) {
  const { t } = useLanguage();
  const reveal = useReveal(index);
  const anim = useToggle(Boolean(exKind));
  const dim = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });
  const hit = { top: 6, bottom: 6, left: 6, right: 6 };

  return (
    <Animated.View style={[styles.day, styles.dayNormal, shadow.card, reveal]}>
      <Animated.View style={[styles.dayFill, { opacity: anim }]} pointerEvents="none" />

      <View style={styles.dayTop}>
        <View style={[styles.dayChip, next ? styles.dayChipNext : styles.dayChipRest]}>
          <Text style={[styles.dayChipText, next && styles.dayChipTextNext]}>{label}</Text>
        </View>

        <View style={styles.dayInfo}>
          <Text style={[styles.dayName, exKind && styles.dayNameOff]} numberOfLines={1}>
            {names}
          </Text>
          <View style={styles.dayStatusRow}>
            {exKind ? (
              <Icon
                path={exKind === 'skip' ? skipIcon : icons.clock}
                size={11}
                color={colors.coral}
                strokeWidth={2.4}
              />
            ) : null}
            <Text style={styles.dayStatus} numberOfLines={1}>
              {statusText}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {exKind !== 'skip' ? (
            <PressScale
              disabled={!canPostponeMore}
              onPress={onPostpone}
              scaleTo={0.88}
              hitSlop={hit}
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
            </PressScale>
          ) : null}

          {exKind ? (
            <PressScale
              onPress={onUndo}
              scaleTo={0.88}
              hitSlop={hit}
              accessibilityLabel={t('orders.undo')}
              style={[styles.action, styles.actionOnTint]}
            >
              <Icon path={icons.undo} size={17} color={colors.muted} strokeWidth={2} />
            </PressScale>
          ) : (
            <PressScale
              onPress={onSkip}
              scaleTo={0.88}
              hitSlop={hit}
              accessibilityLabel={t('common.skipDay')}
              style={styles.action}
            >
              <Icon path={skipIcon} size={17} color={colors.muted} strokeWidth={2} />
            </PressScale>
          )}
        </View>
      </View>

      {images.length > 0 ? (
        <View style={styles.thumbs}>
          {images.map((src, k) => (
            <Animated.Image key={k} source={src} style={[styles.thumb, { opacity: dim }]} />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function OrdersScreen({ navigation }: TabScreenProps<'Orders'>) {
  const { t, lang, isRTL } = useLanguage();
  const { dishName, summarize, whenLabel } = useOrderText();
  const { orders } = useOrders();
  const {
    subscription,
    subscriptionMeals,
    subscriptionPricing,
    editSubscription,
    skipDay,
    postponeDay,
    clearException,
    cancelSubscription,
  } = usePlan();

  const skipIcon = isRTL ? icons.skipBack : icons.skipForward;

  const active = orders.find((o) => o.status === 'active') ?? null;
  const past = orders.filter((o) => o.status !== 'active');

  // Nothing placed and nothing subscribed: the screen has no content of its
  // own, so it says so rather than rendering as a bare heading.
  const blank = !subscription && orders.length === 0;

  // Anchored to today rather than to day zero: `upcomingDays` walked from the
  // start of the plan every time, so a subscription three weeks in still listed
  // its first week as "upcoming".
  const progress = useMemo(
    () => (subscription ? planProgress(subscription) : null),
    [subscription],
  );

  const upcoming = useMemo(
    () =>
      subscription && progress
        ? upcomingDeliveries(subscription, progress.elapsedDays, UPCOMING_COUNT)
        : [],
    [subscription, progress],
  );

  // The date the paid span closes. `endsAt` was already computed on every
  // render and never shown; the card carried the plan's length instead, which
  // the progress bar underneath states more usefully.
  const endLabel = useMemo(() => {
    if (!progress) return '';
    if (progress.finished) return t('orders.finished');
    const end = new Date(progress.endsAt);
    return `${t('orders.endsOn')} ${formatNumber(end.getDate())} ${t(`month.${end.getMonth()}`)}`;
  }, [progress, t]);

  const percent = progress ? Math.round(progress.ratio * 100) : 0;

  // The rotation repeats across delivery days, so slot N gets the next
  // `mealsPerDay` meals in the plan's order.
  const mealsForSlot = (slot: number) => {
    if (!subscription || subscriptionMeals.length === 0) return [];
    const perDay = subscription.mealSlots.length;
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


  const openEditor = () => {
    editSubscription();
    navigation.navigate('Subscribe');
  };

  return (
    <Screen scroll contentContainerStyle={styles.content} texture>
      <Reveal index={0}>
        <Text style={styles.heading}>{t('orders.title')}</Text>
      </Reveal>

      {blank ? (
        <Reveal index={1} style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon path={icons.receipt} size={28} color={colors.faint} strokeWidth={1.6} />
          </View>
          <Text style={styles.emptyTitle}>{t('orders.empty.title')}</Text>
          <Text style={styles.emptySub}>{t('orders.empty.sub')}</Text>
        </Reveal>
      ) : null}

      {subscription && subscriptionPricing && progress ? (
        <Reveal index={1} style={styles.section}>
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
            <PatternFill />
            {/* The plan's shape and the date it runs out. A calendar date is
                something the customer can plan around; "23 days left" is the
                same fact in a form they have to do arithmetic on, and it is
                already the first counter below. */}
            <View style={styles.planHead}>
              <View style={styles.planText}>
                <Text style={styles.planName} numberOfLines={1}>
                  {planName}
                </Text>
                <Text style={styles.planMeta} numberOfLines={1}>
                  {`${formatNumber(subscriptionPricing.mealsPerDay)} ${t('unit.perDay')} · ${endLabel}`}
                </Text>
              </View>
              <View style={styles.statusPillOnDark}>
                <LiveDot />
                <Text style={styles.statusTextOnDark}>{t('orders.active')}</Text>
              </View>
            </View>

            {/* Bar first, numbers under it. The bar is the thing read at a
                glance and the caption is the footnote, so the caption carries
                the count rather than repeating it in a third place. */}
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

            {/* Two live counters, both of which fall as the plan runs down. The
                plan total used to sit here as a third: money already committed,
                static, and labelled with a currency mark where its neighbours
                are labelled with nouns. It belongs on the receipt. */}
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

          <SectionHeader
            title={t('orders.upcoming')}
            subtitle={`${formatNumber(upcoming.length)} ${t('unit.days')}`}
          />

          <View style={styles.days}>
            {upcoming.map((dayIndex, slot) => {
              const ex = subscription.exceptions.find((e) => e.dayIndex === dayIndex);
              const dayMeals = mealsForSlot(slot);
              const shifted = postponedBy(subscription, dayIndex);
              const offPlan = postponedOffPlan(subscription, dayIndex);

              return (
                <DayRow
                  key={dayIndex}
                  index={slot + 2}
                  label={t(dayKeys[dayIndex % 7])}
                  names={dayMeals.map((m) => dishName(m.dishId)).join(' + ')}
                  statusText={
                    ex
                      ? ex.kind === 'skip'
                        ? t('orders.skipped')
                        : `${t(offPlan ? 'orders.pushedOff' : 'orders.postponed')} +${formatNumber(shifted)} ${t('unit.days')}`
                      : subscription.mealSlots.map((slot) => slotLabel(slot, t)).join(' · ')
                  }
                  exKind={ex?.kind}
                  next={slot === 0 && !ex}
                  canPostponeMore={shifted < MAX_POSTPONE_DAYS}
                  images={dayMeals
                    .map((m) => getDish(m.dishId)?.image)
                    .filter((src): src is ImageSourcePropType => Boolean(src))}
                  skipIcon={skipIcon}
                  onSkip={() => skipDay(dayIndex)}
                  onPostpone={() => postponeDay(dayIndex, shifted + 1)}
                  onUndo={() => ex && clearException(ex.id)}
                />
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
        </Reveal>
      ) : null}

      {active ? (
        <Reveal index={2} style={styles.section}>
          <SectionHeader title={t('orders.current')} />

          {/* Same teal, laid flat — `tealMid` is the midpoint of the two stops
              the gradient used to run between, so the card keeps its colour and
              loses only the sheen. */}
          <View style={[styles.planCard, styles.orderCard, shadow.raised]}>
            <PatternFill />
            <View style={styles.planHead}>
              <View style={styles.planText}>
                <Text style={styles.planName}>{`#${formatNumber(active.id)}`}</Text>
                <Text style={styles.planMeta}>
                  {`${whenLabel(active)} · ${formatNumber(orderItemCount(active))} ${t('orders.items')}`}
                </Text>
              </View>
              <View style={styles.statusPillOnDark}>
                <LiveDot />
                <Text style={styles.statusTextOnDark}>{t(`track.step.${DEFAULT_TRACKING}`)}</Text>
              </View>
            </View>

            <Text style={styles.activeItems} numberOfLines={2}>
              {summarize(active)}
            </Text>

            <View style={styles.totalRow}>
              <Text style={styles.total}>{groupNumber(orderGrandTotal(active))}</Text>
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
          </View>
        </Reveal>
      ) : null}

      {subscription && subscriptionMeals.length > 0 ? (
        <Reveal index={3} style={styles.section}>
          <SectionHeader title={t('orders.upcomingMeals')} />
          {/* Opens on the next drop rather than on day one — three weeks in,
              the plan's first week is history. */}
          <UpcomingMeals
            plan={subscription}
            meals={subscriptionMeals}
            fromDay={progress?.elapsedDays ?? 0}
            onPressMeal={(id) => navigation.navigate('DishDetail', { id })}
          />
        </Reveal>
      ) : null}

      {/* History collapses to one recessed card. Past deliveries are reference
          material, not something to scroll past on the way to the live order —
          the filtered list behind it is where you go looking for one. */}
      {past.length > 0 ? (
        <Reveal index={3} style={styles.section}>
          <Card
            padding={spacing.xl}
            background={colors.sandChip}
            onPress={() => navigation.navigate('PastOrders')}
            accessibilityLabel={`${t('orders.past')} · ${formatNumber(past.length)}`}
            style={styles.pastCard}
          >
            <View style={styles.archiveRow}>
              <View style={styles.archiveIcon}>
                <Icon path={icons.receipt} size={18} color={colors.muted} strokeWidth={1.9} />
              </View>

              <View style={styles.archiveText}>
                <Text style={styles.archiveTitle}>{t('orders.past')}</Text>
                <Text style={styles.archiveMeta} numberOfLines={1}>
                  {`${formatNumber(past.length)} ${t('orders.past.count')} · ${t('orders.past.latest')} ${whenLabel(past[0])}`}
                </Text>
              </View>

              <Icon
                path={isRTL ? icons.chevronLeft : icons.chevronRight}
                size={15}
                color={colors.faint}
                strokeWidth={2.2}
              />
            </View>
          </Card>
        </Reveal>
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
  empty: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.giant,
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.sandChip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    ...type.h3,
    color: colors.ink,
    textAlign: 'center',
  },
  emptySub: {
    ...type.body,
    color: colors.muted2,
    textAlign: 'center',
  },
  planCard: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxxl,
    gap: spacing.xl,
  },
  orderCard: {
    backgroundColor: colors.tealMid,
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
  statusTextOnDark: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
  activeItems: {
    ...type.body,
    color: overlay.white90,
  },
  // Progress is measured in delivery days, not calendar days — a Sat-to-Wed
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
    backgroundColor: colors.card,
  },
  // Painted over the resting card and faded in, so a skip reads as the row
  // changing state rather than as a different row appearing.
  dayFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.card,
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
    fontSize: 13.5,
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
    fontSize: 12.5,
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
    backgroundColor: colors.card,
  },
  actionOff: {
    opacity: 0.5,
  },
  cancel: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.coral,
    textAlign: 'center',
  },
  // Recessed rather than white: it sits on the page as an archive drawer, not
  // as another live card competing with the order above it.
  pastCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  archiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  archiveIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveText: {
    flex: 1,
    gap: 2,
  },
  archiveTitle: {
    ...type.bodyStrong,
    color: colors.muted,
  },
  archiveMeta: {
    ...type.caption,
    color: colors.faint,
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
});
