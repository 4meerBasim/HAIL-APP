import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fonts, radius, shadow, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatPrice, groupNumber } from '../data/menu';
import { useCart } from '../state/CartContext';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import Card from '../components/Card';
import Button from '../components/Button';
import CartRow from '../components/CartRow';
import { RootStackScreenProps } from '../navigation/RootNavigator';

const DELIVERY_FEE = 2000;

const CHEVRON = { rtl: 'M9 5l7 7-7 7', ltr: 'M15 5l-7 7 7 7' } as const;

type PaymentMethod = 'online' | 'cash';

interface PaymentOptionProps {
  selected: boolean;
  onPress: () => void;
  title: string;
  sub: string;
}

function PaymentOption({ selected, onPress, title, sub }: PaymentOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.payOption, selected ? styles.payOptionOn : styles.payOptionOff]}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={[styles.radio, selected ? styles.radioOn : styles.radioOff]} />
      <View style={styles.payTextWrap}>
        <Text style={styles.payTitle}>{title}</Text>
        <Text style={styles.paySub}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CartScreen({ navigation }: RootStackScreenProps<'Cart'>) {
  const { t, lang, isRTL } = useLanguage();
  const { items, changeQty, subtotal } = useCart();
  const insets = useSafeAreaInsets();
  const [payment, setPayment] = useState<PaymentMethod>('online');

  const total = subtotal + DELIVERY_FEE;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backBtn, shadow.card]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              hitSlop={8}
            >
              <Icon
                path={isRTL ? CHEVRON.rtl : CHEVRON.ltr}
                size={14}
                color={colors.ink}
                strokeWidth={2.4}
              />
            </TouchableOpacity>
            <Text style={styles.title}>{t('cart.title')}</Text>
          </View>

          <View style={styles.items}>
            {items.map((it) => (
              <CartRow
                key={it.id}
                item={it}
                onInc={() => changeQty(it.id, 1)}
                onDec={() => changeQty(it.id, -1)}
              />
            ))}
          </View>

          <Card style={styles.addressCard}>
            <View style={styles.addressIcon}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z"
                  stroke={colors.teal}
                  strokeWidth={2}
                />
                <Circle cx={12} cy={10} r={2.5} fill={colors.teal} />
              </Svg>
            </View>
            <View style={styles.addressText}>
              <Text style={styles.addressTitle}>{t('cart.deliverTo')}</Text>
              <Text style={styles.addressSub}>{t('cart.address')}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.6} accessibilityRole="button">
              <Text style={styles.changeLink}>{t('common.change')}</Text>
            </TouchableOpacity>
          </Card>

          <Card style={styles.paymentSection}>
            <Text style={styles.paymentLabel}>{t('cart.payment')}</Text>
            <View style={styles.paymentRow}>
              <PaymentOption
                selected={payment === 'online'}
                onPress={() => setPayment('online')}
                title={t('cart.pay.online.title')}
                sub={t('cart.pay.online.sub')}
              />
              <PaymentOption
                selected={payment === 'cash'}
                onPress={() => setPayment('cash')}
                title={t('cart.pay.cash.title')}
                sub={t('cart.pay.cash.sub')}
              />
            </View>
          </Card>
        </ScrollView>

        <View
          style={[styles.sheet, shadow.sheet, { paddingBottom: Math.max(36, insets.bottom + 16) }]}
        >
          <Card style={styles.summaryCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('cart.subtotal')}</Text>
              <Text style={styles.totalLabel}>{formatPrice(groupNumber(subtotal), lang)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('cart.delivery')}</Text>
              <Text style={styles.totalLabel}>{formatPrice(groupNumber(DELIVERY_FEE), lang)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandRow]}>
              <Text style={styles.grandLabel}>{t('cart.total')}</Text>
              <Text style={styles.grandValue}>{formatPrice(groupNumber(total), lang)}</Text>
            </View>
          </Card>
          <Button
            label={t('cart.confirm')}
            variant="primary"
            size="lg"
            full
            onPress={() => navigation.navigate('Tracking')}
            style={[styles.cta, shadow.teal]}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...type.h1,
    color: colors.ink,
  },
  items: {
    gap: 9,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.healthyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressText: {
    flex: 1,
    gap: 2,
  },
  addressTitle: {
    ...type.bodyStrong,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  addressSub: {
    ...type.caption,
    color: colors.muted2,
  },
  changeLink: {
    ...type.captionStrong,
    fontFamily: fonts.bold,
    color: colors.teal,
  },
  paymentSection: {
    gap: 8,
  },
  paymentLabel: {
    ...type.bodyStrong,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 9,
  },
  payOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1.5,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  payOptionOn: {
    borderColor: colors.teal,
    backgroundColor: colors.healthyBg,
  },
  payOptionOff: {
    borderColor: colors.sand,
  },
  radio: {
    width: 19,
    height: 19,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  radioOn: {
    borderWidth: 6,
    borderColor: colors.teal,
  },
  radioOff: {
    borderWidth: 1.5,
    borderColor: colors.faint3,
  },
  payTextWrap: {
    flex: 1,
    gap: 2,
  },
  payTitle: {
    ...type.captionStrong,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  paySub: {
    ...type.micro,
    color: colors.muted2,
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 18,
    paddingTop: 16,
    gap: 10,
  },
  summaryCard: {
    gap: 7,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...type.body,
    color: colors.body,
  },
  grandRow: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: colors.sand,
    paddingTop: 8,
  },
  grandLabel: {
    ...type.h3,
    color: colors.ink,
  },
  grandValue: {
    ...type.h3,
    color: colors.teal,
  },
  cta: {
    marginTop: 2,
  },
});
