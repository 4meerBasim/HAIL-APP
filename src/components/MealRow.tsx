import React from 'react';
import { Image, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Text from './AppText';
import MacroRow from './MacroRow';
import PricePill from './PricePill';
import Icon from './Icon';
import { icons } from './icons';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
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
  const sub = dish ? (lang === 'ar' ? dish.sub : t(`dish.${meal.dishId}.sub`, dish.sub)) : '';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={[styles.row, shadow.lifted, style]}
    >
      <View style={styles.top}>
        {dish ? <Image source={dish.image} style={styles.thumb} /> : null}

        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {sub ? (
            <Text style={styles.sub} numberOfLines={1}>
              {sub}
            </Text>
          ) : null}
        </View>

        {onRemove ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={`${t('builder.remove')} ${name}`}
            style={styles.remove}
          >
            <Icon path={icons.close} size={11} color={colors.muted} strokeWidth={2.6} />
          </TouchableOpacity>
        ) : null}
      </View>

      <MacroRow macros={meal.macros} size="sm" />

      <PricePill value={formatPrice(groupNumber(meal.price), lang)} size="sm" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.sand,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    gap: spacing.xl,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.tile,
  },
  text: {
    flex: 1,
    gap: 3,
  },
  name: {
    ...type.title,
    fontSize: 15.5,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  sub: {
    ...type.caption,
    fontSize: 12.5,
    color: colors.muted2,
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
