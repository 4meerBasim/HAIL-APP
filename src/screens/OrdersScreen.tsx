import React from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Button from '../components/Button';
import Card from '../components/Card';
import PatternFill from '../components/PatternFill';
import Reveal from '../components/Reveal';
import SectionHeader from '../components/SectionHeader';
import { usePulseLoop } from '../animation';
import { colors, fonts, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useOrderText } from '../i18n/orderText';
import { formatNumber } from '../i18n/digits';
import {
  DEFAULT_TRACKING,
  currencyMark,
  groupNumber,
  orderGrandTotal,
  orderItemCount,
} from '../data/menu';
import { usePlan } from '../state/PlanContext';
import { useOrders } from '../state/OrdersContext';
import { useAuth } from '../state/AuthContext';
import type { TabScreenProps } from '../navigation/RootNavigator';

// The live indicator on an in-flight order — a halo breathing out of the dot,
// the one thing here that should look like it's still moving.
function LiveDot() {
  const anim = usePulseLoop();
  const halo = {
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
  };

  return (
    <View style={styles.liveWrap}>
      <Animated.View style={[styles.liveDot, styles.liveHalo, halo]} pointerEvents="none" />
      <View style={styles.liveDot} />
    </View>
  );
}

export default function OrdersScreen({ navigation }: TabScreenProps<'Orders'>) {
  const { t, lang, isRTL } = useLanguage();
  const { summarize, whenLabel } = useOrderText();
  const { orders } = useOrders();
  const { subscription } = usePlan();
  const { status } = useAuth();

  const active = orders.find((o) => o.status === 'active') ?? null;
  const past = orders.filter((o) => o.status !== 'active');

  // Nothing placed and nothing subscribed: the screen has no content of its
  // own, so it says so rather than rendering as a bare heading.
  const blank = !subscription && orders.length === 0;

  // A guest has no orders and no way to place one, so the page is the reason
  // why rather than an empty list — the generic empty state would read as "you
  // haven't ordered yet" and leave the sign-in that fixes it off screen.
  if (status !== 'authed') {
    return (
      <Screen scroll contentContainerStyle={styles.content} texture>
        <Reveal index={0}>
          <Text style={styles.heading}>{t('orders.title')}</Text>
        </Reveal>
        <Reveal index={1} style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon path={icons.receipt} size={28} color={colors.faint} strokeWidth={1.6} />
          </View>
          <Text style={styles.emptyTitle}>{t('orders.guest.title')}</Text>
          <Text style={styles.emptySub}>{t('orders.guest.sub')}</Text>
          <Button
            label={t('login.title')}
            size="md"
            full
            onPress={() => navigation.navigate('Login')}
          />
        </Reveal>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content} texture>
      <Reveal index={0}>
        <Text style={styles.heading}>{t('orders.title')}</Text>
      </Reveal>

      {blank ? (
        <Reveal index={1} style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon path={icons.receipt} size={28} color={colors.faint} strokeWidth={1.6} />
          </View>
          <Text style={styles.emptyTitle}>{t('orders.empty.title')}</Text>
          <Text style={styles.emptySub}>{t('orders.empty.sub')}</Text>
        </Reveal>
      ) : null}

      {active ? (
        <Reveal index={2} style={styles.section}>
          <SectionHeader title={t('orders.current')} />

          {/* Same teal, laid flat — `tealMid` is the midpoint of the two stops
              the gradient used to run between, so the card keeps its colour and
              loses only the sheen. */}
          <View style={[styles.planCard, styles.orderCard, shadow.raised]}>
            <PatternFill />
            <View style={styles.planHead}>
              <View style={styles.planText}>
                <Text style={styles.planName}>{`#${formatNumber(active.id)}`}</Text>
                <Text style={styles.planMeta}>
                  {`${whenLabel(active)} · ${formatNumber(orderItemCount(active))} ${t('orders.items')}`}
                </Text>
              </View>
              <View style={styles.statusPillOnDark}>
                <LiveDot />
                <Text style={styles.statusTextOnDark}>{t(`track.step.${DEFAULT_TRACKING}`)}</Text>
              </View>
            </View>

            <Text style={styles.activeItems} numberOfLines={2}>
              {summarize(active)}
            </Text>

            <View style={styles.totalRow}>
              <Text style={styles.total}>{groupNumber(orderGrandTotal(active))}</Text>
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
          </View>
        </Reveal>
      ) : null}

      {/* History collapses to one recessed card. Past deliveries are reference
          material, not something to scroll past on the way to the live order —
          the filtered list behind it is where you go looking for one. */}
      {past.length > 0 ? (
        <Reveal index={3} style={styles.section}>
          <Card
            padding={spacing.xl}
            background={colors.sandChip}
            onPress={() => navigation.navigate('PastOrders')}
            accessibilityLabel={`${t('orders.past')} · ${formatNumber(past.length)}`}
            style={styles.pastCard}
          >
            <View style={styles.archiveRow}>
              <View style={styles.archiveIcon}>
                <Icon path={icons.receipt} size={18} color={colors.muted} strokeWidth={1.9} />
              </View>

              <View style={styles.archiveText}>
                <Text style={styles.archiveTitle}>{t('orders.past')}</Text>
                <Text style={styles.archiveMeta} numberOfLines={1}>
                  {`${formatNumber(past.length)} ${t('orders.past.count')} · ${t('orders.past.latest')} ${whenLabel(past[0])}`}
                </Text>
              </View>

              <Icon
                path={isRTL ? icons.chevronLeft : icons.chevronRight}
                size={15}
                color={colors.faint}
                strokeWidth={2.2}
              />
            </View>
          </Card>
        </Reveal>
      ) : null}

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
  empty: {
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.giant,
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.sandChip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    ...type.h3,
    color: colors.ink,
    textAlign: 'center',
  },
  emptySub: {
    ...type.body,
    color: colors.muted2,
    textAlign: 'center',
  },
  planCard: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxxl,
    gap: spacing.xl,
  },
  orderCard: {
    backgroundColor: colors.tealMid,
  },
  planHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  planText: {
    flex: 1,
    gap: 2,
  },
  planName: {
    ...type.h3,
    color: colors.white,
  },
  planMeta: {
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
  liveWrap: {
    width: 6,
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  liveHalo: {
    position: 'absolute',
  },
  statusTextOnDark: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
  activeItems: {
    ...type.body,
    color: overlay.white90,
  },
  totalRow: {
    flexDirection: 'row',
    // Bottom rather than baseline: `type.money` runs a line box shorter than
    // the font's own, so its digits sit high inside it and a baseline-aligned
    // unit floats up with them.
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  total: {
    ...type.money,
    color: colors.white,
  },
  totalUnit: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: overlay.white75,
    paddingBottom: 7,
  },
  trackBtn: {
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  // Recessed rather than white: it sits on the page as an archive drawer, not
  // as another live card competing with the order above it.
  pastCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  archiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  archiveIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveText: {
    flex: 1,
    gap: 2,
  },
  archiveTitle: {
    ...type.bodyStrong,
    color: colors.muted,
  },
  archiveMeta: {
    ...type.caption,
    color: colors.faint,
  },
});
