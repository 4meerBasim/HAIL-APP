import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Chip from '../components/Chip';
import PressScale from '../components/PressScale';
import Reveal from '../components/Reveal';
import { colors, fonts, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useOrderText } from '../i18n/orderText';
import { formatNumber } from '../i18n/digits';
import { count } from '../i18n/count';
import {
  type Order,
  daysSince,
  formatPrice,
  getDish,
  groupNumber,
  orderGrandTotal,
} from '../data/menu';
import { useCart } from '../state/CartContext';
import { useOrders } from '../state/OrdersContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const MAX_THUMBS = 3;

// Windows are open-ended on the recent side and cumulative — "this month"
// includes this week. A customer scanning for one receipt widens the net; they
// do not want the week they already checked excluded from the month.
type RangeKey = 'all' | 'week' | 'month' | 'older';

const RANGES: { key: RangeKey; within?: number; beyond?: number }[] = [
  { key: 'all' },
  { key: 'week', within: 7 },
  { key: 'month', within: 30 },
  { key: 'older', beyond: 30 },
];

const inRange = (order: Order, range: (typeof RANGES)[number]): boolean => {
  const days = daysSince(order.placedAt);
  if (range.beyond !== undefined) return days > range.beyond;
  if (range.within !== undefined) return days <= range.within;
  return true;
};

export default function PastOrdersScreen({ navigation }: RootStackScreenProps<'PastOrders'>) {
  const { t, lang } = useLanguage();
  const { summarize, whenLabel } = useOrderText();
  const { addLines } = useCart();
  const { orders } = useOrders();
  const [range, setRange] = useState<RangeKey>('all');

  const past = useMemo(() => orders.filter((o) => o.status !== 'active'), [orders]);

  const shown = useMemo(() => {
    const active = RANGES.find((r) => r.key === range) ?? RANGES[0];
    return past.filter((o) => inRange(o, active));
  }, [past, range]);

  const spent = useMemo(() => shown.reduce((sum, o) => sum + orderGrandTotal(o), 0), [shown]);

  const reorder = (order: Order) => {
    addLines(order.lines);
    navigation.navigate('Cart');
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
          <Text style={styles.title}>{t('orders.past')}</Text>
          <Text style={styles.subtitle}>
            {count('count.orders', past.length, t)}
          </Text>
        </View>
      </View>

      {/* Both flex values are load-bearing: as plain siblings in a column the
          two scroll views fight over the height, and the chip row loses its
          bottom edge to the list below it. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filters}
      >
        {RANGES.map((r) => (
          <Chip
            key={r.key}
            label={t(`orders.past.filter.${r.key}`)}
            selected={r.key === range}
            onPress={() => setRange(r.key)}
          />
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {shown.length > 0 ? (
          <>
            {/* What the selected window actually adds up to — the reason to
                filter a receipt list is usually to total it. */}
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>
                {count('count.orders', shown.length, t)}
              </Text>
              <Text style={styles.summaryValue}>
                {formatPrice(groupNumber(spent), lang)}
              </Text>
            </View>

            {shown.map((order, i) => (
              <Reveal key={order.id} index={i}>
                <Card
                  padding={spacing.xl}
                  onPress={() => navigation.navigate('OrderDetail', { id: order.id })}
                  accessibilityLabel={`#${formatNumber(order.id)} · ${summarize(order)}`}
                  style={styles.pastCard}
                >
                  <View style={styles.pastHead}>
                    <View style={styles.pastText}>
                      <Text style={styles.pastItems} numberOfLines={2}>
                        {summarize(order)}
                      </Text>
                      <Text style={styles.pastMeta}>
                        {`#${formatNumber(order.id)} · ${whenLabel(order)} · ${formatPrice(groupNumber(orderGrandTotal(order)), lang)}`}
                      </Text>
                    </View>
                    <View style={styles.deliveredPill}>
                      <Text style={styles.deliveredText}>{t('orders.delivered')}</Text>
                    </View>
                  </View>

                  <View style={styles.pastFoot}>
                    <View style={styles.thumbs}>
                      {order.lines.slice(0, MAX_THUMBS).map((line, li) => {
                        const dish = getDish(line.dishId);
                        // By position: the same dish built two ways is two lines.
                        return dish ? (
                          <Image key={li} source={dish.image} style={styles.thumb} />
                        ) : null;
                      })}
                    </View>
                    <PressScale
                      onPress={() => reorder(order)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={t('common.reorder')}
                      style={styles.reorderBtn}
                    >
                      <Icon path={icons.refresh} size={14} color={colors.teal} strokeWidth={2.1} />
                      <Text style={styles.reorderText}>{t('common.reorder')}</Text>
                    </PressScale>
                  </View>
                </Card>
              </Reveal>
            ))}
          </>
        ) : (
          <View style={styles.empty}>
            <Icon path={icons.receipt} size={28} color={colors.faint} strokeWidth={1.6} />
            <Text style={styles.emptyText}>
              {t(past.length === 0 ? 'orders.past.none' : 'orders.past.noneInRange')}
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.xl,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flexShrink: 1,
    gap: 2,
  },
  title: {
    ...type.h1,
    color: colors.ink,
  },
  subtitle: {
    ...type.caption,
    color: colors.muted2,
  },
  // Sized by its chips and never squeezed by the list underneath.
  filterBar: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.xl,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.giant,
    gap: spacing.lg,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  summaryLabel: {
    ...type.caption,
    color: colors.muted2,
  },
  summaryValue: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  pastCard: {
    borderRadius: radius.card,
    gap: spacing.xl,
  },
  pastHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  pastText: {
    flex: 1,
    gap: 3,
  },
  pastItems: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  pastMeta: {
    ...type.caption,
    color: colors.muted2,
  },
  deliveredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.tile,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  deliveredText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.tealText,
  },
  pastFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
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
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.tile,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  reorderText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.teal,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.giant,
  },
  emptyText: {
    ...type.body,
    color: colors.muted2,
    textAlign: 'center',
  },
});
