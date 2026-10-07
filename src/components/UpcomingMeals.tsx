import React, { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { icons } from './icons';
import PressScale from './PressScale';
import CalendarSheet from './CalendarSheet';
import { colors, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { dayKeys, getDish } from '../data/menu';
import { type MealLine, type PlanState, deliveryDays, rotationDays } from '../state/PlanContext';

const DAY_MS = 86400000;

export interface UpcomingMealsProps {
  plan: PlanState;
  meals: MealLine[];
  /** Day offset to open on — the next delivery on Orders, day zero elsewhere. */
  fromDay?: number;
  onPressMeal: (dishId: string) => void;
}

// One delivery at a time rather than the whole plan at once: arrows step a day,
// the label opens the calendar for a longer jump. Deliveries cycle through the
// rotation in order, so the k-th delivery eats rotation day k and day one comes
// round again once the rotation runs out.
export default function UpcomingMeals({
  plan,
  meals,
  fromDay = 0,
  onPressMeal,
}: UpcomingMealsProps) {
  const { t, lang, isRTL } = useLanguage();

  // Pinned once per mount, or the label would slide onto a new date if the
  // screen happened to sit open across midnight.
  const today = useRef(Date.now()).current;
  const startAt = plan.startedAt > 0 ? plan.startedAt : today;

  const deliveries = deliveryDays(plan);
  const days = rotationDays(plan, meals);
  const firstIndex = Math.max(0, deliveries.findIndex((d) => d >= fromDay));

  const [pick, setPick] = useState(firstIndex);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // A shortened plan must not strand the selection past the end of the run.
  const index = Math.min(pick, Math.max(0, deliveries.length - 1));
  const offset = deliveries[index] ?? 0;
  const dayMeals = days.length > 0 ? days[index % days.length] : [];

  const date = new Date(startAt + offset * DAY_MS);
  // `dayKeys` runs Sunday-first, the same order JS getDay() numbers the week in.
  const label = `${t('rotation.day').replace('{n}', formatNumber(index + 1))} · ${t(
    dayKeys[date.getDay()],
  )} ${formatNumber(date.getDate())} ${t(`month.${date.getMonth()}`)}`;

  const atStart = index <= 0;
  const atEnd = index >= deliveries.length - 1;

  if (deliveries.length === 0 || dayMeals.length === 0) return null;

  return (
    <>
      <View style={styles.bar}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={atStart}
          onPress={() => setPick(index - 1)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={t('builder.prev')}
          style={[styles.arrow, atStart && styles.arrowOff]}
        >
          <Icon
            path={isRTL ? icons.chevronRight : icons.chevronLeft}
            size={13}
            color={colors.ink}
            strokeWidth={2.4}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setCalendarOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('rotation.pickDay')}
          style={styles.pick}
        >
          <Icon path={icons.calendar} size={14} color={colors.tealText} strokeWidth={2} />
          <Text style={styles.pickText} numberOfLines={1}>
            {label}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={atEnd}
          onPress={() => setPick(index + 1)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={t('builder.next')}
          style={[styles.arrow, atEnd && styles.arrowOff]}
        >
          <Icon
            path={isRTL ? icons.chevronLeft : icons.chevronRight}
            size={13}
            color={colors.ink}
            strokeWidth={2.4}
          />
        </TouchableOpacity>
      </View>

      {/* Bleeds past the host's horizontal padding so the strip runs to both
          edges and reads as scrollable. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.strip}
        contentContainerStyle={styles.stripContent}
      >
        {dayMeals.map((meal, i) => {
          const dish = getDish(meal.dishId);
          if (!dish) return null;
          const name = lang === 'ar' ? dish.name : t(`dish.${dish.id}.name`, dish.name);
          // A day can carry the same dish at two meal times, so the id alone
          // is not a unique key.
          return (
            <PressScale
              key={`${meal.dishId}-${i}`}
              onPress={() => onPressMeal(meal.dishId)}
              accessibilityLabel={name}
              style={styles.card}
            >
              <Image source={dish.image} style={styles.image} />
              <Text style={styles.name} numberOfLines={2}>
                {name}
              </Text>
            </PressScale>
          );
        })}
      </ScrollView>

      <CalendarSheet
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        startAt={startAt}
        deliveries={deliveries}
        selected={offset}
        onSelect={(next) => setPick(Math.max(0, deliveries.indexOf(next)))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Kept in place rather than hidden at the ends of the run, so the bar does
  // not change width as the customer steps through the deliveries.
  arrowOff: {
    opacity: 0.35,
  },
  pick: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: radius.control,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  pickText: {
    ...type.captionStrong,
    color: colors.ink,
    flexShrink: 1,
  },
  strip: {
    marginHorizontal: -spacing.huge,
  },
  stripContent: {
    paddingHorizontal: spacing.huge,
    gap: spacing.xl,
  },
  card: {
    width: 132,
    gap: spacing.md,
  },
  image: {
    width: 132,
    height: 96,
    borderRadius: radius.card,
    backgroundColor: colors.sand,
  },
  name: {
    ...type.captionStrong,
    color: colors.ink,
  },
});
