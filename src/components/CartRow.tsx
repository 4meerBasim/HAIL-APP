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
import { colors, fonts, radius, shadow } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { formatPrice } from '../data/menu';

export interface CartItem {
  id: string;
  name: string;
  price: string;
  image: ImageSourcePropType;
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
    <View style={[styles.row, shadow.lifted, style]}>
      <Image source={item.image} style={styles.image} resizeMode="cover" />
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
        <Text style={styles.count}>{formatNumber(item.qty)}</Text>
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
    gap: 13,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.sand,
    paddingHorizontal: 12,
    paddingVertical: 11,
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
  price: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.goldText,
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
    fontSize: 18,
    color: colors.tealText,
  },
  count: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    minWidth: 14,
    textAlign: 'center',
  },
});
