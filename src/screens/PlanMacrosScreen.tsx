import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import Stepper from '../components/Stepper';
import MacroRow, { MACRO_COLOR, MACRO_ICON } from '../components/MacroRow';
import { colors, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../state/PlanContext';
import { formatPrice, groupNumber } from '../data/menu';
import { type MacroKey, macroKeys, macroSteps } from '../data/nutrition';
import { toArabicDigits } from '../i18n/digits';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const PLAN_GRADIENT = [colors.tealDark, colors.teal] as const;

const MACRO_LABEL: Record<MacroKey, string> = {
  protein: 'detail.protein',
  carbs: 'detail.carbs',
  fat: 'detail.fat',
};

export default function PlanMacrosScreen({ navigation }: RootStackScreenProps<'PlanMacros'>) {
  const { t, lang } = useLanguage();
  const { planMacros, dailyMacros, pricing, setPlanTarget } = usePlan();

  const { mealCount } = pricing;
  // One tap moves every meal in the plan by a single macro step.
  const stepFor = (key: MacroKey) => Math.max(1, mealCount) * macroSteps[key];

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
          <Text style={styles.title}>{t('planMacros.title')}</Text>
          <Text style={styles.subtitle}>{t('planMacros.subtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={PLAN_GRADIENT}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[styles.summary, shadow.raised]}
        >
          <View style={styles.summaryHead}>
            <Text style={styles.summaryLabel}>{t('planMacros.overPeriod')}</Text>
            <Text style={styles.summaryMeta}>
              {`${toArabicDigits(pricing.activeDays, lang)} ${t('unit.days')} · ${toArabicDigits(mealCount, lang)} ${t('unit.meals')}`}
            </Text>
          </View>

          <View style={styles.kcalRow}>
            <Text style={styles.kcal}>{toArabicDigits(planMacros.calories, lang)}</Text>
            <Text style={styles.kcalUnit}>{t('detail.calories')}</Text>
          </View>

          <MacroRow macros={planMacros} />
        </LinearGradient>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t('planMacros.adjust')}</Text>
          <Card padding={spacing.xxl} style={styles.steppers}>
            {macroKeys.map((key, i) => (
              <React.Fragment key={key}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <Stepper
                  icon={MACRO_ICON[key]}
                  iconColor={MACRO_COLOR[key]}
                  label={t(MACRO_LABEL[key])}
                  value={planMacros[key]}
                  suffix={t('unit.g')}
                  onDecrement={() => setPlanTarget(key, planMacros[key] - stepFor(key))}
                  onIncrement={() => setPlanTarget(key, planMacros[key] + stepFor(key))}
                  canDecrement={planMacros[key] > 0}
                />
              </React.Fragment>
            ))}
          </Card>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t('planMacros.perDay')}</Text>
          <Card padding={spacing.xl}>
            <MacroRow macros={dailyMacros} />
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t('subscribe.total')}</Text>
          <Text style={styles.price}>{formatPrice(groupNumber(pricing.total), lang)}</Text>
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
  summary: {
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxxl,
    gap: spacing.lg,
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryLabel: {
    ...type.caption,
    color: overlay.white75,
  },
  summaryMeta: {
    ...type.captionStrong,
    color: overlay.white90,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  kcal: {
    ...type.money,
    color: colors.white,
  },
  kcalUnit: {
    ...type.body,
    color: overlay.white80,
  },
  group: {
    gap: spacing.md,
  },
  groupLabel: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  steppers: {
    gap: spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: colors.sand,
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
