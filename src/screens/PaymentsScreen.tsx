import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { type IconName, icons } from '../components/icons';
import Card from '../components/Card';
import SettingRow from '../components/SettingRow';
import { colors, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useStoredState } from '../state/useStoredState';
import { type StoredCard, brandLabel } from '../data/card';
import type { PaymentMethod } from '../data/menu';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

// Cash first because it is how most orders in Baghdad are actually paid, and a
// default the customer never has to change is the best default there is.
const METHODS: { id: PaymentMethod; icon: IconName }[] = [
  { id: 'cash', icon: 'bag' },
  { id: 'zain', icon: 'phone' },
  { id: 'card', icon: 'creditCard' },
];

export default function PaymentsScreen({ navigation }: RootStackScreenProps<'Payments'>) {
  const { t } = useLanguage();
  const [method, setMethod, reloadMethod] = useStoredState<PaymentMethod>('@hail/payment-method', 'cash');
  const [card, , reloadCard] = useStoredState<StoredCard | null>('@hail/card', null);

  // The card form writes both keys and pops straight back to here, so this
  // screen has to re-read them when it comes forward rather than trusting what
  // it loaded when it first mounted.
  useEffect(
    () =>
      navigation.addListener('focus', () => {
        reloadCard();
        reloadMethod();
      }),
    [navigation, reloadCard, reloadMethod],
  );

  // Selecting "card" with nothing on file is really a request to add one.
  const choose = (id: PaymentMethod) => {
    if (id === 'card' && !card) {
      navigation.navigate('AddCard');
      return;
    }
    setMethod(id);
  };

  const subFor = (id: PaymentMethod) =>
    id === 'card' && card
      ? `${brandLabel[card.brand]} •••• ${card.last4} · ${card.expiry}`
      : t(`payments.${id}.sub`);

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
          <Text style={styles.title}>{t('profile.payments')}</Text>
          <Text style={styles.subtitle}>{t('payments.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card padding={0} style={styles.rows}>
          {METHODS.map((m, i) => {
            const on = m.id === method;
            return (
              <SettingRow
                key={m.id}
                first={i === 0}
                icon={m.icon}
                label={t(`payments.${m.id}`)}
                sub={subFor(m.id)}
                onPress={() => choose(m.id)}
                trailing={
                  on ? (
                    <View style={styles.badge}>
                      <Icon path={icons.check} size={11} color={colors.white} strokeWidth={3} />
                      <Text style={styles.badgeText}>{t('payments.default')}</Text>
                    </View>
                  ) : (
                    <View style={styles.tick} />
                  )
                }
              />
            );
          })}
          {card ? (
            <SettingRow
              icon="creditCard"
              label={t('payments.card.change')}
              onPress={() => navigation.navigate('AddCard')}
            />
          ) : null}
        </Card>

        <Text style={styles.note}>{t('payments.note')}</Text>
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
  content: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.giant,
    gap: spacing.xxl,
  },
  rows: {
    overflow: 'hidden',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.teal,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  badgeText: {
    ...type.micro,
    color: colors.white,
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.sand,
  },
  note: {
    ...type.caption,
    color: colors.muted2,
    paddingHorizontal: spacing.xs,
  },
});
