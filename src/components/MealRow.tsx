import React from 'react';
import { Image, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Text from './AppText';
import MacroRow from './MacroRow';
import Icon from './Icon';
import { icons } from './icons';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { toArabicDigits } from '../i18n/digits';
import { formatPrice, getDish, groupNumber } from '../data/menu';
import type { MealLine } from '../state/PlanContext';

export interface MealRowProps {
  meal: MealLine;
  onPress?: () => void;
  onRemove?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function MealRow({ meal, onPress, onRemove, style }: MealRowProps) {
  const { t, lang } = useLanguage();
  const dish = getDish(meal.dishId);
  const name = dish
    ? lang === 'ar'
      ? dish.name
      : t(`dish.${meal.dishId}.name`, dish.name)
    : meal.dishId;
  const tuned =
    meal.delta.protein !== 0 || meal.delta.carbs !== 0 || meal.delta.fat !== 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={[styles.row, shadow.card, style]}
    >
      <View style={styles.top}>
        {dish ? <Image source={{ uri: dish.image }} style={styles.thumb} /> : null}

        <View style={styles.text}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {tuned ? (
              <Icon path={icons.pencil} size={11} color={colors.tealText} strokeWidth={2.2} />
            ) : null}
          </View>
          {meal.addOns.length > 0 ? (
            <Text style={styles.sub} numberOfLines={1}>
              {`${toArabicDigits(meal.addOns.length, lang)} ${t('customize.addOns')}`}
            </Text>
          ) : null}
        </View>

        <Text style={styles.price}>{formatPrice(groupNumber(meal.price), lang)}</Text>

        {onRemove ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={name}
            style={styles.remove}
          >
            <Icon path={icons.close} size={11} color={colors.muted} strokeWidth={2.6} />
          </TouchableOpacity>
        ) : null}
      </View>

      <MacroRow macros={meal.macros} size="sm" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.sand,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...type.title,
    fontSize: 13.5,
    fontFamily: fonts.bold,
    color: colors.ink,
    flexShrink: 1,
  },
  sub: {
    ...type.caption,
    fontSize: 11,
    color: colors.muted2,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.teal,
  },
  remove: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.sandChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
