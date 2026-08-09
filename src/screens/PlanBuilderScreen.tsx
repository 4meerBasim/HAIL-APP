import React, { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import MealRow from '../components/MealRow';
import MacroRow from '../components/MacroRow';
import SectionHeader from '../components/SectionHeader';
import { colors, fonts, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { toArabicDigits } from '../i18n/digits';
import { useAuth } from '../state/AuthContext';
import { usePlan } from '../state/PlanContext';
import {
  type BoxGoal,
  dishes,
  formatPrice,
  groupNumber,
  macros as dishMacros,
} from '../data/menu';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const SCRIM = [scrim.heroFade, scrim.hero] as const;

export default function PlanBuilderScreen({
  route,
  navigation,
}: RootStackScreenProps<'PlanBuilder'>) {
  const boxId = route.params?.boxId;
  const { t, lang } = useLanguage();
  const { targets } = useAuth();
  const { plan, meals, pricing, dailyMacros, startFromBox, toggleDish } = usePlan();

  useEffect(() => {
    if (boxId && plan.boxId !== boxId) startFromBox(boxId as BoxGoal);
  }, [boxId, plan.boxId, startFromBox]);

  const picked = plan.dishIds;

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={styles.backBtn}
        >
          <Icon path={icons.close} size={16} color={colors.ink} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('builder.title')}</Text>
          <Text style={styles.subtitle}>{t('builder.subtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {picked.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title={t('builder.yourMeals')}
              subtitle={`${toArabicDigits(picked.length, lang)} ${t('unit.meals')}`}
            />
            <Card padding={spacing.xl} style={styles.macroCard}>
              <Text style={styles.cardLabel}>{t('planMacros.perDay')}</Text>
              <MacroRow macros={dailyMacros} target={targets ?? undefined} />
            </Card>
            <View style={styles.meals}>
              {meals.map((meal) => (
                <MealRow
                  key={meal.dishId}
                  meal={meal}
                  onPress={() => navigation.navigate('MealCustomize', { dishId: meal.dishId })}
                  onRemove={() => toggleDish(meal.dishId)}
                />
              ))}
            </View>
          </View>
        ) : (
          <Card background={colors.sandChip} style={styles.empty}>
            <Icon path={icons.puzzle} size={30} color={colors.muted} strokeWidth={1.6} />
            <Text style={styles.emptyText}>{t('builder.empty')}</Text>
          </Card>
        )}

        <View style={styles.section}>
          <SectionHeader title={t('builder.pick')} />
          <View style={styles.pickerGrid}>
            {dishes.map((dish) => {
              const on = picked.includes(dish.id);
              const m = dishMacros[dish.id];
              const name = lang === 'ar' ? dish.name : t(`dish.${dish.id}.name`, dish.name);
              return (
                <TouchableOpacity
                  key={dish.id}
                  activeOpacity={0.85}
                  onPress={() => toggleDish(dish.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={name}
                  style={[styles.pick, on ? styles.pickOn : styles.pickOff]}
                >
                  <View style={styles.pickImageWrap}>
                    <Image source={{ uri: dish.image }} style={styles.pickImage} />
                    <LinearGradient
                      colors={SCRIM}
                      locations={[0.45, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={[styles.pickBadge, on ? styles.pickBadgeOn : styles.pickBadgeOff]}>
                      <Icon
                        path={on ? icons.check : icons.plus}
                        size={13}
                        color={on ? colors.white : colors.ink}
                        strokeWidth={2.6}
                      />
                    </View>
                    <Text style={styles.pickName} numberOfLines={1}>
                      {name}
                    </Text>
                  </View>
                  <View style={styles.pickBody}>{m ? <MacroRow macros={m} size="sm" /> : null}</View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t('customize.perMeal')}</Text>
          <Text style={styles.price}>
            {picked.length > 0 ? formatPrice(groupNumber(pricing.perMealAvg), lang) : '—'}
          </Text>
        </View>
        <Button
          label={t('common.continue')}
          variant="primary"
          size="lg"
          full
          disabled={picked.length === 0}
          onPress={() => navigation.navigate('Subscribe')}
          style={shadow.teal}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  headerText: {
    flex: 1,
    gap: 1,
  },
  title: {
    ...type.h1,
    color: colors.ink,
  },
  subtitle: {
    ...type.caption,
    color: colors.muted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.giant,
    gap: spacing.giant,
  },
  section: {
    gap: spacing.xl,
  },
  macroCard: {
    gap: spacing.md,
  },
  cardLabel: {
    ...type.caption,
    color: colors.muted,
  },
  meals: {
    gap: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.giant,
  },
  emptyText: {
    ...type.body,
    color: colors.muted,
    textAlign: 'center',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  pick: {
    width: '47.5%',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  pickOn: {
    borderColor: colors.teal,
  },
  pickOff: {
    borderColor: colors.sand,
  },
  pickImageWrap: {
    height: 88,
  },
  pickImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.sand,
  },
  pickBadge: {
    position: 'absolute',
    top: 7,
    end: 7,
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickBadgeOn: {
    backgroundColor: colors.teal,
  },
  pickBadgeOff: {
    backgroundColor: colors.white,
  },
  pickName: {
    position: 'absolute',
    bottom: 7,
    start: 9,
    end: 9,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
  pickBody: {
    paddingHorizontal: 9,
    paddingVertical: 9,
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
