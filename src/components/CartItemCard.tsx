import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { icons } from './icons';
import type { CartItem } from './CartRow';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { formatPrice } from '../data/menu';

export interface CartItemCardProps {
  item: CartItem;
  width: number;
  onInc: () => void;
  onDec: () => void;
  /** Opens the line. Only the photo and the name take the press — the quantity
   *  buttons sit outside it, because a touchable wrapping a touchable is how
   *  the +/- stop responding. */
  onOpen?: () => void;
}

// The cart line as a card rather than a row: several of them slide sideways in
// the space one row used to take, which is what keeps the address, the payment
// and the total on the same screen as the food.
export default function CartItemCard({ item, width, onInc, onDec, onOpen }: CartItemCardProps) {
  const { t, lang } = useLanguage();
  const name = lang === 'ar' ? item.name : t(`dish.${item.dishId}.name`, item.name);
  const last = item.qty <= 1;

  return (
    <View style={[styles.card, { width }, shadow.lifted]}>
      <TouchableOpacity
        activeOpacity={onOpen ? 0.75 : 1}
        disabled={!onOpen}
        onPress={onOpen}
        accessibilityRole={onOpen ? 'button' : undefined}
        accessibilityLabel={onOpen ? name : undefined}
        style={styles.head}
      >
        <Image source={item.image} style={styles.image} resizeMode="cover" />

        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {item.note ? (
          <Text style={styles.note} numberOfLines={2}>
            {item.note}
          </Text>
        ) : null}
      </TouchableOpacity>

      <View style={styles.foot}>
        <Text style={styles.price}>{formatPrice(item.price, lang)}</Text>

        <View style={styles.stepper}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onDec}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={last ? t('cart.remove') : t('common.decrease')}
          >
            <Icon
              path={last ? icons.close : icons.minus}
              size={12}
              color={last ? colors.coral : colors.tealText}
              strokeWidth={2.8}
            />
          </TouchableOpacity>
          <Text style={styles.qty}>{formatNumber(item.qty)}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onInc}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={t('common.increase')}
          >
            <Icon path={icons.plus} size={12} color={colors.tealText} strokeWidth={2.8} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The card's own gap used to space the photo, name and note; those now sit
  // inside the pressable head, so the gap lives there and the card only has to
  // separate the head from the foot.
  head: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.sand,
    padding: spacing.lg,
  },
  image: {
    width: '100%',
    height: 82,
    borderRadius: radius.md,
    backgroundColor: colors.tile,
  },
  name: {
    ...type.title,
    fontSize: 14.5,
    color: colors.ink,
  },
  note: {
    ...type.caption,
    fontSize: 11.5,
    color: colors.muted2,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: 'auto',
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.goldText,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.healthyBg,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  qty: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
    minWidth: 12,
    textAlign: 'center',
  },
});
