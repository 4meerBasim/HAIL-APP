import React, { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import PatternFill from '../components/PatternFill';
import { type IconName, icons } from '../components/icons';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Button from '../components/Button';
import Dialog from '../components/Dialog';
import PressScale from '../components/PressScale';
import SectionHeader from '../components/SectionHeader';
import SettingRow from '../components/SettingRow';
import { colors, fonts, overlay, radius, shadow, spacing, type } from '../theme';
import { type Lang, useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { useOrders } from '../state/OrdersContext';
import { useAuth } from '../state/AuthContext';
import { useCart } from '../state/CartContext';
import { useNotifications } from '../state/NotificationsContext';
import { planProgress, usePlan } from '../state/PlanContext';
import { formatPhone } from '../data/phone';
import type { TabScreenProps } from '../navigation/RootNavigator';

// Every row here opens a screen of its own — none of them is a dead tap.
type RowKey = 'addresses' | 'payments' | 'notifications' | 'support';

interface Row {
  key: RowKey;
  icon: IconName;
}

const ACCOUNT_ROWS: Row[] = [
  { key: 'addresses', icon: 'pin' },
  { key: 'payments', icon: 'creditCard' },
];

const SETTINGS_ROWS: Row[] = [
  { key: 'notifications', icon: 'bell' },
  { key: 'support', icon: 'chat' },
];

const LANGS: Lang[] = ['ar', 'en'];

export default function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const { t, lang, isRTL, setLang } = useLanguage();
  const { status, user, signOut } = useAuth();
  const { subscription, now } = usePlan();
  const { orders } = useOrders();
  const { items } = useCart();
  const { unreadCount } = useNotifications();

  // Signing out clears the session, the basket and the plan on this device, so
  // it is asked rather than done on one tap of a full-width button.
  const [confirming, setConfirming] = useState(false);

  const cartCount = items.reduce((sum, it) => sum + it.qty, 0);
  const authed = status === 'authed';

  // Keyed by row rather than carried on the row itself, so each destination is
  // a literal `navigate` call the router can type-check, and the Record makes
  // adding a row without a destination a compile error.
  const open: Record<RowKey, () => void> = {
    addresses: () => navigation.navigate('Addresses'),
    payments: () => navigation.navigate('Payments'),
    notifications: () => navigation.navigate('Notifications'),
    support: () => navigation.navigate('Support'),
  };

  const progress = useMemo(
    () => (subscription ? planProgress(subscription, now) : null),
    [subscription, now],
  );

  // 'auto' resolves against the paragraph's writing direction; a physical
  // 'right' would be mirrored back to the left by RN's RTL swap.
  const readingSide = { textAlign: 'auto', writingDirection: isRTL ? 'rtl' : 'ltr' } as const;

  // One muted glyph per row rather than a filled colour tile. Four tinted tiles
  // stacked down the page competed with the hero and with each other; the icon
  // is a scent for the label, not a thing to look at on its own.
  const renderRow = (row: Row, first: boolean) => (
    <SettingRow
      key={row.key}
      first={first}
      icon={row.icon}
      label={t(`profile.${row.key}`)}
      sub={t(`profile.${row.key}.sub`)}
      onPress={open[row.key]}
    />
  );

  return (
    <Screen scroll contentContainerStyle={styles.content} texture>
      {/* The hero is the account itself, so tapping it opens the numbers the
          account is reachable on — and for a guest, the sign-in that creates
          one. The line under the name is what makes either promise visible. */}
      <PressScale
        style={[styles.hero, shadow.raised]}
        scaleTo={0.985}
        onPress={() => navigation.navigate(authed ? 'PhoneNumbers' : 'Login')}
        accessibilityLabel={authed ? t('phones.manage') : t('login.title')}
      >
        <PatternFill />
        <View style={styles.heroTop}>
          <View style={styles.avatar}>
            <Icon
              path={authed ? icons.user : icons.userPlus}
              size={26}
              color={colors.white}
              strokeWidth={1.7}
            />
          </View>
          <View style={styles.identity}>
            <Text style={[styles.name, readingSide]} numberOfLines={1}>
              {/* A customer who signed in with an email has no number, so the
                  address is what identifies them here. Falling through to the
                  phone alone would leave this line blank. The number gets the
                  same grouping and left-to-right mark as the phone screen, or
                  its groups read last-to-first inside an Arabic line. */}
              {authed
                ? user?.phone
                  ? `\u200e${formatPhone(user.phone)}`
                  : user?.email
                : t('profile.guest')}
            </Text>
            <Text style={[styles.identitySub, readingSide]} numberOfLines={2}>
              {authed ? t('phones.manage') : t('profile.guest.sub')}
            </Text>
          </View>
          {/* The account's own two errands, on the account's own card. Nested
              pressables, so each takes its own tap and the card still opens the
              phone numbers behind them. */}
          <View style={styles.heroActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Inbox')}
              accessibilityRole="button"
              accessibilityLabel={t('profile.notifications')}
              style={styles.heroBtn}
            >
              <Icon path={icons.bell} size={17} color={colors.white} strokeWidth={1.8} />
              <Badge count={unreadCount} ringColor={colors.tealMid} />
            </TouchableOpacity>

            {cartCount > 0 ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Cart')}
                accessibilityRole="button"
                accessibilityLabel={t('cart.title')}
                style={styles.heroBtn}
              >
                <Icon path={icons.bag} size={17} color={colors.white} strokeWidth={1.8} />
                <Badge count={cartCount} ringColor={colors.tealMid} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Guests have no orders and no plan, so the strip would be three
            zeroes — the sign-in CTA below is the whole message for them. */}
        {authed ? (
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatNumber(orders.length)}</Text>
              <Text style={styles.statLabel}>{t('profile.stat.orders')}</Text>
            </View>
            {progress ? (
              <>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{formatNumber(progress.remainingDays)}</Text>
                  <Text style={styles.statLabel}>{t('orders.remainingDays')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{formatNumber(progress.remainingMeals)}</Text>
                  <Text style={styles.statLabel}>{t('orders.remainingMeals')}</Text>
                </View>
              </>
            ) : null}
          </View>
        ) : null}
      </PressScale>

      <View style={styles.section}>
        <SectionHeader title={t('profile.account')} />
        <Card padding={0} style={styles.rows}>
          {ACCOUNT_ROWS.map((row, i) => renderRow(row, i === 0))}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('profile.settings')} />
        <Card padding={0} style={styles.rows}>
          {SETTINGS_ROWS.map((row, i) => renderRow(row, i === 0))}
          <SettingRow
            icon="globe"
            label={t('profile.language')}
            trailing={
              <View style={styles.segment}>
                {LANGS.map((l) => {
                  const on = lang === l;
                  return (
                    <TouchableOpacity
                      key={l}
                      activeOpacity={0.8}
                      onPress={() => void setLang(l)}
                      hitSlop={{ top: 10, bottom: 10 }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={t(`lang.${l}`)}
                      style={[styles.segmentItem, on && styles.segmentItemOn]}
                    >
                      <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                        {t(`lang.${l}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            }
          />
        </Card>
      </View>

      {authed ? (
        <Button
          label={t('profile.signOut')}
          variant="outline"
          size="lg"
          full
          color={colors.coral}
          onPress={() => setConfirming(true)}
        />
      ) : (
        <Button
          label={t('login.title')}
          variant="primary"
          size="lg"
          full
          onPress={() => navigation.navigate('Login')}
        />
      )}
      <Dialog
        visible={confirming}
        title={t('profile.signOut.confirm')}
        message={t('profile.signOut.message')}
        primaryLabel={t('profile.signOut')}
        onPrimary={() => {
          setConfirming(false);
          signOut();
        }}
        secondaryLabel={t('common.cancel')}
        onSecondary={() => setConfirming(false)}
        onClose={() => setConfirming(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.xl,
    paddingBottom: spacing.giant,
    gap: spacing.giant,
  },
  // Flat teal rather than a gradient: `tealMid` is the midpoint of the two
  // stops it used to run between, so the panel keeps its colour and drops only
  // the sheen.
  hero: {
    backgroundColor: colors.tealMid,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxxl,
    gap: spacing.xxl,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: overlay.white16,
    borderWidth: 1.5,
    borderColor: overlay.white30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: overlay.white16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...type.h2,
    color: colors.white,
  },
  identitySub: {
    ...type.caption,
    color: overlay.white75,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: overlay.white08,
    borderRadius: radius.md,
    paddingVertical: spacing.xl,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  statValue: {
    ...type.h3,
    color: colors.white,
  },
  statLabel: {
    ...type.caption,
    fontSize: 12,
    color: overlay.white75,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: overlay.white16,
  },
  section: {
    gap: spacing.xl,
  },
  rows: {
    overflow: 'hidden',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.sandChip,
    borderRadius: radius.pill,
    padding: 3,
    gap: 2,
  },
  segmentItem: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: 6,
  },
  segmentItemOn: {
    backgroundColor: colors.teal,
  },
  segmentText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.muted2,
  },
  segmentTextOn: {
    color: colors.white,
  },
});
