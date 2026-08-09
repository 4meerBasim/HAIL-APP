import React from 'react';
import { Image, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Text from './AppText';
import { colors, fonts, radius, shadow } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { Dish, formatPrice } from '../data/menu';
import PricePill from './PricePill';
import Tag from './Tag';

export interface DishCardProps {
  dish: Dish;
  onPress?: () => void;
  onAdd?: () => void;
  showAdd?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function DishCard({ dish, onPress, onAdd, showAdd = false, style }: DishCardProps) {
  const { t, lang } = useLanguage();
  const name = lang === 'ar' ? dish.name : t(`dish.${dish.id}.name`, dish.name);
  const sub = lang === 'ar' ? dish.sub : t(`dish.${dish.id}.sub`, dish.sub);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, shadow.card, style]}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: dish.image }} style={styles.image} resizeMode="cover" />
        <Tag variant={dish.cat} style={styles.tag} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {sub}
        </Text>
        <View style={styles.priceRow}>
          <PricePill value={formatPrice(dish.price, lang)} size="sm" />
          {showAdd ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onAdd}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              style={styles.addBtn}
            >
              <Text style={styles.addText}>+</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 100,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.sand,
  },
  tag: {
    position: 'absolute',
    top: 8,
    start: 8,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 3,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.ink,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.muted2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
    lineHeight: 20,
  },
});
