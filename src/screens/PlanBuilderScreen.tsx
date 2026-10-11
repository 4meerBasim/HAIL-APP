import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  type ListRenderItem,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Chip from '../components/Chip';
import Button from '../components/Button';
import MealRow from '../components/MealRow';
import MacroRow from '../components/MacroRow';
import PricePill from '../components/PricePill';
import Dialog from '../components/Dialog';
import PressScale from '../components/PressScale';
import SlotBar from '../components/SlotBar';
import SlotSheet from '../components/SlotSheet';
import { colors, fonts, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { cycleNoteKey, gridOf, usePlan } from '../state/PlanContext';
import {
  type BoxGoal,
  type Dish,
  MAX_SLOTS,
  type Macros,
  dishesOfCourse,
  formatPrice,
  getDish,
  groupNumber,
  macros as dishMacros,
  slotLabel,
} from '../data/menu';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const SCRIM = [scrim.heroFade, scrim.hero] as const;
const SCRIM_LOCATIONS = [0.45, 1] as const;

const PICK_STATE_ON = { selected: true } as const;
const PICK_STATE_OFF = { selected: false } as const;

// A plan is built out of meals. Sweets, drinks and the build-your-own line are
// dishes too, and listing them here put juice cards in the meal picker.
const MAINS = dishesOfCourse('main');

// Diet, not course: with only mains on offer, a course filter has one bucket.
// These are the same four the menu filters by, so the vocabulary matches.
const FILTERS = ['all', 'h', 'r', 'pop'] as const;
type PickFilter = (typeof FILTERS)[number];

const FILTER_LABEL: Record<PickFilter, string> = {
  all: 'filter.all',
  h: 'filter.healthy',
  r: 'filter.regular',
  pop: 'filter.mostOrdered',
};

type PickCardProps = {
  dishId: string;
  name: string;
  image: Dish['image'];
  macros: Macros | undefined;
  selected: boolean;
  takenLabel?: string;
  onPress: (dishId: string) => void;
};

// One grid cell. Memoised so that picking a dish re-renders only the cards whose
// props actually change, not every card in the window. The press handler and the
// selected/badge styles are stable references, so an unchanged card bails out of
// the re-render entirely.
const PickCard = React.memo(function PickCard({
  dishId,
  name,
  image,
  macros,
  selected,
  takenLabel,
  onPress,
}: PickCardProps) {
  const press = useCallback(() => onPress(dishId), [onPress, dishId]);
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={press}
      accessibilityRole="button"
      accessibilityState={selected ? PICK_STATE_ON : PICK_STATE_OFF}
      accessibilityLabel={name}
      style={selected ? PICK_ON : PICK_OFF}
    >
      <View style={styles.pickImageWrap}>
        <Image source={image} style={styles.pickImage} />
        <LinearGradient colors={SCRIM} locations={SCRIM_LOCATIONS} style={StyleSheet.absoluteFill} />
        <View style={selected ? PICK_BADGE_ON : PICK_BADGE_OFF}>
          <Icon
            path={selected ? icons.check : icons.plus}
            size={13}
            color={selected ? colors.white : colors.ink}
            strokeWidth={2.6}
          />
        </View>
        <Text style={styles.pickName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={styles.pickBody}>
        {takenLabel ? (
          <Text style={styles.pickTaken} numberOfLines={1}>
            {takenLabel}
          </Text>
        ) : null}
        {macros ? <MacroRow macros={macros} size="sm" /> : null}
      </View>
    </TouchableOpacity>
  );
});

export default function PlanBuilderScreen({
  route,
  navigation,
}: RootStackScreenProps<'PlanBuilder'>) {
  const boxId = route.params?.boxId;
  const { t, lang } = useLanguage();
  const {
    plan,
    meals,
    pricing,
    startFromBox,
    setDayDish,
    addDay,
    removeDay,
    pruneDays,
    addSlot,
    updateSlot,
    removeSlot,
  } =
    usePlan();

  const scroller = useRef<FlatList<Dish>>(null);
  // One step per meal time the plan delivers: breakfast, then lunch, then
  // dinner. Choosing is per-slot rather than into one flat basket, so the
  // customer is only ever answering "what do I eat at this time of day".
  const steps = plan.mealSlots;
  const [step, setStep] = useState(0);
  const [filter, setFilter] = useState<PickFilter>('all');
  // null = the sheet is closed; 'new' = adding; otherwise the slot id edited.
  const [editing, setEditing] = useState<string | null>(null);
  // The meal time whose delete is waiting on a yes.
  const [dropping, setDropping] = useState<string | null>(null);
  // Adding or re-timing a meal time re-sorts the row by clock, so the index a
  // slot had a moment ago is not where it is now. The step follows the slot by
  // id instead: a known one after an edit, or whichever id is new after an add.
  const [follow, setFollow] = useState<{ id: string } | { before: string[] } | null>(null);

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

  // The rotation as a grid: one row per day, one cell per meal time. Picking a
  // dish fills the cell for the day on screen, so the same dish can come round
  // again on another day without the two competing for one slot.
  const grid = useMemo(() => gridOf(plan), [plan]);
  const [day, setDay] = useState(0);
  const activeDay = Math.min(day, Math.max(0, grid.length - 1));
  const cell = useMemo(() => grid[activeDay]?.[step] ?? [], [grid, activeDay, step]);

  // Everything on this day at this meal time, in the order it was picked. A
  // meal time holds as many dishes as the customer chooses, and each is its own
  // meal — so a dish picked twice appears twice.
  const forSlot = useMemo(
    () =>
      cell
        .map((id) => meals.find((meal) => meal.dishId === id))
        .filter((meal): meal is (typeof meals)[number] => Boolean(meal)),
    [meals, cell],
  );

  const cycleNote = t(cycleNoteKey(grid.length)).replace('{n}', formatNumber(grid.length));

  // A day is delivered whole or not at all, so a day with a meal time still
  // empty cannot go to checkout as it stands.
  // An empty cell is an empty array, not a null — truthiness would say every
  // meal time was filled the moment the grid existed.
  const unfinished = useMemo(
    () => grid.filter((row) => row.some((cell) => cell.length === 0)).length,
    [grid],
  );
  const [asking, setAsking] = useState<'prune' | 'none' | null>(null);

  // The walk runs along the day, then down to the next one: day one's lunch,
  // day one's dinner, day two's lunch. The last meal of the last day is the end
  // of the build.
  const onLastCell = last && activeDay >= grid.length - 1;

  const advance = () => {
    if (!last) {
      goto(step + 1);
      return;
    }
    if (activeDay < grid.length - 1) {
      setDay(activeDay + 1);
      goto(0);
      return;
    }
    finish();
  };

  const finish = () => {
    if (unfinished === grid.length) {
      setAsking('none');
      return;
    }
    if (unfinished > 0) {
      setAsking('prune');
      return;
    }
    navigation.navigate('Subscribe');
  };

  // Finishing is a fork, not an exit: the rotation can either stay as it is and
  // repeat, or grow another day. What the customer has already assembled counts
  // as a day even if they skipped a meal time, so the offer is always the next
  // day up — `rotationDays` rounds up for exactly that reason.

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
    () =>
      MAINS.filter((d) => {
        if (filter === 'all') return true;
        if (filter === 'pop') return d.pop;
        return d.cat === filter;
      }),
    [filter],
  );

  const goto = (next: number) => {
    setStep(next);
    setFilter('all');
    scroller.current?.scrollToOffset({ offset: 0, animated: true });
  };

  useEffect(() => {
    if (!follow) return;
    setFollow(null);
    if ('id' in follow) {
      const i = steps.findIndex((s) => s.id === follow.id);
      if (i >= 0) setStep(i);
      return;
    }
    // Nothing new means the add was refused — the row was already full.
    const i = steps.findIndex((s) => !follow.before.includes(s.id));
    if (i >= 0) goto(i);
    // `goto` is rebuilt every render and only ever closes over setters and a
    // ref, so the slot list is the one thing this has to wait on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [follow, steps]);

  const editingSlot = editing && editing !== 'new' ? steps.find((s) => s.id === editing) : null;

  const commitSlot = (name: string, time: number) => {
    if (editing === 'new') {
      addSlot(name, time);
      // Land on the new slot — naming a time and then having to hunt for it
      // would be the wrong reward for the effort.
      setFollow({ before: steps.map((s) => s.id) });
    } else if (editing) {
      updateSlot(editing, { name, time });
      setFollow({ id: editing });
    }
    setEditing(null);
  };

  const handlePick = useCallback(
    (dishId: string) => setDayDish(activeDay, step, dishId),
    [setDayDish, activeDay, step],
  );

  const keyExtractor = useCallback((dish: Dish) => dish.id, []);

  const renderPick = useCallback<ListRenderItem<Dish>>(
    ({ item: dish }) => {
      const on = cell.includes(dish.id);
      // On the plan, but at another meal time or on another day: the rotation
      // may repeat a dish, so this is a note, not a warning.
      const elsewhere = !on && plan.dishIds.includes(dish.id);
      const heldBy = elsewhere ? steps.find((st) => st.id === plan.slots[dish.id]) : undefined;
      const name = lang === 'ar' ? dish.name : t(`dish.${dish.id}.name`, dish.name);
      const takenLabel = elsewhere
        ? t('builder.movedFrom').replace('{slot}', heldBy ? slotLabel(heldBy, t) : '')
        : undefined;
      return (
        <PickCard
          dishId={dish.id}
          name={name}
          image={dish.image}
          macros={dishMacros[dish.id]}
          selected={on}
          takenLabel={takenLabel}
          onPress={handlePick}
        />
      );
    },
    [cell, plan.dishIds, plan.slots, steps, lang, t, handlePick],
  );

  // Everything above and below the dish grid rides in the list's header and
  // footer, so the grid is the screen's one vertical scroller: a real
  // `FlatList` window rather than a same-orientation list nested in a
  // `ScrollView`. Built as plain elements so selection re-renders them in place
  // without remounting the horizontal day/filter rails or losing their offset.
  const listHeader = (
    <View style={styles.headerBlock}>
      {/* Days first, meal times under them: the customer builds Sunday's
          lunch and Sunday's dinner, then moves to the next day. One or two
          days built is a rotation that repeats for the length of the
          subscription — the schedule starts it again once it runs out. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.days}
        contentContainerStyle={styles.daysContent}
      >
        {grid.map((row, i) => (
          <Chip
            key={`day-${i}`}
            label={t('builder.day').replace('{n}', formatNumber(i + 1))}
            sublabel={t('builder.dayFilled')
              .replace('{n}', formatNumber(row.filter((cell) => cell.length > 0).length))
              .replace('{total}', formatNumber(steps.length))}
            selected={i === activeDay}
            onPress={() => setDay(i)}
            shape="rounded"
          />
        ))}

        <PressScale
          onPress={addDay}
          accessibilityRole="button"
          accessibilityLabel={t('builder.addDay')}
          style={styles.addDay}
        >
          <Icon path={icons.plus} size={14} color={colors.tealText} strokeWidth={2.6} />
        </PressScale>

        {grid.length > 1 ? (
          <PressScale
            onPress={() => {
              removeDay(activeDay);
              setDay((d) => Math.max(0, d - 1));
            }}
            accessibilityRole="button"
            accessibilityLabel={t('builder.removeDay')}
            style={styles.dropDay}
          >
            <Icon path={icons.close} size={13} color={colors.coral} strokeWidth={2.6} />
          </PressScale>
        ) : null}
      </ScrollView>

      {/* Tappable so a slot that is already filled can be revisited without
          walking the whole sequence backwards. */}
      <View style={styles.bleed}>
        <SlotBar
          slots={steps}
          activeIndex={step}
          filled={(_slot, i) => (grid[activeDay]?.[i]?.length ?? 0) > 0}
          // Tapping a pill that is not the current step selects it; tapping the
          // one already selected opens its name and time. The row has to stay
          // the step navigator, so "edit" only gets the tap once there is
          // nothing left for it to select.
          onSelect={(i) => (i === step ? setEditing(steps[i].id) : goto(i))}
          onAdd={() => setEditing('new')}
          canAdd={steps.length < MAX_SLOTS}
        />
      </View>

      <View style={styles.section}>
        {/* Title and delete share one line, so the control is plainly on the
            same row as the thing it acts on. The delivery time is not
            repeated here — the pill above already carries it. */}
        <View style={styles.slotTitleRow}>
          {/* Tapping a pill above selects it, so renaming and re-timing needs
              an affordance of its own rather than a second meaning for a
              tap. */}
          <PressScale
            onPress={() => setEditing(slot)}
            scaleTo={0.98}
            accessibilityRole="button"
            accessibilityLabel={t('slot.edit')}
            style={styles.slotTitleTap}
          >
            <Text style={styles.slotTitle} numberOfLines={1}>
              {t('builder.forSlot').replace('{slot}', slotName)}
            </Text>
          </PressScale>

          {/* Named, not just drawn: a trash glyph on its own could as easily
              mean "clear the dishes I picked" or "drop this day". Spelling
              out the meal it removes is the whole difference. */}
          {steps.length > 1 ? (
            <PressScale
              onPress={() => setDropping(slot)}
              scaleTo={0.94}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={t('builder.removeSlot').replace('{slot}', slotName)}
              style={styles.slotRemove}
            >
              <Icon path={icons.trash} size={13} color={colors.coral} strokeWidth={1.9} />
              <Text style={styles.slotRemoveText} numberOfLines={1}>
                {t('builder.removeSlot').replace('{slot}', slotName)}
              </Text>
            </PressScale>
          ) : null}
        </View>

        {forSlot.length === 0 ? (
          <Text style={styles.slotEmpty}>
            {t('builder.slotEmpty').replace('{slot}', slotName)}
          </Text>
        ) : forSlot.length === 1 ? (
          // A single pick fills the content width so it lines up with the
          // meal-time total card below it, rather than a lone fixed-width card
          // leaving a gap at the end edge. Several still scroll horizontally.
          <MealRow
            meal={forSlot[0]}
            onPress={() =>
              navigation.navigate('DishDetail', {
                id: forSlot[0].dishId,
                fromPlan: true,
                building: true,
              })
            }
            onRemove={() => setDayDish(activeDay, step, forSlot[0].dishId)}
          />
        ) : (
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
                onPress={() =>
                  navigation.navigate('DishDetail', { id: meal.dishId, fromPlan: true, building: true })
                }
                onRemove={() => setDayDish(activeDay, step, meal.dishId)}
              />
            ))}
          </ScrollView>
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

      {FILTERS.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filters}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map((key) => (
            <Chip
              key={key}
              label={t(FILTER_LABEL[key])}
              selected={filter === key}
              onPress={() => setFilter(key)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  const listFooter =
    grid.length > 0 ? (
      <View style={styles.rotationSection}>
        <Text style={styles.rotationLabel}>{t('rotation.preview')}</Text>

        {grid.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filters}
            contentContainerStyle={styles.filtersContent}
          >
            {grid.map((_r, i) => (
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
          {/* Read off the grid, not off the flattened rotation: a day with
              a meal time still empty would otherwise borrow the next day's
              dish to fill the gap. */}
          {(grid[activeDay] ?? []).flatMap((slotCell, slotIndex) =>
            (slotCell.length > 0 ? slotCell : [null]).map((dishId, withinSlot) => {
              const daySlot = steps[slotIndex];
              const dish = dishId ? getDish(dishId) : undefined;
              const dishName = dish
                ? lang === 'ar'
                  ? dish.name
                  : t(`dish.${dish.id}.name`, dish.name)
                : t('builder.slotEmptyShort');
              return (
                <TouchableOpacity
                  key={`${daySlot?.id ?? slotIndex}-${dishId ?? 'empty'}-${withinSlot}`}
                  activeOpacity={0.7}
                  disabled={!dishId}
                  onPress={() =>
                    dishId &&
                    navigation.navigate('DishDetail', { id: dishId, fromPlan: true, building: true })
                  }
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
                  <Text
                    style={[styles.rotationDish, !dishId && styles.rotationEmpty]}
                    numberOfLines={1}
                  >
                    {dishName}
                  </Text>
                </TouchableOpacity>
              );
            }),
          )}
        </Card>
      </View>
    ) : null;

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

      {/* The dish grid is the screen's one vertical scroller: a virtualised
          two-column `FlatList`. The day/meal-time rails and the slot summary
          ride above it in the header, the rotation preview below in the footer,
          so there is no same-orientation list nested inside another. */}
      <FlatList
        ref={scroller}
        data={shown}
        extraData={plan}
        keyExtractor={keyExtractor}
        renderItem={renderPick}
        numColumns={2}
        columnWrapperStyle={styles.pickerRow}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        showsVerticalScrollIndicator={false}
      />

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
          {/* Two buttons, not three: going back is a tap on the day or the meal
              time above, both of which are on screen and both of which say
              where you are. */}
          <Button
            label={t('builder.skip')}
            variant="outline"
            size="lg"
            onPress={finish}
            style={styles.navPrev}
          />
          <Button
            label={onLastCell ? t('builder.finish') : t('builder.next')}
            variant="primary"
            size="lg"
            disabled={plan.dishIds.length === 0}
            onPress={advance}
            style={styles.navNext}
          />
        </View>
      </View>

      <Dialog
        visible={asking !== null}
        title={t(asking === 'none' ? 'builder.none.title' : 'builder.incomplete.title')}
        message={
          asking === 'none'
            ? t('builder.none.message')
            : t('builder.incomplete.message').replace('{n}', formatNumber(unfinished))
        }
        primaryLabel={t(asking === 'none' ? 'common.close' : 'builder.incomplete.confirm')}
        onPrimary={() => {
          if (asking === 'prune') {
            pruneDays();
            setDay(0);
            navigation.navigate('Subscribe');
          }
          setAsking(null);
        }}
        secondaryLabel={asking === 'prune' ? t('common.cancel') : undefined}
        onSecondary={asking === 'prune' ? () => setAsking(null) : undefined}
        onClose={() => setAsking(null)}
      />

      <SlotSheet
        visible={editing !== null}
        initial={
          editingSlot ? { name: slotLabel(editingSlot, t), time: editingSlot.time } : null
        }
        onClose={() => setEditing(null)}
        onSave={(draft) => commitSlot(draft.name, draft.time)}
        // The last meal time cannot go: a day with none is not a plan, and the
        // pill row would have nothing left to select.
        onDelete={
          editingSlot && steps.length > 1
            ? () => {
                removeSlot(editingSlot.id);
                setStep((i) => Math.max(0, Math.min(i, steps.length - 2)));
                setEditing(null);
              }
            : undefined
        }
      />

      {/* The meal time, its delivery hour and its place in every day go on one
          tap, so the chip asks first. The sheet's own delete asks inside the
          sheet. */}
      <Dialog
        visible={dropping !== null}
        title={t('slot.delete.title').replace('{slot}', slotName)}
        message={t('slot.delete.message')}
        primaryLabel={t('common.cancel')}
        onPrimary={() => setDropping(null)}
        secondaryLabel={t('builder.removeSlot').replace('{slot}', slotName)}
        onSecondary={() => {
          if (dropping) removeSlot(dropping);
          goto(Math.max(0, step - 1));
          setDropping(null);
        }}
        onClose={() => setDropping(null)}
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
  days: {
    flexGrow: 0,
    marginHorizontal: -spacing.huge,
  },
  daysContent: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  addDay: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropDay: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.coralBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Coral, not sand: a muted glyph on a beige chip read as decoration. A
  // destructive control is the one thing in this app that should not blend in.
  slotRemove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.coralBg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  slotRemoveText: {
    ...type.caption,
    color: colors.coral,
    textAlign: 'auto',
  },
  scroll: {
    flex: 1,
  },
  // The two rows above the picker are laid out edge to edge; the page pads its
  // content, so they take that padding back off.
  bleed: {
    marginHorizontal: -spacing.huge,
  },
  // The content container's `gap` now spaces the grid rows (and the header off
  // the first row) by `xl`, matching the old picker grid's own gap. The larger
  // `giant` rhythm between the day/slot/filter blocks lives on the header, and
  // the footer takes the extra `giant - xl` back as a top margin.
  scrollContent: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.giant,
    gap: spacing.xl,
  },
  headerBlock: {
    gap: spacing.giant,
  },
  // One grid row: two cards with the same inter-column gap the wrapped grid had.
  pickerRow: {
    gap: spacing.xl,
  },
  rotationSection: {
    gap: spacing.xl,
    marginTop: spacing.giant - spacing.xl,
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
  rotationEmpty: {
    color: colors.faint,
  },
  rotationDish: {
    ...type.bodyStrong,
    color: colors.ink,
    flex: 1,
  },
  slotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  slotTitleTap: {
    flex: 1,
  },
  slotTitle: {
    ...type.h3,
    color: colors.ink,
    textAlign: 'auto',
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

// Stable style arrays so a card does not build a fresh `style` array per render
// — selection flips between these two references instead.
const PICK_ON = [styles.pick, styles.pickOn];
const PICK_OFF = [styles.pick, styles.pickOff];
const PICK_BADGE_ON = [styles.pickBadge, styles.pickBadgeOn];
const PICK_BADGE_OFF = [styles.pickBadge, styles.pickBadgeOff];
