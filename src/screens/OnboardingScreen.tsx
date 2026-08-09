import React, { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { type IconPath, icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import Stepper from '../components/Stepper';
import MacroRow from '../components/MacroRow';
import { colors, fonts, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { toArabicDigits } from '../i18n/digits';
import { useAuth } from '../state/AuthContext';
import {
  type ActivityKey,
  type BodyProfile,
  type Gender,
  type GoalKey,
  DEFAULT_PROFILE,
  PROFILE_LIMITS,
  activityKeys,
  dailyTargets,
  genderKeys,
  goalKeys,
} from '../data/nutrition';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const PLAN_GRADIENT = [colors.tealDark, colors.teal] as const;

const GENDER_ICON: Record<Gender, IconPath> = { male: icons.male, female: icons.female };
const ACTIVITY_ICON: Record<ActivityKey, IconPath> = {
  sedentary: icons.armchair,
  light: icons.footprints,
  moderate: icons.bike,
  active: icons.zap,
};
const GOAL_ICON: Record<GoalKey, IconPath> = {
  lose: icons.trendDown,
  maintain: icons.scale,
  gain: icons.trendUp,
};

interface PickProps {
  icon: IconPath;
  label: string;
  selected: boolean;
  onPress: () => void;
}

function Pick({ icon, label, selected, onPress }: PickProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.pick, selected ? styles.pickOn : styles.pickOff]}
    >
      <Icon
        path={icon}
        size={24}
        color={selected ? colors.teal : colors.muted}
        strokeWidth={selected ? 2 : 1.8}
      />
      <Text style={[styles.pickLabel, selected && styles.pickLabelOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen({ navigation }: RootStackScreenProps<'Onboarding'>) {
  const { t, lang } = useLanguage();
  const { profile, saveProfile } = useAuth();
  const [draft, setDraft] = useState<BodyProfile>(profile ?? DEFAULT_PROFILE);

  const targets = useMemo(() => dailyTargets(draft), [draft]);
  const set = <K extends keyof BodyProfile>(key: K, value: BodyProfile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const bump = (key: 'age' | 'heightCm' | 'weightKg', by: number) => {
    const { min, max } = PROFILE_LIMITS[key];
    set(key, Math.min(max, Math.max(min, draft[key] + by)));
  };

  const onSave = () => {
    saveProfile(draft);
    navigation.replace('Tabs');
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.headingBlock}>
        <Text style={styles.heading}>{t('onboarding.title')}</Text>
        <Text style={styles.subheading}>{t('onboarding.subtitle')}</Text>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>{t('onboarding.gender')}</Text>
        <View style={styles.row}>
          {genderKeys.map((g) => (
            <Pick
              key={g}
              icon={GENDER_ICON[g]}
              label={t(`gender.${g}`)}
              selected={draft.gender === g}
              onPress={() => set('gender', g)}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>{t('onboarding.body')}</Text>
        <Card padding={spacing.xxl} style={styles.metrics}>
          <Stepper
            icon={icons.cake}
            label={t('onboarding.age')}
            value={draft.age}
            suffix={t('unit.years')}
            onDecrement={() => bump('age', -1)}
            onIncrement={() => bump('age', 1)}
            canDecrement={draft.age > PROFILE_LIMITS.age.min}
            canIncrement={draft.age < PROFILE_LIMITS.age.max}
          />
          <View style={styles.divider} />
          <Stepper
            icon={icons.ruler}
            label={t('onboarding.height')}
            value={draft.heightCm}
            suffix={t('unit.cm')}
            onDecrement={() => bump('heightCm', -1)}
            onIncrement={() => bump('heightCm', 1)}
            canDecrement={draft.heightCm > PROFILE_LIMITS.heightCm.min}
            canIncrement={draft.heightCm < PROFILE_LIMITS.heightCm.max}
          />
          <View style={styles.divider} />
          <Stepper
            icon={icons.scale}
            label={t('onboarding.weight')}
            value={draft.weightKg}
            suffix={t('unit.kg')}
            onDecrement={() => bump('weightKg', -1)}
            onIncrement={() => bump('weightKg', 1)}
            canDecrement={draft.weightKg > PROFILE_LIMITS.weightKg.min}
            canIncrement={draft.weightKg < PROFILE_LIMITS.weightKg.max}
          />
        </Card>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>{t('onboarding.activity')}</Text>
        <View style={styles.row}>
          {activityKeys.map((a) => (
            <Pick
              key={a}
              icon={ACTIVITY_ICON[a]}
              label={t(`activity.${a}`)}
              selected={draft.activity === a}
              onPress={() => set('activity', a)}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>{t('onboarding.goal')}</Text>
        <View style={styles.row}>
          {goalKeys.map((g) => (
            <Pick
              key={g}
              icon={GOAL_ICON[g]}
              label={t(`goal.${g}`)}
              selected={draft.goal === g}
              onPress={() => set('goal', g)}
            />
          ))}
        </View>
      </View>

      <LinearGradient
        colors={PLAN_GRADIENT}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.result, shadow.raised]}
      >
        <Text style={styles.resultLabel}>{t('onboarding.daily')}</Text>
        <View style={styles.resultTotal}>
          <Text style={styles.resultValue}>{toArabicDigits(targets.calories, lang)}</Text>
          <Text style={styles.resultUnit}>{t('plan.kcalDay')}</Text>
        </View>
        <MacroRow macros={targets} />
      </LinearGradient>

      <Button
        label={t('common.continue')}
        variant="primary"
        size="lg"
        full
        onPress={onSave}
        style={shadow.teal}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.xl,
    paddingBottom: spacing.giant,
    gap: spacing.giant,
  },
  headingBlock: {
    gap: spacing.xs,
  },
  heading: {
    ...type.h1,
    color: colors.ink,
  },
  subheading: {
    ...type.body,
    color: colors.muted,
  },
  group: {
    gap: spacing.md,
  },
  groupLabel: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pick: {
    flex: 1,
    minHeight: 74,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pickOn: {
    borderColor: colors.teal,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  pickOff: {
    borderColor: colors.sand,
    backgroundColor: colors.white,
  },
  pickLabel: {
    ...type.micro,
    color: colors.muted,
    textAlign: 'center',
  },
  pickLabelOn: {
    fontFamily: fonts.bold,
    color: colors.tealText,
  },
  metrics: {
    gap: spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: colors.sand,
  },
  result: {
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxxl,
    gap: spacing.lg,
  },
  resultLabel: {
    ...type.captionStrong,
    color: overlay.white75,
  },
  resultTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  resultValue: {
    ...type.money,
    color: colors.white,
  },
  resultUnit: {
    ...type.body,
    color: overlay.white80,
  },
});
