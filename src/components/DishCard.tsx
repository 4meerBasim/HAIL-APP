import React from 'react';
import { Image, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Text from './AppText';
import { colors, fonts, radius, shadow, spacing } from '../theme';
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

// Depth comes from three things at once, because a shadow alone on a card the
// same colour as the page does nothing: the card is white against the warm page,
// the photo is inset inside it with its own rounding rather than bleeding to the
// card edge, and the shadow is a real one. Inset beats full-bleed here because
// the offer photographs are shot on pale paper — bled to the edge they merge
// into the card, framed they read as a picture sitting on it.
export default function DishCard({ dish, onPress, onAdd, showAdd = false, style }: DishCardProps) {
  const { t, lang } = useLanguage();
  const name = lang === 'ar' ? dish.name : t(`dish.${dish.id}.name`, dish.name);
  const sub = lang === 'ar' ? dish.sub : t(`dish.${dish.id}.sub`, dish.sub);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, shadow.lifted, style]}
    >
      <View style={styles.imageWrap}>
        <Image source={dish.image} style={styles.image} resizeMode="cover" />
        <Tag variant={dish.cat} style={styles.tag} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.sub} numberOfLines={2}>
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
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.sand,
    padding: 7,
  },
  imageWrap: {
    height: 118,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.tile,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tag: {
    position: 'absolute',
    top: 7,
    start: 7,
  },
  body: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    gap: 3,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.muted2,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontFamily: fonts.heavy,
    fontSize: 19,
    color: colors.amberText,
    lineHeight: 24,
  },
});
