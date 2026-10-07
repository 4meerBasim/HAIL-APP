import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { icons } from './icons';
import { colors, fonts, radius, shadow } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { buildLabel } from '../i18n/orderText';
import { type Build, formatPrice } from '../data/menu';

export interface CartItem {
  /** The line's own key: the dish, plus its build when it has one. */
  id: string;
  dishId: string;
  name: string;
  /** Price of one, extras included. */
  price: string;
  image: ImageSourcePropType;
  qty: number;
  /** What a made-to-order line was assembled from — drawn as its note. */
  build?: Build;
}

export interface CartRowProps {
  item: CartItem;
  onInc: () => void;
  onDec: () => void;
  /** Opens the line. Only the photo and the text take the press — the quantity
   *  buttons stay outside it, because a touchable wrapping a touchable is how
   *  the +/- stop responding. */
  onOpen?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function CartRow({ item, onInc, onDec, onOpen, style }: CartRowProps) {
  const { t, lang } = useLanguage();
  const name = lang === 'ar' ? item.name : t(`dish.${item.dishId}.name`, item.name);
  const last = item.qty <= 1;

  return (
    <View style={[styles.row, shadow.lifted, style]}>
      <TouchableOpacity
        activeOpacity={onOpen ? 0.75 : 1}
        disabled={!onOpen}
        onPress={onOpen}
        accessibilityRole={onOpen ? 'button' : undefined}
        accessibilityLabel={onOpen ? name : undefined}
        style={styles.head}
      >
        <Image source={item.image} style={styles.image} resizeMode="cover" />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {item.build ? (
            <Text style={styles.note} numberOfLines={2}>
              {buildLabel(item.build.key, t)}
            </Text>
          ) : null}
          <Text style={styles.price}>{formatPrice(item.price, lang)}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.stepper}>
        {/* Drawn rather than typed: a text '+' sits on its own baseline and
            rides high in a circle, and '−' and '×' each ride differently
            again. The icon is centred by its own box. At one, the minus is
            what removes the line, so it becomes a cross and says so. */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onDec}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={last ? t('cart.remove') : t('common.decrease')}
          style={styles.stepBtn}
        >
          <Icon
            path={last ? icons.close : icons.minus}
            size={13}
            color={last ? colors.coral : colors.tealText}
            strokeWidth={2.8}
          />
        </TouchableOpacity>
        <Text style={styles.count}>{formatNumber(item.qty)}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onInc}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.increase')}
          style={styles.stepBtn}
        >
          <Icon path={icons.plus} size={13} color={colors.tealText} strokeWidth={2.8} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.sand,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  // The photo and the text are one press target, laid out the way they used to
  // sit directly in the row — so the row still reads as photo, text, stepper.
  head: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.tile,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 15.5,
    color: colors.ink,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted2,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.goldText,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.sandChip,
    borderRadius: radius.pill,
    padding: 4,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    minWidth: 16,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
