import React, { useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Text from './AppText';
import { colors, fonts, radius, spacing } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';

// Built in JS, deliberately. `@react-native-picker/picker` and
// `@react-native-community/datetimepicker` both appear in Expo's pinned module
// list, but neither is in the Expo Go binary for SDK 57 — dropping one in
// renders an unresolved native component, one red box per wheel. This project
// runs in Expo Go, so the wheel has to be something Expo Go already has.
//
// Shaped after UIDatePicker rather than invented: five rows deep, the chosen
// one full weight in the centre with its neighbours falling away in opacity and
// scale, a rounded selection band behind, and the column fading into the sheet
// at both ends.
const ITEM_H = 36;
// Odd, so there is a true centre row. Two either side is what iOS shows.
const VISIBLE = 5;
const HEIGHT = ITEM_H * VISIBLE;
const PAD = ITEM_H * ((VISIBLE - 1) / 2);
// Five-minute steps. A delivery window is not a stopwatch, and 60 rows of
// minutes is a wheel nobody wants to spin.
const MINUTE_STEP = 5;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => i * MINUTE_STEP);

export interface TimePickerProps {
  /** Minutes from midnight. */
  value: number;
  onChange: (minutes: number) => void;
}

interface ColumnProps {
  labels: string[];
  index: number;
  onIndex: (index: number) => void;
  label: string;
  /** Wider for the period column, whose labels are words rather than digits. */
  width: number;
}

