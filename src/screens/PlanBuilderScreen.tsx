import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Chip from '../components/Chip';
import Dialog from '../components/Dialog';
import Button from '../components/Button';
import MealRow from '../components/MealRow';
import MacroRow from '../components/MacroRow';
import PricePill from '../components/PricePill';
import PressScale from '../components/PressScale';
import SlotBar from '../components/SlotBar';
import { colors, fonts, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { cycleNoteKey, rotationDays, usePlan } from '../state/PlanContext';
import {
  type BoxGoal,
  type Course,
  MAX_SLOTS,
  dishes,
  formatPrice,
  getDish,
  groupNumber,
  macros as dishMacros,
  menuCourses,
  slotLabel,
} from '../data/menu';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const SCRIM = [scrim.heroFade, scrim.hero] as const;

type Filter = Course | 'all';

export default function PlanBuilderScreen({
  route,
  navigation,
}: RootStackScreenProps<'PlanBuilder'>) {
  const boxId = route.params?.boxId;
  const { t, lang, isRTL } = useLanguage();
  const { plan, meals, pricing, startFromBox, toggleDish, addSlot, removeSlot, moveSlot } =
    usePlan();

  const scroller = useRef<ScrollView>(null);
  // One step per meal time the plan delivers: breakfast, then lunch, then
  // dinner. Choosing is per-slot rather than into one flat basket, so the
  // customer is only ever answering "what do I eat at this time of day".
  const steps = plan.mealSlots;
  const [step, setStep] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (boxId && plan.boxId !== boxId) startFromBox(boxId as BoxGoal);
  }, [boxId, plan.boxId, startFromBox]);

  // A saver can drop a meal time out from under the current step.
  useEffect(() => {
    setStep((i) => Math.min(i, Math.max(0, steps.length - 1)));
  }, [steps.length]);

  const current = steps[step] ?? steps[0];
  const slot = current?.id ?? '';
  const slotName = current ? slotLabel(current, t) : '';
  const last = step >= steps.length - 1;

  const forSlot = useMemo(
    () => meals.filter((meal) => plan.slots[meal.dishId] === slot),
    [meals, plan.slots, slot],
  );

  // What the picks add up to, read as the customer will eat them: the rotation
  // dealt into days. It sits under the picker so choosing a dish for one meal
  // time immediately shows which day it lands on.
  const [day, setDay] = useState(0);
  const days = useMemo(() => rotationDays(plan, meals), [plan, meals]);
  const activeDay = Math.min(day, Math.max(0, days.length - 1));
  const cycleNote = t(cycleNoteKey(days.length)).replace('{n}', formatNumber(days.length));

  // Finishing is a fork, not an exit: the rotation can either stay as it is and
  // repeat, or grow another day. What the customer has already assembled counts
  // as a day even if they skipped a meal time, so the offer is always the next
  // day up — `rotationDays` rounds up for exactly that reason.
  const [finishing, setFinishing] = useState(false);
  const perDay = steps.length;
  const builtDays = Math.max(1, days.length);

  const slotMacros = useMemo(
    () =>
      forSlot.reduce(
        (acc, meal) => ({
          calories: acc.calories + meal.macros.calories,
          protein: acc.protein + meal.macros.protein,
          carbs: acc.carbs + meal.macros.carbs,
          fat: acc.fat + meal.macros.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [forSlot],
  );

  const shown = useMemo(
    () => (filter === 'all' ? dishes : dishes.filter((d) => d.course === filter)),
    [filter],
  );

  const goto = (next: number) => {
    setStep(next);
    setFilter('all');
    scroller.current?.scrollTo({ y: 0, animated: true });
  };

  const commitSlot = () => {
    const label = draft.trim();
    if (!label) return;
    addSlot(label);
    setDraft('');
    setNaming(false);
    // The new slot is appended, so land on it — naming a time and then having
    // to hunt for it would be the wrong reward for the effort.
    goto(steps.length);
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
          <Text style={styles.title}>{t('builder.title')}</Text>
          <Text style={styles.subtitle}>
            {t('builder.step')
              .replace('{n}', formatNumber(step + 1))
              .replace('{total}', formatNumber(steps.length))}
          </Text>
        </View>
      </View>

      {/* Tappable so a slot that is already filled can be revisited without
          walking the whole sequence backwards. */}
      <SlotBar
        slots={steps}
        activeIndex={step}
        filled={(slot) => plan.dishIds.some((id) => plan.slots[id] === slot.id)}
        onSelect={goto}
        onMove={(from, to) => {
          moveSlot(from, to);
          // Follow the pill that moved rather than staying on whatever slid
          // into the old position.
          setStep(step === from ? to : step);
        }}
        onDelete={(slotId) => {
          removeSlot(slotId);
          setStep((i) => Math.max(0, Math.min(i, steps.length - 2)));
        }}
        onAdd={() => setNaming(true)}
        canAdd={steps.length < MAX_SLOTS}
      />

      {naming ? (
        <View style={styles.namer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('builder.slotName')}
            placeholderTextColor={colors.faint}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={commitSlot}
            accessibilityLabel={t('builder.addSlot')}
            style={[styles.namerInput, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}
          />
          <Button label={t('builder.slotAdd')} size="sm" disabled={!draft.trim()} onPress={commitSlot} />
          <Button
            label={t('builder.slotCancel')}
            variant="ghost"
            size="sm"
            onPress={() => {
              setDraft('');
              setNaming(false);
            }}
          />
        </View>
      ) : null}

      <ScrollView
        ref={scroller}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.slotHead}>
            <Text style={styles.slotTitle}>
              {t('builder.forSlot').replace('{slot}', slotName)}
            </Text>
            <View style={styles.slotActions}>
              <Text style={styles.slotCount}>
                {t('builder.chosen').replace('{n}', formatNumber(forSlot.length))}
              </Text>
              {steps.length > 1 ? (
                <PressScale
                  onPress={() => {
                    removeSlot(slot);
                    goto(Math.max(0, step - 1));
                  }}
                  scaleTo={0.9}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={t('builder.removeSlot')}
                  style={styles.slotRemove}
                >
                  <Icon path={icons.close} size={12} color={colors.muted} strokeWidth={2.6} />
                </PressScale>
              ) : null}
            </View>
          </View>

          {forSlot.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.meals}
              contentContainerStyle={styles.mealsContent}
            >
              {forSlot.map((meal) => (
                <MealRow
                  key={meal.dishId}
                  meal={meal}
                  style={styles.mealCard}
                  onPress={() => navigation.navigate('DishDetail', { id: meal.dishId })}
                  onRemove={() => toggleDish(meal.dishId, slot)}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.slotEmpty}>
              {t('builder.slotEmpty').replace('{slot}', slotName)}
            </Text>
          )}

          {forSlot.length > 0 ? (
            <Card padding={spacing.xl} style={styles.macroCard}>
              <Text style={styles.cardLabel}>
                {t('builder.slotTotal').replace('{slot}', slotName)}
              </Text>
              <MacroRow macros={slotMacros} />
            </Card>
          ) : null}
        </View>

        <View style={styles.section}>
          {menuCourses.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filters}
              contentContainerStyle={styles.filtersContent}
            >
              <Chip
                label={t('course.all')}
                selected={filter === 'all'}
                onPress={() => setFilter('all')}
              />
              {menuCourses.map((course) => (
                <Chip
                  key={course}
                  label={t(`course.${course}`)}
                  selected={filter === course}
                  onPress={() => setFilter(course)}
                />
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.pickerGrid}>
            {shown.map((dish) => {
              const held = plan.dishIds.includes(dish.id);
              const on = held && plan.slots[dish.id] === slot;
              // Held by a different meal time: tapping moves it here.
              const elsewhere = held && !on;
              const heldBy = elsewhere
                ? steps.find((s) => s.id === plan.slots[dish.id])
                : undefined;
              const m = dishMacros[dish.id];
              const name = lang === 'ar' ? dish.name : t(`dish.${dish.id}.name`, dish.name);
              return (
                <TouchableOpacity
                  key={dish.id}
                  activeOpacity={0.85}
                  onPress={() => toggleDish(dish.id, slot)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={name}
                  style={[styles.pick, on ? styles.pickOn : styles.pickOff]}
                >
                  <View style={styles.pickImageWrap}>
                    <Image source={dish.image} style={styles.pickImage} />
                    <LinearGradient
                      colors={SCRIM}
                      locations={[0.45, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={[styles.pickBadge, on ? styles.pickBadgeOn : styles.pickBadgeOff]}>
                      <Icon
                        path={on ? icons.check : icons.plus}
                        size={13}
                        color={on ? colors.white : colors.ink}
                        strokeWidth={2.6}
                      />
                    </View>
                    <Text style={styles.pickName} numberOfLines={1}>
                      {name}
                    </Text>
                  </View>
                  <View style={styles.pickBody}>
                    {elsewhere ? (
                      <Text style={styles.pickTaken} numberOfLines={1}>
                        {t('builder.movedFrom').replace('{slot}', heldBy ? slotLabel(heldBy, t) : '')}
                      </Text>
                    ) : null}
                    {m ? <MacroRow macros={m} size="sm" /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {days.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.rotationLabel}>{t('rotation.preview')}</Text>

            {days.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filters}
                contentContainerStyle={styles.filtersContent}
              >
                {days.map((_, i) => (
                  <Chip
                    key={`day-${i}`}
                    label={t('rotation.day').replace('{n}', formatNumber(i + 1))}
                    selected={i === activeDay}
                    onPress={() => setDay(i)}
                  />
                ))}
              </ScrollView>
            ) : null}

            <Text style={styles.rotationCycle}>{cycleNote}</Text>

            <Card padding={spacing.xl} style={styles.rotationCard}>
              {(days[activeDay] ?? []).map((meal, slotIndex) => {
                const daySlot = steps[slotIndex];
                const dish = getDish(meal.dishId);
                const dishName = dish
                  ? lang === 'ar'
                    ? dish.name
                    : t(`dish.${meal.dishId}.name`, dish.name)
                  : meal.dishId;
                return (
                  <TouchableOpacity
                    key={meal.dishId}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('DishDetail', { id: meal.dishId })}
                    accessibilityRole="button"
                    accessibilityLabel={dishName}
                    style={styles.rotationRow}
                  >
                    <Icon
                      path={icons[daySlot?.icon ?? 'clock']}
                      size={14}
                      color={colors.muted2}
                      strokeWidth={2}
                    />
                    <Text style={styles.rotationSlot} numberOfLines={1}>
                      {daySlot ? slotLabel(daySlot, t) : ''}
                    </Text>
                    <Text style={styles.rotationDish} numberOfLines={1}>
                      {dishName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t('customize.perMeal')}</Text>
          {plan.dishIds.length > 0 ? (
            <PricePill value={formatPrice(groupNumber(pricing.perMeal), lang)} />
          ) : (
            <Text style={styles.priceEmpty}>{t('builder.pickFirst')}</Text>
          )}
        </View>
        <View style={styles.navRow}>
          {step > 0 ? (
            <Button
              label={t('builder.prev')}
              variant="outline"
              size="lg"
              onPress={() => goto(step - 1)}
              style={styles.navPrev}
            />
          ) : null}
          <Button
            label={last ? t('builder.finish') : t('builder.next')}
            variant="primary"
            size="lg"
            disabled={plan.dishIds.length === 0}
            onPress={() => (last ? setFinishing(true) : goto(step + 1))}
            style={styles.navNext}
          />
        </View>
      </View>

      <Dialog
        visible={finishing}
        title={t('builder.dayDone').replace('{n}', formatNumber(builtDays))}
        message={t('builder.dayDoneSub').replace('{n}', formatNumber(perDay))}
        primaryLabel={t('builder.addAnotherDay').replace('{n}', formatNumber(builtDays + 1))}
        onPrimary={() => {
          setFinishing(false);
          // Back to the first meal time — another day is another pick in each
          // slot, walked in the same order as the first.
          goto(0);
        }}
        secondaryLabel={t('builder.repeatDay')}
        onSecondary={() => {
          setFinishing(false);
          navigation.navigate('Subscribe');
        }}
        onClose={() => setFinishing(false)}
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
    paddingBottom: spacing.xl,
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
  headerText: {
    flex: 1,
    gap: 1,
  },
  title: {
    ...type.h1,
    color: colors.ink,
  },
  subtitle: {
    ...type.caption,
    color: colors.muted,
  },
  namer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.xl,
  },
  namerInput: {
    flex: 1,
    borderRadius: radius.control,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.ink,
  },
  slotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  slotRemove: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.sandChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.giant,
    gap: spacing.giant,
  },
  section: {
    gap: spacing.xl,
  },
  rotationLabel: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  rotationCycle: {
    ...type.caption,
    color: colors.muted2,
  },
  // One line per meal time rather than the full cards the picker uses above —
  // this is a glance at the shape of the day, not a second place to shop.
  rotationCard: {
    gap: spacing.md,
  },
  rotationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  rotationSlot: {
    ...type.caption,
    color: colors.muted2,
    minWidth: 54,
  },
  rotationDish: {
    ...type.bodyStrong,
    color: colors.ink,
    flex: 1,
  },
  slotHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  slotTitle: {
    ...type.h3,
    color: colors.ink,
  },
  slotCount: {
    ...type.caption,
    color: colors.muted2,
  },
  slotEmpty: {
    ...type.body,
    color: colors.muted2,
  },
  macroCard: {
    gap: spacing.md,
  },
  cardLabel: {
    ...type.caption,
    color: colors.muted,
  },
  meals: {
    marginHorizontal: -spacing.huge,
  },
  mealsContent: {
    paddingHorizontal: spacing.huge,
    // Vertical breathing room so the cards' drop shadow is not clipped by the
    // horizontal scroll frame.
    paddingVertical: spacing.xs,
    gap: spacing.lg,
  },
  mealCard: {
    width: 264,
  },
  filters: {
    flexGrow: 0,
    marginHorizontal: -spacing.huge,
  },
  filtersContent: {
    paddingHorizontal: spacing.huge,
    gap: spacing.md,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  pick: {
    width: '47.5%',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  pickOn: {
    borderColor: colors.teal,
  },
  pickOff: {
    borderColor: colors.sand,
  },
  pickImageWrap: {
    height: 88,
  },
  pickImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.sand,
  },
  pickBadge: {
    position: 'absolute',
    top: 7,
    end: 7,
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickBadgeOn: {
    backgroundColor: colors.teal,
  },
  pickBadgeOff: {
    backgroundColor: colors.card,
  },
  pickName: {
    position: 'absolute',
    bottom: 7,
    start: 9,
    end: 9,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  pickBody: {
    paddingHorizontal: 9,
    paddingVertical: 9,
    gap: spacing.sm,
  },
  pickTaken: {
    ...type.micro,
    color: colors.goldText,
    textAlign: 'center',
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
  },
  priceLabel: {
    ...type.caption,
    color: colors.muted,
  },
  priceEmpty: {
    ...type.caption,
    color: colors.muted2,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  navPrev: {
    flex: 1,
  },
  navNext: {
    flex: 2,
  },
});
