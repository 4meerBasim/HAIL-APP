import React, { useMemo, useState } from 'react';
import { Animated, ImageSourcePropType, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { type IconPath, icons } from './icons';
import Dialog from './Dialog';
import PressScale from './PressScale';
import { useReveal, useToggle } from '../animation';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useOrderText } from '../i18n/orderText';
import { formatNumber } from '../i18n/digits';
import { MAX_POSTPONE_DAYS, dayKeys, getDish, slotLabel } from '../data/menu';
import {
  planProgress,
  postponedBy,
  postponedOffPlan,
  rotationDays,
  upcomingDeliveries,
  usePlan,
  weekdayOf,
} from '../state/PlanContext';

interface DayMeal {
  dishId: string;
  name: string;
  image?: ImageSourcePropType;
}

interface DayRowProps {
  index: number;
  label: string;
  meals: DayMeal[];
  statusText: string;
  exKind?: 'skip' | 'postpone';
  next: boolean;
  canPostponeMore: boolean;
  skipIcon: IconPath;
  onSkip: () => void;
  onPostpone: () => void;
  onUndo: () => void;
  onPressMeal: (dishId: string) => void;
}

// Skipping or postponing repaints the whole row, so the tint and the thumbnails
// cross-fade together rather than snapping between two states.
function DayRow({
  index,
  label,
  meals,
  statusText,
  exKind,
  next,
  canPostponeMore,
  skipIcon,
  onSkip,
  onPostpone,
  onUndo,
  onPressMeal,
}: DayRowProps) {
  const { t } = useLanguage();
  const reveal = useReveal(index);
  const anim = useToggle(Boolean(exKind));
  const dim = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });
  const hit = { top: 6, bottom: 6, left: 6, right: 6 };
  const names = meals.map((m) => m.name).join(' + ');
  const thumbs = meals.filter((m) => m.image);

  // The card opens the day's first meal and the thumbnails open their own, but
  // either way the detail page is handed the whole day — so a day of two or
  // three is paged through there rather than being a dead end on one dish.
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={meals.length === 0}
      onPress={() => onPressMeal(meals[0].dishId)}
      accessibilityRole="button"
      accessibilityLabel={names}
    >
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
                  size={14}
                  color={canPostponeMore ? colors.muted : colors.faint2}
                  strokeWidth={2}
                />
                <Text
                  style={[styles.actionText, !canPostponeMore && styles.actionTextOff]}
                  numberOfLines={1}
                >
                  {t('orders.postpone')}
                </Text>
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
                <Icon path={icons.undo} size={14} color={colors.muted} strokeWidth={2} />
                <Text style={styles.actionText} numberOfLines={1}>
                  {t('orders.undo')}
                </Text>
              </PressScale>
            ) : (
              <PressScale
                onPress={onSkip}
                scaleTo={0.88}
                hitSlop={hit}
                accessibilityLabel={t('common.skipDay')}
                style={styles.action}
              >
                <Icon path={skipIcon} size={14} color={colors.muted} strokeWidth={2} />
                <Text style={styles.actionText} numberOfLines={1}>
                  {t('orders.skip')}
                </Text>
              </PressScale>
            )}
          </View>
        </View>

        {/* Each thumbnail opens its own dish, which the card press cannot do:
            the name line is every meal of the day joined together. */}
        {thumbs.length > 0 ? (
          <View style={styles.thumbs}>
            {thumbs.map((meal, k) => (
              <PressScale
                key={k}
                onPress={() => onPressMeal(meal.dishId)}
                scaleTo={0.9}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                accessibilityLabel={meal.name}
              >
                <Animated.Image source={meal.image} style={[styles.thumb, { opacity: dim }]} />
              </PressScale>
            ))}
          </View>
        ) : null}
      </Animated.View>
    </TouchableOpacity>
  );
}

export interface UpcomingDaysProps {
  /** Skip this many upcoming days before the first row rendered. */
  from?: number;
  /** How many delivery days to render — the whole remaining run when left out. */
  count?: number;
  /** Reveal stagger offset, so the rows follow whatever card sits above them. */
  revealFrom?: number;
  onPressMeal: (dishId: string, siblings: string[]) => void;
}