function Column({ labels, index, onIndex, label, width }: ColumnProps) {
  const ref = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(index * ITEM_H)).current;
  // The row under the band right now. Held in a ref so the tick fires once per
  // row rather than once per scroll frame.
  const atRef = useRef(index);
  const placed = useRef(false);

  const clamp = useCallback(
    (y: number) => Math.max(0, Math.min(labels.length - 1, Math.round(y / ITEM_H))),
    [labels.length],
  );

  // `contentOffset` places the column on mount, but it is not honoured on every
  // platform, so the first layout puts it there too.
  //
  // ONLY the first. Layout runs again whenever the sheet re-measures — raising
  // the keyboard on the name field is enough — and scrolling on every pass
  // dragged the column back to the time it opened on, which reads exactly like
  // a wheel that refuses to move.
  const onLayout = useCallback(() => {
    if (placed.current) return;
    placed.current = true;
    ref.current?.scrollTo({ y: index * ITEM_H, animated: false });
    // Mount-time placement only; the index after that belongs to the finger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A tick per row crossed, the way the system wheel detents. Fired from the
  // live scroll, not the settle, so it lands under the finger instead of after
  // it stops. Caught rather than left floating: a device with system haptics
  // switched off rejects, and that is a warning thrown across an unrelated
  // screen.
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = clamp(e.nativeEvent.contentOffset.y);
      if (next === atRef.current) return;
      atRef.current = next;
      Haptics.selectionAsync().catch(() => {});
    },
    [clamp],
  );

  const onSettle = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = clamp(e.nativeEvent.contentOffset.y);
      atRef.current = next;
      onIndex(next);
    },
    [clamp, onIndex],
  );

  return (
    <Animated.ScrollView
      ref={ref as never}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      contentOffset={{ x: 0, y: index * ITEM_H }}
      // The fade and scale ride the offset directly, so they track the finger
      // frame by frame instead of stepping when a row is committed. The
      // listener is what still gets the tick — a native-driven event runs it.
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: onScroll as never,
      })}
      scrollEventThrottle={16}
      onMomentumScrollEnd={onSettle}
      // A short flick can stop with no momentum phase; without this the column
      // lands between two rows and never reports the value.
      onScrollEndDrag={onSettle}
      onLayout={onLayout}
      accessibilityLabel={label}
      style={[styles.column, { width }]}
      contentContainerStyle={styles.columnBody}
    >
      {labels.map((text, i) => {
        const span = [
          (i - 2) * ITEM_H,
          (i - 1) * ITEM_H,
          i * ITEM_H,
          (i + 1) * ITEM_H,
          (i + 2) * ITEM_H,
        ];
        return (
          <Animated.View
            key={text}
            style={[
              styles.item,
              {
                opacity: scrollY.interpolate({
                  inputRange: span,
                  outputRange: [0.22, 0.5, 1, 0.5, 0.22],
                  extrapolate: 'clamp',
                }),
                transform: [
                  {
                    scale: scrollY.interpolate({
                      inputRange: span,
                      outputRange: [0.84, 0.92, 1, 0.92, 0.84],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.itemText}>{text}</Text>
          </Animated.View>
        );
      })}
    </Animated.ScrollView>
  );
}

/**
 * Picks a delivery time on a 12-hour face.
 *
 * The row is pinned left-to-right whatever the app's direction: a clock reads
 * hour-then-minute in Arabic too, and letting RTL mirror the columns would put
 * the minutes before the hour.
 */
export default function TimePicker({ value, onChange }: TimePickerProps) {
  const { t } = useLanguage();

  const total = ((Math.round(value) % 1440) + 1440) % 1440;
  const hour24 = Math.floor(total / 60);
  const hourIndex = (hour24 % 12 === 0 ? 12 : hour24 % 12) - 1;
  const minuteIndex =
    Math.round((total % 60) / MINUTE_STEP) % MINUTES.length;
  const periodIndex = hour24 < 12 ? 0 : 1;

  const emit = useCallback(
    (h: number, m: number, p: number) => {
      onChange(((HOURS[h] % 12) + p * 12) * 60 + MINUTES[m]);
    },
    [onChange],
  );

  const hourLabels = useMemo(() => HOURS.map((h) => formatNumber(h)), []);
  const minuteLabels = useMemo(
    () => MINUTES.map((m) => formatNumber(String(m).padStart(2, '0'))),
    [],
  );
  const periodLabels = useMemo(() => [t('time.am'), t('time.pm')], [t]);

  return (
    <View style={styles.wrap}>
      {/* Behind the columns, so the rows travel through it. */}
      <View style={styles.band} pointerEvents="none" />

      <View style={styles.row}>
        <Column
          labels={hourLabels}
          index={hourIndex}
          onIndex={(i) => emit(i, minuteIndex, periodIndex)}
          label={t('time.hour')}
          width={64}
        />
        <Text style={styles.colon}>:</Text>
        <Column
          labels={minuteLabels}
          index={minuteIndex}
          onIndex={(i) => emit(hourIndex, i, periodIndex)}
          label={t('time.minute')}
          width={64}
        />
        <Column
          labels={periodLabels}
          index={periodIndex}
          onIndex={(i) => emit(hourIndex, minuteIndex, i)}
          label={t('time.period')}
          width={72}
        />
      </View>

      {/* The column runs off into the sheet rather than stopping at a hard
          edge — the part of the system wheel that makes it read as a cylinder
          rather than a list. */}
      <LinearGradient
        colors={[colors.cream, `${colors.cream}00`]}
        style={[styles.fade, styles.fadeTop]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[`${colors.cream}00`, colors.cream]}
        style={[styles.fade, styles.fadeBottom]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: HEIGHT,
    justifyContent: 'center',
  },
  band: {
    position: 'absolute',
    start: 0,
    end: 0,
    height: ITEM_H,
    top: PAD,
    backgroundColor: colors.sandChip,
    borderRadius: radius.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    // A clock is an LTR run in both languages — mirroring puts minutes first.
    direction: 'ltr',
  },
  column: {
    height: HEIGHT,
  },
  columnBody: {
    paddingVertical: PAD,
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink,
  },
  colon: {
    fontFamily: fonts.heavy,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink,
    marginBottom: 2,
  },
  fade: {
    position: 'absolute',
    start: 0,
    end: 0,
    height: ITEM_H * 1.6,
  },
  fadeTop: {
    top: 0,
  },
  fadeBottom: {
    bottom: 0,
  },
});
