import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import PatternFill from '../components/PatternFill';
import { type IconName, icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import PressScale from '../components/PressScale';
import SectionHeader from '../components/SectionHeader';
import SettingRow from '../components/SettingRow';
import { colors, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { formatPhone } from '../data/phone';
import { useOrders } from '../state/OrdersContext';
import { useAuth } from '../state/AuthContext';
import { planProgress, usePlan } from '../state/PlanContext';
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

export default function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const { t, isRTL } = useLanguage();
  const { status, user, signOut } = useAuth();
  const { subscription } = usePlan();
  const { orders } = useOrders();
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
    () => (subscription ? planProgress(subscription) : null),
    [subscription],
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

  // The hero is the only surface showing the account's number, so it is also
  // where the customer reaches for when they want to change it. Guests have no
  // number to manage, so for them it stays a plain panel.
  const hero = (
    <>
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
            {authed ? formatNumber(formatPhone(user?.phone ?? '')) : t('profile.guest')}
          </Text>
          <Text style={[styles.identitySub, readingSide]} numberOfLines={2}>
            {authed ? t('phones.manage') : t('profile.guest.sub')}
          </Text>
        </View>
        {/* The chevron is the promise that the panel opens something. */}
        {authed ? (
          <Icon
            path={isRTL ? icons.chevronLeft : icons.chevronRight}
            size={17}
            color={overlay.white75}
            strokeWidth={2.2}
          />
        ) : null}
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
    </>
  );

  return (
    <Screen scroll contentContainerStyle={styles.content} texture>
      {authed ? (
        <PressScale
          style={[styles.hero, shadow.raised]}
          scaleTo={0.985}
          onPress={() => navigation.navigate('Phones')}
          accessibilityLabel={t('phones.manage')}
        >
          {hero}
        </PressScale>
      ) : (
        <View style={[styles.hero, shadow.raised]}>{hero}</View>
      )}

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
        </Card>
      </View>

      {authed ? (
        <Button
          label={t('profile.signOut')}
          variant="outline"
          size="lg"
          full
          color={colors.coral}
          onPress={signOut}
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
});
