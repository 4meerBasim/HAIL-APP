import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import DashedRule from '../components/DashedRule';
import { colors, fonts, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useOrderText } from '../i18n/orderText';
import { formatNumber } from '../i18n/digits';
import {
  DELIVERY_FEE,
  formatPrice,
  getDish,
  groupNumber,
  orderGrandTotal,
  orderItemCount,
  orderLineTotal,
  orderTotal,
} from '../data/menu';
import { useCart } from '../state/CartContext';
import { useOrders } from '../state/OrdersContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

export default function OrderDetailScreen({ route, navigation }: RootStackScreenProps<'OrderDetail'>) {
  const { t, lang } = useLanguage();
  const { dishName, whenLabel } = useOrderText();
  const { addItem } = useCart();
  const { orders } = useOrders();

  const order = orders.find((o) => o.id === route.params.id) ?? null;

  // The list that opened this screen is built from the same array, so a miss
  // means the order was cleared underneath us — go back rather than render an
  // empty receipt.
  if (!order) {
    return (
      <Screen scroll={false} texture>
        <View style={styles.missing}>
          <Icon path={icons.receipt} size={28} color={colors.faint} strokeWidth={1.6} />
          <Text style={styles.missingText}>{t('orders.past.none')}</Text>
          <Button label={t('common.back')} variant="outline" size="md" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  const reorder = () => {
    order.lines.forEach((line) => addItem(line.dishId, line.qty));
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
          <Text style={styles.title}>{`#${formatNumber(order.id)}`}</Text>
          <Text style={styles.subtitle}>
            {`${whenLabel(order)} · ${formatNumber(orderItemCount(order))} ${t('orders.items')}`}
          </Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>
            {t(order.status === 'active' ? 'orders.active' : 'orders.delivered')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card padding={spacing.xl} style={styles.block}>
          <Text style={styles.blockLabel}>{t('orders.detail.items')}</Text>

          {order.lines.map((line) => {
            const dish = getDish(line.dishId);
            return (
              <View key={line.dishId} style={styles.line}>
                {dish ? <Image source={dish.image} style={styles.thumb} /> : null}
                <View style={styles.lineText}>
                  <Text style={styles.lineName} numberOfLines={2}>
                    {dishName(line.dishId)}
                  </Text>
                  <Text style={styles.lineQty}>{`×${formatNumber(line.qty)}`}</Text>
                </View>
                <Text style={styles.linePrice}>
                  {formatPrice(groupNumber(orderLineTotal(line)), lang)}
                </Text>
              </View>
            );
          })}
        </Card>

        <Card padding={spacing.xl} style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('cart.subtotal')}</Text>
            <Text style={styles.totalLabel}>
              {formatPrice(groupNumber(orderTotal(order)), lang)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('cart.delivery')}</Text>
            <Text style={styles.totalLabel}>
              {formatPrice(groupNumber(DELIVERY_FEE), lang)}
            </Text>
          </View>
          <DashedRule />
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>{t('cart.total')}</Text>
            <Text style={styles.grandValue}>
              {formatPrice(groupNumber(orderGrandTotal(order)), lang)}
            </Text>
          </View>
        </Card>

        <Button
          label={t('common.reorder')}
          variant="primary"
          size="lg"
          full
          trailing={icons.refresh}
          onPress={reorder}
        />
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
    flex: 1,
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
  statusPill: {
    backgroundColor: colors.tile,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.tealText,
  },
  content: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.giant,
    gap: spacing.xl,
  },
  block: {
    borderRadius: radius.card,
    gap: spacing.lg,
  },
  blockLabel: {
    ...type.bodyStrong,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  thumb: {
    width: 46,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.sand,
  },
  lineText: {
    flex: 1,
    gap: 2,
  },
  lineName: {
    ...type.body,
    color: colors.ink,
  },
  lineQty: {
    ...type.caption,
    color: colors.muted2,
  },
  linePrice: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  totals: {
    borderRadius: radius.card,
    gap: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  totalLabel: {
    ...type.body,
    color: colors.body,
  },
  grandLabel: {
    ...type.h3,
    color: colors.ink,
  },
  grandValue: {
    ...type.h3,
    color: colors.teal,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.huge,
  },
  missingText: {
    ...type.body,
    color: colors.muted2,
    textAlign: 'center',
  },
});
