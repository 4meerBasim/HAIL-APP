import React, { useState } from 'react';
import { Image, StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import { colors, fonts, radius, shadow, spacing } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { toArabicDigits } from '../i18n/digits';
import {
  formatPrice,
  getDish,
  macros as dishMacros,
  ingredientKeys as dishIngredientKeys,
} from '../data/menu';
import { useCart } from '../state/CartContext';
import { usePlan } from '../state/PlanContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const DEFAULT_DISH_ID = 'masgouf';

export default function DishDetailScreen({ route, navigation }: RootStackScreenProps<'DishDetail'>) {
  const { t, lang, isRTL } = useLanguage();
  const { addItem } = useCart();
  const { plan, toggleDish } = usePlan();
  const insets = useSafeAreaInsets();
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);

  const dish = getDish(route.params?.id ?? DEFAULT_DISH_ID) ?? getDish(DEFAULT_DISH_ID)!;
  const dishName = lang === 'ar' ? dish.name : t(`dish.${dish.id}.name`, dish.name);

  const fmtNum = (n: number | string): string => toArabicDigits(n, lang);
  const gram = t('detail.gram');
  const isHealthy = dish.cat === 'h';

  const macros = dishMacros[dish.id];
  const ingredientKeys = dishIngredientKeys[dish.id] ?? [];
  const description = t(`detail.${dish.id}.desc`, dish.sub);

  const tagLabel = t(isHealthy ? 'tag.healthy' : 'tag.regular');
  const badgeText =
    macros != null
      ? `${tagLabel} · ${fmtNum(macros.calories)} ${t('detail.calories')}`
      : tagLabel;
  const badgeBg = isHealthy ? colors.healthyBg : colors.regularBg;
  const badgeColor = isHealthy ? colors.tealText : colors.amberIcon;

  const macroCards = macros
    ? [
        { value: fmtNum(macros.calories), color: colors.ink, label: t('detail.calories') },
        { value: `${fmtNum(macros.protein)}${gram}`, color: colors.teal, label: t('detail.protein') },
        { value: `${fmtNum(macros.carbs)}${gram}`, color: colors.ink, label: t('detail.carbs') },
        { value: `${fmtNum(macros.fat)}${gram}`, color: colors.ink, label: t('detail.fat') },
      ]
    : [];

  const leadPos: ViewStyle = isRTL ? { right: 16 } : { left: 16 };
  const trailPos: ViewStyle = isRTL ? { left: 16 } : { right: 16 };
  const textStart: TextStyle = {
    textAlign: isRTL ? 'right' : 'left',
    writingDirection: isRTL ? 'rtl' : 'ltr',
  };

  return (
    <Screen scroll={false} edges={['bottom', 'left', 'right']}>
      <View style={styles.hero}>
        <Image source={{ uri: dish.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={[styles.circleBtn, { top: insets.top + 12 }, leadPos]}
        >
          <Icon
            path={isRTL ? icons.chevronRight : icons.chevronLeft}
            size={14}
            color={colors.ink}
            strokeWidth={2.4}
          />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setFav((f) => !f)}
          accessibilityRole="button"
          accessibilityLabel={t('detail.favorite')}
          accessibilityState={{ selected: fav }}
          style={[styles.circleBtn, { top: insets.top + 12 }, trailPos]}
        >
          <Icon
            path={icons.heart}
            size={16}
            color={colors.coral}
            strokeWidth={2}
            fill={fav ? colors.coral : 'none'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.badge, { backgroundColor: badgeBg }]}>
              {isHealthy ? (
                <Icon path={icons.leaf} size={12} color={badgeColor} strokeWidth={2} />
              ) : null}
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
            </View>
            <Text style={[styles.title, textStart]}>{dishName}</Text>
          </View>
          <Text style={styles.price}>{formatPrice(dish.price, lang)}</Text>
        </View>

        <Text style={[styles.desc, textStart]}>{description}</Text>

        {ingredientKeys.length > 0 && (
          <View style={styles.chips}>
            {ingredientKeys.map((key) => (
              <View key={key} style={styles.chip}>
                <Text style={styles.chipText}>{t(key)}</Text>
              </View>
            ))}
          </View>
        )}

        {macroCards.length > 0 && (
          <View style={styles.macros}>
            {macroCards.map((m) => (
              <View key={m.label} style={styles.macroCard}>
                <Text style={[styles.macroValue, { color: m.color }]}>{m.value}</Text>
                <Text style={styles.macroLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.ctaRow}>
          <View style={styles.stepper}>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => setQty((q) => Math.max(1, q - 1))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
            >
              <Text style={styles.stepSign}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepCount}>{fmtNum(qty)}</Text>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => setQty((q) => q + 1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
            >
              <Text style={styles.stepSign}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              addItem(dish.id, qty);
              navigation.navigate('Cart');
            }}
            style={[styles.cta, styles.ctaPrimary]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaPrimaryText}>{t('detail.addToCart')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (!plan.dishIds.includes(dish.id)) toggleDish(dish.id);
              navigation.navigate('MealCustomize', { dishId: dish.id });
            }}
            style={[styles.cta, styles.ctaSecondary]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaSecondaryText}>{t('detail.addToPlan')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 300,
    flexShrink: 0,
  },
  circleBtn: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    marginTop: -24,
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.huge,
    gap: 13,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerLeft: {
    flexShrink: 1,
    gap: 5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.ink,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.teal,
    marginTop: spacing.giant,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 24,
    color: colors.body,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  chipText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.body,
  },
  macros: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    ...shadow.card,
  },
  macroValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  macroLabel: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.muted2,
    marginTop: 2,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: 'auto',
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: 9,
  },
  stepSign: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.teal,
  },
  stepCount: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    minWidth: 12,
    textAlign: 'center',
  },
  cta: {
    flex: 1,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimary: {
    backgroundColor: colors.teal,
    paddingVertical: 13,
    ...shadow.teal,
  },
  ctaPrimaryText: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: colors.white,
  },
  ctaSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.teal,
    paddingVertical: 12,
  },
  ctaSecondaryText: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: colors.tealDark,
  },
});
