import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { type IconPath, icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import Chip from '../components/Chip';
import Stepper from '../components/Stepper';
import MacroRow from '../components/MacroRow';
import { colors, fonts, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan, saverSaving } from '../state/PlanContext';
import { useAuth } from '../state/AuthContext';
import {
  type SaverKey,
  MAX_DAYS,
  MIN_DAYS,
  currencyMark,
  dayKeys,
  discountForDays,
  durationPresets,
  formatPrice,
  groupNumber,
  saverKeys,
} from '../data/menu';
import { toArabicDigits } from '../i18n/digits';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const PLAN_GRADIENT = [colors.tealDark, colors.teal] as const;

const SAVER_ICON: Record<SaverKey, { path: IconPath; color: string; tint: string }> = {
  trimProtein: { path: icons.meat, color: colors.tealText, tint: colors.healthyBg },
  fewerMeals: { path: icons.utensils, color: colors.amberIcon, tint: colors.regularBg },
  swapCheaper: { path: icons.refresh, color: colors.violet, tint: colors.violetBg },
  longerTerm: { path: icons.hourglass, color: colors.greenDark, tint: colors.greenBg },
};

export default function SubscribeScreen({ navigation }: RootStackScreenProps<'Subscribe'>) {
  const { t, lang } = useLanguage();
  const { status } = useAuth();
  const {
    plan,
    pricing,
    dailyMacros,
    setMealsPerDay,
    setDayCount,
    toggleWeekday,
    applySaver,
    confirm,
  } = usePlan();

  const savings = useMemo(
    () => saverKeys.map((key) => ({ key, amount: saverSaving(plan, key) })),
    [plan],
  );

  const mark = currencyMark(lang);
  const perMealNow = pricing.mealCount > 0 ? Math.round(pricing.total / pricing.mealCount) : 0;
  const planSummary = `${toArabicDigits(plan.mealsPerDay, lang)} ${t('plan.mealsUnit')} × ${toArabicDigits(plan.weekdays.length, lang)} ${t('plan.daysWeekly')}`;
  const comparison = t('plan.instead').replace(
    '{p}',
    formatPrice(groupNumber(pricing.perMealAvg), lang),
  );

  const onConfirm = () => {
    if (status !== 'authed') {
      navigation.navigate('Login');
      return;
    }
    confirm();
    navigation.reset({
      index: 1,
      routes: [{ name: 'Tabs', params: { screen: 'Orders' } }, { name: 'Tracking' }],
    });
  };

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
        <Text style={styles.title}>{t('subscribe.title')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t('subscribe.duration')}</Text>
          <View style={styles.presetRow}>
            {durationPresets.map((p) => (
              <Chip
                key={p.key}
                label={`${toArabicDigits(p.days, lang)} ${t('unit.days')}`}
                sublabel={`${t('plan.discount')} ${toArabicDigits(Math.round(discountForDays(p.days) * 100), lang)}${t('common.percent')}`}
                selected={plan.dayCount === p.days}
                onPress={() => setDayCount(p.days)}
                shape="rounded"
                full
              />
            ))}
          </View>
          <Card padding={spacing.xxl}>
            <Stepper
              icon={icons.calendar}
              label={t('unit.days')}
              value={plan.dayCount}
              suffix={t('unit.days')}
              onDecrement={() => setDayCount(plan.dayCount - 1)}
              onIncrement={() => setDayCount(plan.dayCount + 1)}
              canDecrement={plan.dayCount > MIN_DAYS}
              canIncrement={plan.dayCount < MAX_DAYS}
            />
          </Card>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t('plan.days')}</Text>
          <View style={styles.weekRow}>
            {dayKeys.map((key, i) => {
              const on = plan.weekdays.includes(i);
              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.85}
                  onPress={() => toggleWeekday(i)}
                  accessibilityRole="button"
                  accessibilityLabel={t(key)}
                  accessibilityState={{ selected: on }}
                  style={[styles.day, on ? styles.dayOn : styles.dayOff]}
                >
                  <Text style={[styles.dayText, on && styles.dayTextOn]}>{t(key)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t('plan.mealsQ')}</Text>
          <Card padding={spacing.xxl}>
            <Stepper
              icon={icons.utensils}
              label={t('unit.meals')}
              value={plan.mealsPerDay}
              suffix={t('unit.perDay')}
              onDecrement={() => setMealsPerDay(plan.mealsPerDay - 1)}
              onIncrement={() => setMealsPerDay(plan.mealsPerDay + 1)}
              canDecrement={plan.mealsPerDay > 1}
              canIncrement={plan.mealsPerDay < 4}
            />
          </Card>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t('planMacros.perDay')}</Text>
          <Card padding={spacing.xl}>
            <MacroRow macros={dailyMacros} />
          </Card>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t('subscribe.savers')}</Text>
          <View style={styles.saverGrid}>
            {savings.map(({ key, amount }) => {
              const off = amount <= 0;
              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.85}
                  disabled={off}
                  onPress={() => applySaver(key)}
                  accessibilityRole="button"
                  accessibilityLabel={t(`saver.${key}`)}
                  accessibilityState={{ disabled: off }}
                  style={[styles.saver, shadow.card, off && styles.saverOff]}
                >
                  <View style={[styles.saverTile, { backgroundColor: SAVER_ICON[key].tint }]}>
                    <Icon
                      path={SAVER_ICON[key].path}
                      size={19}
                      color={SAVER_ICON[key].color}
                      strokeWidth={1.9}
                    />
                  </View>
                  <View style={styles.saverText}>
                    <Text style={styles.saverLabel} numberOfLines={1}>
                      {t(`saver.${key}`)}
                    </Text>
                    <Text style={[styles.saverAmount, off && styles.saverAmountOff]}>
                      {off ? '—' : `−${groupNumber(amount)} ${mark} · ${t('unit.perDay')}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <LinearGradient
          colors={PLAN_GRADIENT}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[styles.summary, shadow.raised]}
        >
          <View style={styles.summaryHead}>
            <Text style={styles.summaryMeta} numberOfLines={1}>
              {planSummary}
            </Text>
            {pricing.saved > 0 ? (
              <View style={styles.savedPill}>
                <Text style={styles.savedText}>
                  {`${t('plan.save')} ${formatPrice(groupNumber(pricing.saved), lang)}`}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.total}>{groupNumber(pricing.total)}</Text>
            <Text style={styles.totalUnit}>
              {`${mark} / ${toArabicDigits(plan.dayCount, lang)} ${t('unit.days')}`}
            </Text>
          </View>

          {pricing.mealCount > 0 && pricing.discount > 0 ? (
            <Text style={styles.compare}>
              {`≈ ${formatPrice(groupNumber(perMealNow), lang)} ${t('plan.forMeal')} ${comparison}`}
            </Text>
          ) : null}

          <Button
            label={t('subscribe.confirm')}
            variant="light"
            size="lg"
            full
            disabled={pricing.mealCount === 0}
            onPress={onConfirm}
            style={styles.cta}
          />
        </LinearGradient>
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
  title: {
    ...type.h1,
    color: colors.ink,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.giant,
    gap: spacing.giant,
  },
  group: {
    gap: spacing.md,
  },
  groupLabel: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  day: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  dayOn: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
  dayOff: {
    borderColor: colors.sand,
    backgroundColor: colors.white,
  },
  dayText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
  dayTextOn: {
    fontFamily: fonts.bold,
    color: colors.white,
  },
  saverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  saver: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  saverOff: {
    opacity: 0.45,
  },
  saverTile: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saverText: {
    flex: 1,
    gap: 1,
  },
  saverLabel: {
    ...type.captionStrong,
    color: colors.ink,
  },
  saverAmount: {
    ...type.micro,
    fontFamily: fonts.bold,
    color: colors.tealText,
  },
  saverAmountOff: {
    color: colors.faint2,
  },
  footer: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
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
  summaryMeta: {
    ...type.caption,
    color: overlay.white75,
    flexShrink: 1,
  },
  savedPill: {
    backgroundColor: colors.amber,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  savedText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.amberText,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  total: {
    ...type.money,
    color: colors.white,
  },
  totalUnit: {
    ...type.body,
    color: overlay.white80,
  },
  compare: {
    ...type.caption,
    color: overlay.white75,
  },
  cta: {
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
});
