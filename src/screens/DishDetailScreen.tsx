import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import MacroRow from '../components/MacroRow';
import PricePill from '../components/PricePill';
import Hero from '../components/Hero';
import { colors, fonts, radius, shadow, spacing } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import {
  dishParts,
  formatPrice,
  getDish,
  groupNumber,
  macros as dishMacros,
  parsePrice,
} from '../data/menu';
import { useCart } from '../state/CartContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const DEFAULT_DISH_ID = 'quzi';

export default function DishDetailScreen({ route, navigation }: RootStackScreenProps<'DishDetail'>) {
  const { t, lang, isRTL } = useLanguage();
  const { addItem } = useCart();
  const insets = useSafeAreaInsets();
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);

  const dish = getDish(route.params?.id ?? DEFAULT_DISH_ID) ?? getDish(DEFAULT_DISH_ID)!;
  const dishName = lang === 'ar' ? dish.name : t(`dish.${dish.id}.name`, dish.name);

  const fmtNum = (n: number | string): string => formatNumber(n);
  const isHealthy = dish.cat === 'h';

  const macros = dishMacros[dish.id];
  const description = t(`detail.${dish.id}.desc`, dish.sub);
  // What comes in the box, straight off the offer sheet's own "+" list.
  const parts = dishParts(lang === 'ar' ? dish.sub : t(`dish.${dish.id}.sub`, dish.sub));

  const tagLabel = t(isHealthy ? 'tag.healthy' : 'tag.regular');
  const badgeText =
    macros != null
      ? `${tagLabel} · ${fmtNum(macros.calories)} ${t('detail.calories')}`
      : tagLabel;
  const badgeBg = isHealthy ? colors.healthyBg : colors.regularBg;
  const badgeColor = isHealthy ? colors.tealText : colors.amberIcon;

  // The button-side price is the line total, so the stepper and the money the
  // customer is about to spend never disagree.
  const lineTotal = formatPrice(groupNumber(parsePrice(dish.price) * qty), lang);

  return (
    <Screen scroll={false} edges={['bottom', 'left', 'right']} texture>
      <Hero source={dish.image}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={[styles.circleBtn, styles.lead, { top: insets.top + 12 }]}
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
          style={[styles.circleBtn, styles.trail, { top: insets.top + 12 }]}
        >
          <Icon
            path={icons.heart}
            size={16}
            color={colors.coral}
            strokeWidth={2}
            fill={fav ? colors.coral : 'none'}
          />
        </TouchableOpacity>
      </Hero>

      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            {isHealthy ? (
              <Icon path={icons.leaf} size={12} color={badgeColor} strokeWidth={2} />
            ) : null}
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
          </View>
          <Text style={styles.title}>{dishName}</Text>
        </View>

        <Text style={styles.desc}>{description}</Text>

        {parts.length > 0 && (
          <View style={styles.chips}>
            {parts.map((part) => (
              <View key={part} style={styles.chip}>
                <Text style={styles.chipText}>{part}</Text>
              </View>
            ))}
          </View>
        )}

        {macros ? (
          <View style={[styles.macros, shadow.card]}>
            <MacroRow macros={macros} />
          </View>
        ) : null}

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

          <PricePill value={lineTotal} size="sm" style={styles.ctaPrice} />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              addItem(dish.id, qty);
              navigation.navigate('Cart');
            }}
            style={[styles.cta, styles.ctaPrimary]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaPrimaryText} numberOfLines={1}>
              {t('detail.addToCart')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // See TrackingScreen: `left`/`right` are mirrored under RTL, so the physical
  // ternary this replaced put the control on the wrong edge.
  lead: {
    start: 16,
  },
  trail: {
    end: 16,
  },
  circleBtn: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
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
    alignItems: 'flex-start',
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
    fontSize: 12.5,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 35,
    color: colors.ink,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 27,
    color: colors.body,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.body,
  },
  macros: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
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
    backgroundColor: colors.card,
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
  // PricePill aligns itself to the top of a column by default; in this row it
  // has to sit on the stepper's centre line.
  ctaPrice: {
    alignSelf: 'center',
  },
  cta: {
    flex: 1,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimary: {
    backgroundColor: colors.gold,
    paddingVertical: 15,
    ...shadow.cta,
  },
  ctaPrimaryText: {
    fontFamily: fonts.bold,
    fontSize: 16.5,
    color: colors.amberText,
  },
});
