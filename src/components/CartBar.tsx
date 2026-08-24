import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Text from './AppText';
import Icon from './Icon';
import { icons } from './icons';
import Badge from './Badge';
import PressScale from './PressScale';
import { colors, fonts, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { count } from '../i18n/count';
import { formatPrice, groupNumber } from '../data/menu';
import { useCart } from '../state/CartContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

// What adding to the cart says now that it no longer throws the customer into
// checkout: the basket stays in view above the tab bar, counting up, and going
// to it is a choice rather than the consequence of tapping "+".
export default function CartBar() {
  const { t, lang, isRTL } = useLanguage();
  const { items, subtotal } = useCart();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const qty = items.reduce((sum, it) => sum + it.qty, 0);
  if (qty === 0) return null;

  return (
    <PressScale
      onPress={() => navigation.navigate('Cart')}
      scaleTo={0.985}
      accessibilityLabel={`${t('cart.title')} · ${count('count.items', qty, t)}`}
      style={[styles.bar, shadow.raised, { direction: isRTL ? 'rtl' : 'ltr' }]}
    >
      <View style={styles.bag}>
        <Icon path={icons.bag} size={17} color={colors.white} strokeWidth={1.9} />
        <Badge count={qty} ringColor={colors.teal} />
      </View>

      <View style={styles.text}>
        <Text style={styles.count} numberOfLines={1}>
          {count('count.items', qty, t)}
        </Text>
        <Text style={styles.action} numberOfLines={1}>
          {t('cart.bar.view')}
        </Text>
      </View>

      <Text style={styles.total} numberOfLines={1}>
        {formatPrice(groupNumber(subtotal), lang)}
      </Text>
      <Icon
        path={isRTL ? icons.chevronLeft : icons.chevronRight}
        size={14}
        color={overlay.white75}
        strokeWidth={2.4}
      />
    </PressScale>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: colors.teal,
    borderRadius: radius.card,
    marginHorizontal: spacing.huge,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  bag: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: overlay.white16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 1,
  },
  count: {
    ...type.bodyStrong,
    color: colors.white,
  },
  action: {
    ...type.caption,
    fontSize: 12,
    color: overlay.white75,
  },
  total: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.white,
  },
});
