import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import Stepper from '../components/Stepper';
import MacroRow, { MACRO_COLOR, MACRO_ICON } from '../components/MacroRow';
import { colors, fonts, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { toArabicDigits } from '../i18n/digits';
import { usePlan } from '../state/PlanContext';
import { formatPrice, getDish, groupNumber, macros as dishMacros } from '../data/menu';
import {
  type MacroKey,
  ZERO_DELTA,
  addOns,
  deltaBounds,
  macroKeys,
  macroSteps,
} from '../data/nutrition';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const SCRIM = [scrim.heroFade, scrim.hero] as const;

const MACRO_LABEL: Record<MacroKey, string> = {
  protein: 'detail.protein',
  carbs: 'detail.carbs',
  fat: 'detail.fat',
};

export default function MealCustomizeScreen({
  route,
  navigation,
}: RootStackScreenProps<'MealCustomize'>) {
  const { dishId } = route.params;
  const { t, lang, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { plan, meals, setDelta, resetDelta, toggleAddOn } = usePlan();

  const dish = getDish(dishId);
  const base = dishMacros[dishId] ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const line = meals.find((m) => m.dishId === dishId);
  const delta = plan.deltas[dishId] ?? ZERO_DELTA;
  const selected = plan.addOns[dishId] ?? [];
  const current = line?.macros ?? base;
  const price = line?.price ?? 0;
  const touched = macroKeys.some((k) => delta[k] !== 0) || selected.length > 0;

  const name = dish ? (lang === 'ar' ? dish.name : t(`dish.${dishId}.name`, dish.name)) : dishId;

  const step = (key: MacroKey, dir: 1 | -1) =>
    setDelta(dishId, key, delta[key] + dir * macroSteps[key]);

  return (
    <Screen scroll={false} edges={['bottom', 'left', 'right']}>
      <View style={styles.hero}>
        {dish ? (
          <Image source={{ uri: dish.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        <LinearGradient colors={SCRIM} locations={[0.25, 1]} style={StyleSheet.absoluteFill} />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={[styles.backBtn, { top: insets.top + 12 }]}
        >
          <Icon
            path={isRTL ? icons.chevronRight : icons.chevronLeft}
            size={14}
            color={colors.ink}
            strokeWidth={2.4}
          />
        </TouchableOpacity>

        <View style={styles.heroFoot}>
          <Text style={styles.heroKcal}>
            {`${toArabicDigits(current.calories, lang)} ${t('detail.calories')}`}
          </Text>
          <Text style={styles.heroName} numberOfLines={2}>
            {name}
          </Text>
        </View>
      </View>

      <View style={styles.sheet}>
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <MacroRow macros={current} target={base} />

          <View style={styles.group}>
            <View style={styles.groupHead}>
              <Text style={styles.groupLabel}>{t('customize.macros')}</Text>
              {touched ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => resetDelta(dishId)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('customize.reset')}
                >
                  <Text style={styles.reset}>{t('customize.reset')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Card padding={spacing.xxl} style={styles.steppers}>
              {macroKeys.map((key, i) => {
                const bounds = deltaBounds(base, key);
                return (
                  <React.Fragment key={key}>
                    {i > 0 ? <View style={styles.divider} /> : null}
                    <Stepper
                      icon={MACRO_ICON[key]}
                      iconColor={MACRO_COLOR[key]}
                      label={t(MACRO_LABEL[key])}
                      value={current[key]}
                      suffix={t('unit.g')}
                      onDecrement={() => step(key, -1)}
                      onIncrement={() => step(key, 1)}
                      canDecrement={delta[key] > bounds.min}
                      canIncrement={delta[key] < bounds.max}
                    />
                  </React.Fragment>
                );
              })}
            </Card>
          </View>

          <View style={styles.group}>
            <Text style={styles.groupLabel}>{t('customize.addOns')}</Text>
            <View style={styles.addOnGrid}>
              {addOns.map((a) => {
                const on = selected.includes(a.id);
                return (
                  <TouchableOpacity
                    key={a.id}
                    activeOpacity={0.85}
                    onPress={() => toggleAddOn(dishId, a.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={t(`addon.${a.id}`)}
                    style={[styles.addOn, on ? styles.addOnOn : styles.addOnOff]}
                  >
                    <Icon
                      path={icons[a.icon]}
                      size={20}
                      color={on ? colors.tealText : colors.muted}
                      strokeWidth={1.8}
                    />
                    <Text style={[styles.addOnLabel, on && styles.addOnLabelOn]} numberOfLines={1}>
                      {t(`addon.${a.id}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('customize.perMeal')}</Text>
            <Text style={styles.price}>{formatPrice(groupNumber(price), lang)}</Text>
          </View>
          <Button
            label={t('common.done')}
            variant="primary"
            size="lg"
            full
            onPress={() => navigation.goBack()}
            style={shadow.teal}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 210,
    flexShrink: 0,
    backgroundColor: colors.tealDark,
  },
  backBtn: {
    position: 'absolute',
    start: spacing.xxxl,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  heroFoot: {
    position: 'absolute',
    start: spacing.huge,
    end: spacing.huge,
    bottom: spacing.giant + spacing.md,
    gap: 2,
  },
  heroKcal: {
    ...type.captionStrong,
    color: colors.amber,
  },
  heroName: {
    ...type.h1,
    color: colors.white,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.sheet2,
    borderTopRightRadius: radius.sheet2,
    marginTop: -24,
    ...shadow.sheet,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.huge,
    paddingBottom: spacing.huge,
    gap: spacing.giant,
  },
  group: {
    gap: spacing.md,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  groupLabel: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  reset: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.coral,
  },
  steppers: {
    gap: spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: colors.sand,
  },
  addOnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  addOn: {
    width: '31.5%',
    minHeight: 62,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addOnOn: {
    borderColor: colors.teal,
    backgroundColor: colors.healthyBg,
  },
  addOnOff: {
    borderColor: colors.sand,
    backgroundColor: colors.white,
  },
  addOnLabel: {
    ...type.micro,
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
  },
  addOnLabelOn: {
    fontFamily: fonts.bold,
    color: colors.tealText,
  },
  footer: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.sand,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  priceLabel: {
    ...type.caption,
    color: colors.muted,
  },
  price: {
    ...type.h2,
    color: colors.teal,
  },
});
