import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { icons } from './icons';
import { colors, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { type MealSlot, slotLabel } from '../data/menu';

// Reordering is hand-rolled on PanResponder and core Animated: this project
// keeps Reanimated uninstalled (its worklets crash Expo Go on SDK 57), which
// rules out the usual draggable-list libraries.
//
// Three things here are load-bearing and easy to undo by accident:
//
//  1. The gesture is claimed in the CAPTURE phase. The pills are Pressables, so
//     a child already owns the touch by the time a drag starts; only a capture
//     handler can take it back off them. Bubbling `onMoveShouldSetPanResponder`
//     is never consulted and the drag simply never begins.
//
//  2. Nothing on the lifted card uses the native driver. Its position is driven
//     by setValue from the pan handler, which is JS-side, and RN refuses to mix
//     drivers on one prop — the native half wins and the JS updates are dropped,
//     leaving a card that gets picked up but never moves.
//
//  3. The card's coordinate origin is measured, not assumed. The app runs
//     I18nManager.forceRTL for Arabic, which swaps `left` and `right` on every
//     absolute style, so a hardcoded anchor lands on the far edge and the card
//     flies off-screen. The anchor is zero-width, so its two edges coincide and
//     the swap cannot move it.

export interface SlotBarProps {
  slots: MealSlot[];
  activeIndex: number;
  filled: (slot: MealSlot) => boolean;
  onSelect: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onDelete: (slotId: string) => void;
  onAdd?: () => void;
  canAdd?: boolean;
}

interface Frame {
  x: number;
  width: number;
  height: number;
}

const LIFT_MS = 150;
const GAP = spacing.md;

export default function SlotBar({
  slots,
  activeIndex,
  filled,
  onSelect,
  onMove,
  onDelete,
  onAdd,
  canAdd = false,
}: SlotBarProps) {
  const { t } = useLanguage();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overTrash, setOverTrash] = useState(false);

  // Refs mirror the drag state: the pan handlers are built once per row and
  // would otherwise close over a stale render. The hover target is ref-only
  // because it changes constantly and nothing in the render reads it — holding
  // it in state re-rendered the whole row on every crossing.
  const dragRef = useRef<number | null>(null);
  const targetRef = useRef<number | null>(null);
  const trashRef = useRef(false);
  const armed = useRef<number | null>(null);

  const frames = useRef<Frame[]>([]);
  const scrollX = useRef(0);
  const rowOrigin = useRef(0);
  const ghostOrigin = useRef({ x: 0, y: 0 });
  const trashBand = useRef({ top: Infinity, bottom: -Infinity });
  const grip = useRef({ x: 0, y: 0 });

  const row = useRef<View>(null);
  const anchor = useRef<View>(null);
  const trash = useRef<View>(null);

  // The callers pass inline arrows, so holding them in refs keeps the pan
  // handlers from being rebuilt on every render — including the re-renders the
  // drag itself causes, which would swap the handlers out mid-gesture.
  const handlers = useRef({ onMove, onDelete });
  handlers.current = { onMove, onDelete };

  const ghost = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lift = useRef(new Animated.Value(0)).current;

  // One per pill: the row parts around the held card so the gap itself shows
  // where it will land.
  const shifts = useRef<Animated.Value[]>([]);
  if (shifts.current.length !== slots.length) {
    shifts.current = slots.map((_s, i) => shifts.current[i] ?? new Animated.Value(0));
  }

  const measure = () => {
    // Measured off a wrapper rather than the ScrollView itself: a ScrollView
    // ref exposes scroll methods, not the view-measurement ones.
    row.current?.measureInWindow((x) => {
      rowOrigin.current = x;
    });
    anchor.current?.measureInWindow((x, y) => {
      ghostOrigin.current = { x, y };
    });
    trash.current?.measureInWindow((_x, y, _w, h) => {
      trashBand.current = { top: y, bottom: y + h };
    });
  };

  const frameAt = (i: number) => (e: LayoutChangeEvent) => {
    const { x, width, height } = e.nativeEvent.layout;
    frames.current[i] = { x, width, height };
  };

  const part = (from: number, to: number | null) => {
    const step = (frames.current[from]?.width ?? 0) + GAP;
    slots.forEach((_s, i) => {
      let dx = 0;
      if (to !== null && i !== from) {
        if (from < to && i > from && i <= to) dx = -step;
        else if (from > to && i >= to && i < from) dx = step;
      }
      Animated.spring(shifts.current[i], {
        toValue: dx,
        friction: 12,
        tension: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  // Snapped, not sprung: the array itself reorders on drop, so easing the
  // offsets back would play the same movement a second time.
  const settle = () => shifts.current.forEach((v) => v.setValue(0));

  const track = (pageX: number, pageY: number) => {
    ghost.setValue({
      x: pageX - ghostOrigin.current.x - grip.current.x,
      y: pageY - ghostOrigin.current.y - grip.current.y,
    });
  };

  // Which position the held card would land in, from where the finger sits
  // along the row in content coordinates.
  const targetFor = (pageX: number): number => {
    const contentX = pageX - rowOrigin.current + scrollX.current;
    for (let i = 0; i < slots.length; i += 1) {
      const f = frames.current[i];
      if (f && contentX < f.x + f.width / 2) return i;
    }
    return slots.length - 1;
  };

  const endDrag = () => {
    armed.current = null;
    dragRef.current = null;
    targetRef.current = null;
    trashRef.current = false;
    setDragIndex(null);
    setOverTrash(false);
    settle();
    Animated.timing(lift, {
      toValue: 0,
      duration: LIFT_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const responders = useMemo(
    () =>
      slots.map((_slot, index) =>
        PanResponder.create({
          onStartShouldSetPanResponderCapture: () => false,
          onMoveShouldSetPanResponderCapture: () => armed.current === index,
          onPanResponderGrant: (e) => {
            const f = frames.current[index];
            grip.current = { x: (f?.width ?? 0) / 2, y: (f?.height ?? 0) / 2 };
            track(e.nativeEvent.pageX, e.nativeEvent.pageY);
            dragRef.current = index;
            targetRef.current = index;
            setDragIndex(index);
            Animated.timing(lift, {
              toValue: 1,
              duration: LIFT_MS,
              easing: Easing.out(Easing.quad),
              useNativeDriver: false,
            }).start();
          },
          onPanResponderMove: (_e, g) => {
            track(g.moveX, g.moveY);
            const onTrash = g.moveY >= trashBand.current.top && g.moveY <= trashBand.current.bottom;
            if (onTrash !== trashRef.current) {
              trashRef.current = onTrash;
              setOverTrash(onTrash);
              if (onTrash) part(index, null);
            }
            if (onTrash) return;
            const next = targetFor(g.moveX);
            if (next !== targetRef.current) {
              targetRef.current = next;
              part(index, next);
            }
          },
          onPanResponderRelease: () => {
            const from = dragRef.current;
            if (from !== null) {
              if (trashRef.current) {
                handlers.current.onDelete(slots[from].id);
              } else if (targetRef.current !== null && targetRef.current !== from) {
                handlers.current.onMove(from, targetRef.current);
              }
            }
            endDrag();
          },
          onPanResponderTerminate: endDrag,
          // Nothing under a lifted card gets to steal it back mid-drag.
          onPanResponderTerminationRequest: () => false,
        }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slots],
  );

  const dragging = dragIndex !== null;
  const held = dragging ? slots[dragIndex] : null;

  const pill = (slot: MealSlot, i: number, lifted: boolean) => {
    const here = i === activeIndex;
    const done = filled(slot);
    const hollow = !lifted && dragging && dragIndex === i;
    return (
      <View
        style={[
          styles.pill,
          here && styles.pillOn,
          hollow && styles.pillHollow,
          lifted && styles.pillLifted,
        ]}
      >
        <Icon
          path={done ? icons.check : icons[slot.icon]}
          size={13}
          color={
            hollow ? 'transparent' : here ? colors.white : done ? colors.tealText : colors.faint
          }
          strokeWidth={done ? 3 : 1.9}
        />
        <Text
          style={[styles.pillText, here && styles.pillTextOn, hollow && styles.pillTextHollow]}
          numberOfLines={1}
        >
          {slotLabel(slot, t)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.root} onLayout={measure}>
      <View ref={row} onLayout={measure}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!dragging}
          onScroll={(e) => {
            scrollX.current = e.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={16}
          style={styles.rowScroll}
          contentContainerStyle={styles.rowContent}
        >
          {slots.map((slot, i) => (
            <Animated.View
              key={slot.id}
              onLayout={frameAt(i)}
              style={{ transform: [{ translateX: shifts.current[i] }] }}
              {...responders[i].panHandlers}
            >
              <Pressable
                onPress={() => onSelect(i)}
                onLongPress={() => {
                  measure();
                  armed.current = i;
                }}
                // A long press that never became a drag would otherwise leave the
                // pill armed, and the next stray swipe across it would pick it up
                // out of nowhere. Safe unconditionally: by the time a real drag
                // cancels the press the responder is granted, and `armed` is only
                // read to start one.
                onPressOut={() => {
                  armed.current = null;
                }}
                delayLongPress={200}
                accessibilityRole="button"
                accessibilityState={{ selected: i === activeIndex }}
                accessibilityLabel={slotLabel(slot, t)}
              >
                {pill(slot, i, false)}
              </Pressable>
            </Animated.View>
          ))}

          {canAdd && !dragging ? (
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
      </View>

      <Text style={styles.hint}>{t('builder.dragHint')}</Text>

      {/* Kept mounted so its window band is measurable before a drag begins; it
          only takes up space once one is under way. */}
      <View
        ref={trash}
        onLayout={measure}
        style={[
          styles.trash,
          dragging ? styles.trashOpen : styles.trashShut,
          overTrash && styles.trashHot,
        ]}
        pointerEvents="none"
      >
        {dragging ? (
          <>
            <Icon
              path={icons.close}
              size={15}
              color={overTrash ? colors.white : colors.coral}
              strokeWidth={2.6}
            />
            <Text style={[styles.trashText, overTrash && styles.trashTextHot]}>
              {t(overTrash ? 'builder.dropRelease' : 'builder.dropDelete')}
            </Text>
          </>
        ) : null}
      </View>

      {/* Zero-width on purpose — see note 3 at the top. Always mounted so its
          resolved origin is known before the first frame of a drag. */}
      <View ref={anchor} onLayout={measure} style={styles.anchor} pointerEvents="none">
        {held ? (
          <Animated.View
            style={[
              styles.ghost,
              {
                opacity: lift,
                transform: [
                  { translateX: ghost.x },
                  { translateY: ghost.y },
                  {
                    scale: lift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1],
                    }),
                  },
                  {
                    rotate: lift.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '-3deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {pill(held, dragIndex as number, true)}
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingBottom: spacing.md,
    zIndex: 10,
  },
  rowScroll: {
    flexGrow: 0,
  },
  rowContent: {
    paddingHorizontal: spacing.huge,
    gap: GAP,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  pillOn: {
    backgroundColor: colors.teal,
  },
  pillHollow: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: colors.sand,
  },
  pillLifted: {
    ...shadow.raised,
  },
  pillText: {
    ...type.captionStrong,
    color: colors.body,
  },
  pillTextOn: {
    color: colors.white,
  },
  pillTextHollow: {
    color: 'transparent',
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
  trash: {
    marginHorizontal: spacing.huge,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderRadius: radius.card,
    borderColor: colors.coral,
    backgroundColor: colors.coralBg,
    overflow: 'hidden',
  },
  trashShut: {
    height: 0,
    opacity: 0,
    marginTop: 0,
    borderWidth: 0,
  },
  trashOpen: {
    height: 54,
    opacity: 1,
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  trashHot: {
    backgroundColor: colors.coral,
    borderStyle: 'solid',
  },
  trashText: {
    ...type.captionStrong,
    color: colors.coral,
  },
  trashTextHot: {
    color: colors.white,
  },
  anchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  },
  ghost: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 30,
    elevation: 30,
  },
});
