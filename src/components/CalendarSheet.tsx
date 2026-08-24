import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { icons } from './icons';
import { colors, fonts, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { dayKeys } from '../data/menu';

const DAY_MS = 86400000;
// The grid runs Sunday-first, the way the week is read here and the way
// `dayKeys` and `PlanState.weekdays` are already indexed.
const WEEK_START = 0; // JS getDay() for Sunday

export interface CalendarSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Epoch ms of subscription day 0 — the anchor every offset counts from. */
  startAt: number;
  /** Day offsets that actually get a delivery, from `deliveryDays`. */
  deliveries: number[];
  selected: number;
  onSelect: (offset: number) => void;
}

const midnight = (ms: number): number => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// Whole days between two midnights — the offset a delivery is stored as.
export const offsetOf = (startAt: number, ms: number): number =>
  Math.round((midnight(ms) - midnight(startAt)) / DAY_MS);

export default function CalendarSheet({
  visible,
  onClose,
  startAt,
  deliveries,
  selected,
  onSelect,
}: CalendarSheetProps) {
  const { t, isRTL } = useLanguage();
  const anchor = midnight(startAt + selected * DAY_MS);
  const [month, setMonth] = useState(() => new Date(anchor).getMonth());
  const [year, setYear] = useState(() => new Date(anchor).getFullYear());

  const delivered = useMemo(() => new Set(deliveries), [deliveries]);

  // Leading blanks so the 1st lands under its weekday, then every day of the
  // month. Trailing blanks are unnecessary — the grid wraps on its own.
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const lead = (first.getDay() - WEEK_START + 7) % 7;
    const length = new Date(year, month + 1, 0).getDate();
    const out: (number | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= length; d += 1) out.push(d);
    return out;
  }, [month, year]);

  const shiftMonth = (by: number) => {
    const next = new Date(year, month + by, 1);
    setMonth(next.getMonth());
    setYear(next.getFullYear());
  };

  const weekdayLabels = useMemo(() => dayKeys.map((k) => t(k)), [t]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Swallows taps so a press inside the card never dismisses it. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.head}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => shiftMonth(-1)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              style={styles.arrow}
            >
              <Icon
                path={isRTL ? icons.chevronRight : icons.chevronLeft}
                size={14}
                color={colors.ink}
                strokeWidth={2.4}
              />
            </TouchableOpacity>

            <Text style={styles.month}>
              {`${t(`month.${month}`)} ${formatNumber(year)}`}
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => shiftMonth(1)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.continue')}
              style={styles.arrow}
            >
              <Icon
                path={isRTL ? icons.chevronLeft : icons.chevronRight}
                size={14}
                color={colors.ink}
                strokeWidth={2.4}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {weekdayLabels.map((label) => (
              <Text key={label} style={styles.weekday}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((date, i) => {
              if (date == null) {
                return <View key={`blank-${i}`} style={styles.cell} />;
              }
              const offset = offsetOf(startAt, new Date(year, month, date).getTime());
              const isDelivery = delivered.has(offset);
              const isSelected = offset === selected;
              return (
                <TouchableOpacity
                  key={`d-${date}`}
                  activeOpacity={0.75}
                  disabled={!isDelivery}
                  onPress={() => {
                    onSelect(offset);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: !isDelivery }}
                  accessibilityLabel={
                    isDelivery ? formatNumber(date) : t('rotation.noDelivery')
                  }
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.day,
                      isDelivery && styles.dayOn,
                      isSelected && styles.daySelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !isDelivery && styles.dayTextOff,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {formatNumber(date)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            style={styles.close}
          >
            <Text style={styles.closeText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: scrim.dialog,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.huge,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.cream,
    borderRadius: radius.sheet,
    padding: spacing.huge,
    gap: spacing.xl,
    ...shadow.sheet,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...type.caption,
    color: colors.muted2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // Sevenths rather than a fixed width, so the grid holds its shape on any
  // screen and the columns stay under their weekday headers.
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  day: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  daySelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  dayText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  dayTextOff: {
    color: colors.faint2,
  },
  dayTextSelected: {
    color: colors.white,
  },
  close: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.huge,
  },
  closeText: {
    ...type.captionStrong,
    color: colors.tealText,
  },
});
