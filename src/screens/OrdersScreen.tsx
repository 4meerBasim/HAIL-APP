import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Button from '../components/Button';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import { colors, fonts, overlay, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { toArabicDigits } from '../i18n/digits';
import {
  DEFAULT_TRACKING,
  type Order,
  currencyMark,
  formatPrice,
  getDish,
  groupNumber,
  heroImage,
  orderItemCount,
  orderTotal,
  orders,
} from '../data/menu';
import { useCart } from '../state/CartContext';
import type { TabScreenProps } from '../navigation/RootNavigator';

const ORDER_GRADIENT = [colors.tealDark, colors.teal] as const;
const SCRIM = [scrim.heroFade, scrim.hero] as const;
const MAX_THUMBS = 3;

export default function OrdersScreen({ navigation }: TabScreenProps<'Orders'>) {
  const { t, lang } = useLanguage();
  const { addItem } = useCart();

  const active = orders.find((o) => o.status === 'active') ?? null;
  const past = orders.filter((o) => o.status !== 'active');

  const dishName = (id: string): string => {
    const dish = getDish(id);
    if (!dish) return id;
    return lang === 'ar' ? dish.name : t(`dish.${id}.name`, dish.name);
  };

  const summarize = (order: Order): string =>
    order.lines
      .map((line) =>
        line.qty > 1
          ? `${dishName(line.dishId)} ×${toArabicDigits(line.qty, lang)}`
          : dishName(line.dishId),
      )
      .join(' + ');

  const metaLine = (order: Order): string =>
    `${t(order.whenKey)} · ${toArabicDigits(orderItemCount(order), lang)} ${t('orders.items')}`;

  const reorder = (order: Order) => {
    order.lines.forEach((line) => addItem(line.dishId, line.qty));
    navigation.navigate('Cart');
  };

  const renderThumbs = (order: Order) => (
    <View style={styles.thumbs}>
      {order.lines.slice(0, MAX_THUMBS).map((line) => {
        const dish = getDish(line.dishId);
        return dish ? (
          <Image key={line.dishId} source={{ uri: dish.image }} style={styles.thumb} />
        ) : null;
      })}
    </View>
  );

  if (orders.length === 0) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{t('orders.title')}</Text>

        <View style={[styles.emptyCard, shadow.card]}>
          <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={SCRIM} locations={[0.15, 1]} style={StyleSheet.absoluteFill} />
          <Text style={styles.emptyTitle}>{t('orders.empty')}</Text>
          <Button
            label={t('orders.browse')}
            variant="amber"
            size="md"
            onPress={() => navigation.navigate('Menu', { cat: 'all' })}
            style={styles.emptyCta}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('orders.title')}</Text>

      {active ? (
        <View style={styles.section}>
          <SectionHeader title={t('orders.current')} />

          <LinearGradient
            colors={ORDER_GRADIENT}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={[styles.activeCard, shadow.raised]}
          >
            <View style={styles.activeHead}>
              <View style={styles.activeText}>
                <Text style={styles.activeNumber}>{`#${toArabicDigits(active.id, lang)}`}</Text>
                <Text style={styles.activeMeta}>{metaLine(active)}</Text>
              </View>
              <View style={styles.statusPillOnDark}>
                <View style={styles.liveDot} />
                <Text style={styles.statusTextOnDark}>{t(`track.step.${DEFAULT_TRACKING}`)}</Text>
              </View>
            </View>

            <Text style={styles.activeItems} numberOfLines={2}>
              {summarize(active)}
            </Text>

            <View style={styles.totalRow}>
              <Text style={styles.total}>{groupNumber(orderTotal(active))}</Text>
              <Text style={styles.totalUnit}>{currencyMark(lang)}</Text>
            </View>

            <Button
              label={t('orders.track')}
              variant="light"
              size="md"
              full
              trailing={icons.truck}
              onPress={() => navigation.navigate('Tracking')}
              style={styles.trackBtn}
            />
          </LinearGradient>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title={t('orders.past')} />

        {past.map((order) => (
          <Card key={order.id} padding={spacing.xl} style={styles.pastCard}>
            <View style={styles.pastHead}>
              <View style={styles.pastText}>
                <Text style={styles.pastItems} numberOfLines={2}>
                  {summarize(order)}
                </Text>
                <Text style={styles.pastMeta}>
                  {`${t(order.whenKey)} · ${formatPrice(groupNumber(orderTotal(order)), lang)}`}
                </Text>
              </View>
              <View style={styles.deliveredPill}>
                <Icon path={icons.check} size={11} color={colors.tealText} strokeWidth={2.6} />
                <Text style={styles.deliveredText}>{t('orders.delivered')}</Text>
              </View>
            </View>

            <View style={styles.pastFoot}>
              {renderThumbs(order)}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => reorder(order)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={t('common.reorder')}
                style={styles.reorderBtn}
              >
                <Icon path={icons.refresh} size={14} color={colors.teal} strokeWidth={2.1} />
                <Text style={styles.reorderText}>{t('common.reorder')}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.md,
    paddingBottom: spacing.giant,
    gap: spacing.giant,
  },
  heading: {
    ...type.h1,
    color: colors.ink,
  },
  section: {
    gap: spacing.xl,
  },
  emptyCard: {
    height: 210,
    borderRadius: radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: spacing.huge,
    gap: spacing.xl,
    backgroundColor: colors.tealDark,
  },
  emptyTitle: {
    ...type.h2,
    color: colors.white,
  },
  emptyCta: {
    borderRadius: radius.pill,
  },
  activeCard: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxxl,
    gap: spacing.lg,
  },
  activeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activeText: {
    flex: 1,
    gap: 2,
  },
  activeNumber: {
    ...type.h3,
    color: colors.white,
  },
  activeMeta: {
    ...type.caption,
    color: overlay.white75,
  },
  statusPillOnDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: overlay.white16,
    borderWidth: 1,
    borderColor: overlay.white30,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  statusTextOnDark: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: colors.white,
  },
  activeItems: {
    ...type.body,
    color: overlay.white90,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  total: {
    ...type.money,
    color: colors.white,
  },
  totalUnit: {
    ...type.body,
    color: overlay.white80,
  },
  trackBtn: {
    borderRadius: radius.md,
    marginTop: spacing.xs,
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
    backgroundColor: colors.healthyBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  deliveredText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
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
    backgroundColor: colors.healthyBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  reorderText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.tealText,
  },
});
