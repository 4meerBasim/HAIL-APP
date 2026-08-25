import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { icons } from './icons';
import { colors, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { type MealSlot, formatTime, slotLabel } from '../data/menu';

// A row of taps, nothing more. There is no drag here and there should not be:
//
//  - Reordering is done by the clock now. Every meal time carries a delivery
//    time, so the row's order is that order — change when a meal arrives and it
//    moves itself. Dragging could put dinner at 20:00 ahead of breakfast at
//    08:00, which is not an arrangement anyone means.
//  - Deleting lives in the sheet the pill opens, beside the name and the time it
//    belongs to, rather than behind a gesture that has to be discovered.
//
// The drag this replaces was built twice and was wrong both times. A
// PanResponder fighting a horizontal ScrollView for the same touch, with a
// long-press arming step in between, has too many states nobody asked for — and
// the reorder it produced moved `mealSlots` without moving the grid columns
// that index into them, so it quietly rehomed the dishes as well.

export interface SlotBarProps {
  slots: MealSlot[];
  activeIndex: number;
  /** Given the slot and its position, whether the day on screen has it filled. */
  filled: (slot: MealSlot, index: number) => boolean;
  /**
   * A pill was tapped. Tapping the one already selected is the caller's cue to
   * open it for editing — the row is the step navigator, so a tap cannot mean
   * "edit" until there is nothing left for it to select.
   */
  onSelect: (index: number) => void;
  onAdd?: () => void;
  canAdd?: boolean;
}

export default function SlotBar({
  slots,
  activeIndex,
  filled,
  onSelect,
  onAdd,
  canAdd = false,
}: SlotBarProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rowScroll}
        contentContainerStyle={styles.rowContent}
      >
        {slots.map((slot, i) => {
          const here = i === activeIndex;
          const done = filled(slot, i);

          return (
            <Pressable
              key={slot.id}
              onPress={() => onSelect(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: here }}
              accessibilityLabel={`${slotLabel(slot, t)} · ${formatTime(slot.time, t)}`}
              accessibilityHint={here ? t('slot.edit') : undefined}
              style={[styles.pill, here && styles.pillOn]}
            >
              <Icon
                path={done ? icons.check : icons[slot.icon]}
                size={13}
                color={here ? colors.white : done ? colors.tealText : colors.faint}
                strokeWidth={done ? 3 : 1.9}
              />
              {/* Name and time on one pill: the time is what tells two snacks
                  apart, and now that the row is ordered by it, it is also what
                  explains why this pill sits where it does. */}
              <View style={styles.pillText}>
                <Text style={[styles.pillName, here && styles.pillTextOn]} numberOfLines={1}>
                  {slotLabel(slot, t)}
                </Text>
                <Text style={[styles.pillTime, here && styles.pillTimeOn]} numberOfLines={1}>
                  {formatTime(slot.time, t)}
                </Text>
              </View>
              {/* Only on the pill already chosen, because only that one edits on
                  a tap — the others select first. Without it, "tap again to
                  edit" is a rule nobody is told. */}
              {here ? (
                <Icon path={icons.pencil} size={11} color={colors.white} strokeWidth={2} />
              ) : null}
            </Pressable>
          );
        })}

        {canAdd ? (
          <Pressable
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={t('builder.addSlot')}
            style={styles.addPill}
          >
            <Icon path={icons.plus} size={14} color={colors.tealText} strokeWidth={2.6} />
          </Pressable>
        ) : null}
      </ScrollView>

      {slots.length > 1 ? <Text style={styles.hint}>{t('builder.orderHint')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingBottom: spacing.md,
  },
  rowScroll: {
    flexGrow: 0,
  },
  rowContent: {
    paddingHorizontal: spacing.huge,
    gap: spacing.md,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  pillOn: {
    backgroundColor: colors.teal,
  },
  pillText: {
    alignItems: 'flex-start',
  },
  pillName: {
    ...type.captionStrong,
    color: colors.body,
    textAlign: 'auto',
  },
  pillTextOn: {
    color: colors.white,
  },
  pillTime: {
    ...type.micro,
    color: colors.muted2,
    textAlign: 'auto',
  },
  pillTimeOn: {
    color: colors.white,
    opacity: 0.85,
  },
  addPill: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    ...type.micro,
    color: colors.faint,
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.md,
  },
});