// The next deliveries and the two things that can be done to one: skip it, or
// push it back a day. Orders shows the first few and the full run lives on its
// own screen, so the list itself reads the plan rather than being handed one.
export default function UpcomingDays({
  from = 0,
  count: howMany = Infinity,
  revealFrom = 0,
  onPressMeal,
}: UpcomingDaysProps) {
  // Skipping and postponing both change what arrives and neither can be worked
  // out from the icon alone, so each is asked first — and the question says
  // what the answer will actually do to the plan.
  const [ask, setAsk] = useState<{
    kind: 'skip' | 'postpone';
    dayIndex: number;
    day: string;
    shifted: number;
    offPlan: boolean;
  } | null>(null);
  const { t, isRTL } = useLanguage();
  const { dishName } = useOrderText();
  const { subscription, subscriptionMeals, now, skipDay, postponeDay, clearException } = usePlan();

  // Anchored to today rather than to day zero: a subscription three weeks in
  // would otherwise still list its first week as "upcoming".
  const progress = useMemo(
    () => (subscription ? planProgress(subscription, now) : null),
    [subscription, now],
  );

  const days = useMemo(
    () =>
      subscription && progress
        ? upcomingDeliveries(subscription, progress.elapsedDays, from + howMany).slice(from)
        : [],
    [subscription, progress, from, howMany],
  );

  // The plan's own day grid, so a day lists what was built for it rather than
  // the flat rotation chopped into equal lengths.
  const rotation = useMemo(
    () => (subscription ? rotationDays(subscription, subscriptionMeals) : []),
    [subscription, subscriptionMeals],
  );

  if (!subscription || days.length === 0) return null;

  const skipIcon = isRTL ? icons.skipBack : icons.skipForward;

  return (
    <View style={styles.days}>
      {days.map(({ dayIndex, at, nth, dropped }, i) => {
        // Placed by its position in the whole run, not by the first row
        // rendered: the k-th delivery since the plan started eats rotation day
        // k, so a list that starts part-way through still lands on the right one.
        const slot = from + i;
        // Keyed by the day it was scheduled for — a postponed delivery arrives
        // on another day, but its exception, and its Undo, stay with this one.
        const ex = subscription.exceptions.find((e) => e.dayIndex === dayIndex);
        const dayMeals = rotation.length > 0 ? rotation[nth % rotation.length] : [];
        const rowMeals: DayMeal[] = dayMeals.map((m) => ({
          dishId: m.dishId,
          name: dishName(m.dishId),
          image: getDish(m.dishId)?.image,
        }));
        const shifted = postponedBy(subscription, dayIndex);
        const offPlan = postponedOffPlan(subscription, dayIndex);
        const day = t(dayKeys[weekdayOf(subscription, at)]);

        return (
          <DayRow
            key={dayIndex}
            index={revealFrom + slot}
            label={day}
            meals={rowMeals}
            statusText={
              ex
                ? ex.kind === 'skip'
                  ? t('orders.skipped')
                  : `${t(offPlan ? 'orders.pushedOff' : 'orders.postponed')} +${formatNumber(shifted)} ${t('unit.days')}`
                : subscription.mealSlots.map((s) => slotLabel(s, t)).join(' · ')
            }
            exKind={ex?.kind}
            next={slot === 0 && !dropped && !ex}
            canPostponeMore={shifted < MAX_POSTPONE_DAYS}
            skipIcon={skipIcon}
            onSkip={() =>
              setAsk({
                kind: 'skip',
                dayIndex,
                day,
                shifted,
                offPlan,
              })
            }
            onPostpone={() =>
              setAsk({
                kind: 'postpone',
                dayIndex,
                day,
                shifted,
                // One more day than it already carries: if that lands past the
                // end of the run, the day is gone rather than moved, and the
                // question has to say so.
                offPlan: dayIndex + shifted + 1 >= subscription.dayCount,
              })
            }
            onUndo={() => ex && clearException(ex.id)}
            onPressMeal={(id) => onPressMeal(id, rowMeals.map((m) => m.dishId))}
          />
        );
      })}

      <Dialog
        visible={ask !== null}
        title={t(ask?.kind === 'skip' ? 'orders.skip.title' : 'orders.postpone.title')}
        message={
          ask
            ? (ask.kind === 'skip'
                ? t('orders.skip.message')
                : t(ask.offPlan ? 'orders.postpone.offPlan' : 'orders.postpone.message')
              )
                .replace('{day}', ask.day)
                .replace('{n}', formatNumber(MAX_POSTPONE_DAYS))
            : ''
        }
        primaryLabel={t('common.cancel')}
        onPrimary={() => setAsk(null)}
        secondaryLabel={t(
          ask?.kind === 'skip' ? 'orders.skip.confirm' : 'orders.postpone.confirm',
        )}
        onSecondary={() => {
          if (!ask) return;
          if (ask.kind === 'skip') skipDay(ask.dayIndex);
          else postponeDay(ask.dayIndex, ask.shifted + 1);
          setAsk(null);
        }}
        onClose={() => setAsk(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  // Labelled, not a bare glyph. A clock on its own reads as "when is this", a
  // skip arrow as "next" — neither says that the tap moves or cancels a
  // delivery. The word is the control; the icon only decorates it.
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.sandChip,
    paddingHorizontal: spacing.md,
  },
  actionText: {
    ...type.micro,
    color: colors.muted,
    textAlign: 'auto',
  },
  actionTextOff: {
    color: colors.faint2,
  },
  actionOnTint: {
    backgroundColor: colors.card,
  },
  actionOff: {
    opacity: 0.5,
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
