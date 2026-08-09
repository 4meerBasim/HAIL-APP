import React from 'react';
import { Image, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Text from './AppText';
import { colors, fonts, radius, shadow } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { toArabicDigits } from '../i18n/digits';
import { formatPrice } from '../data/menu';

export interface CartItem {
  id: string;
  name: string;
  price: string;
  image: string;
  qty: number;
}

export interface CartRowProps {
  item: CartItem;
  onInc: () => void;
  onDec: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function CartRow({ item, onInc, onDec, style }: CartRowProps) {
  const { t, lang } = useLanguage();
  const name = lang === 'ar' ? item.name : t(`dish.${item.id}.name`, item.name);

  return (
    <View style={[styles.row, shadow.card, style]}>
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.price}>{formatPrice(item.price, lang)}</Text>
      </View>
      <View style={styles.stepper}>
        <TouchableOpacity activeOpacity={0.7} onPress={onDec} hitSlop={8}>
          <Text style={styles.stepAction}>−</Text>
        </TouchableOpacity>
        <Text style={styles.count}>{toArabicDigits(item.qty, lang)}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onInc} hitSlop={8}>
          <Text style={styles.stepAction}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  image: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.sand,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.ink,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.teal,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.sandChip,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  stepAction: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.teal,
  },
  count: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.ink,
    minWidth: 14,
    textAlign: 'center',
  },
});
