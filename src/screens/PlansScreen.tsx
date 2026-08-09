import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import BoxCard from '../components/BoxCard';
import MacroRow from '../components/MacroRow';
import SectionHeader from '../components/SectionHeader';
import { colors, fonts, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../state/AuthContext';
import { usePlan } from '../state/PlanContext';
import { type BoxGoal, dietBoxes, formatPrice, groupNumber } from '../data/menu';
import type { GoalKey } from '../data/nutrition';
import type { TabScreenProps } from '../navigation/RootNavigator';

const PLAN_GRADIENT = [colors.tealDark, colors.teal] as const;

// Which curated box best matches the profile's goal.
const GOAL_BOX: Record<GoalKey, BoxGoal> = {
  lose: 'lean',
  maintain: 'balanced',
  gain: 'protein',
};

export default function PlansScreen({ navigation }: TabScreenProps<'Plans'>) {
  const { t, lang, isRTL } = useLanguage();
  const { profile, targets, status } = useAuth();
  const { subscription, subscriptionPricing, startFromBox, startCustom } = usePlan();

  const chevron = isRTL ? icons.chevronLeft : icons.chevronRight;
  const recommendedId = profile ? GOAL_BOX[profile.goal] : null;
  const rest = dietBoxes.filter((b) => b.id !== recommendedId);
  const recommended = dietBoxes.find((b) => b.id === recommendedId);

  const openBox = (id: BoxGoal) => {
    startFromBox(id);
    navigation.navigate('BoxDetail', { id });
  };

  const openCustom = () => {
    startCustom();
    navigation.navigate('PlanBuilder');
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.headingBlock}>
        <Text style={styles.heading}>{t('nav.plans')}</Text>
        <Text style={styles.subheading}>{t('boxes.subtitle')}</Text>
      </View>

      <View style={styles.section}>
        {targets ? (
          <Card background={colors.healthyBg} style={styles.targets}>
            <View style={styles.targetsHead}>
              <Text style={styles.targetsLabel}>{t('plans.yourTarget')}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Onboarding')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={t('common.edit')}
              >
                <Text style={styles.editLink}>{t('common.edit')}</Text>
              </TouchableOpacity>
            </View>
            <MacroRow macros={targets} />
          </Card>
        ) : (
          <Card
            onPress={() => navigation.navigate(status === 'authed' ? 'Onboarding' : 'Login')}
            style={styles.linkRow}
          >
            <View style={[styles.tile, { backgroundColor: colors.healthyBg }]}>
              <Icon path={icons.ruler} size={19} color={colors.teal} strokeWidth={1.9} />
            </View>
            <View style={styles.linkText}>
              <Text style={styles.linkLabel}>{t('plans.setupProfile')}</Text>
            </View>
            <Icon path={chevron} size={15} color={colors.faint2} strokeWidth={2.2} />
          </Card>
        )}

        {subscription && subscriptionPricing ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Orders')}
            accessibilityRole="button"
            accessibilityLabel={t('plans.active')}
            style={shadow.raised}
          >
            <LinearGradient
              colors={PLAN_GRADIENT}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.active}
            >
              <View style={styles.activeTile}>
                <Icon path={icons.box} size={20} color={colors.white} strokeWidth={1.9} />
              </View>
              <View style={styles.activeText}>
                <Text style={styles.activeLabel}>{t('plans.active')}</Text>
                <Text style={styles.activeValue}>
                  {formatPrice(groupNumber(subscriptionPricing.total), lang)}
                </Text>
              </View>
              <Icon path={chevron} size={15} color={overlay.white70} strokeWidth={2.2} />
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </View>

      {recommended ? (
        <View style={styles.section}>
          <SectionHeader title={t('plans.forYou')} subtitle={t(`box.${recommended.id}.for`)} />
          <BoxCard box={recommended} variant="feature" onPress={() => openBox(recommended.id)} />
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title={t('plans.boxes')} />
        <View style={styles.grid}>
          {rest.map((box) => (
            <BoxCard
              key={box.id}
              box={box}
              onPress={() => openBox(box.id)}
              style={styles.gridItem}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('plans.orBuild')} />

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={openCustom}
          accessibilityRole="button"
          accessibilityLabel={t('plans.custom')}
          style={[styles.custom, shadow.card]}
        >
          <View style={[styles.tile, { backgroundColor: colors.healthyBg }]}>
            <Icon path={icons.puzzle} size={19} color={colors.teal} strokeWidth={1.8} />
          </View>
          <View style={styles.linkText}>
            <Text style={styles.linkLabel}>{t('plans.custom')}</Text>
            <Text style={styles.linkSub}>{t('boxes.custom.sub')}</Text>
          </View>
          <Icon path={chevron} size={15} color={colors.faint2} strokeWidth={2.2} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Menu', { cat: 'all' })}
          accessibilityRole="button"
          accessibilityLabel={t('plans.single')}
          style={styles.single}
        >
          <View style={[styles.tile, { backgroundColor: colors.white }]}>
            <Icon path={icons.utensils} size={19} color={colors.muted} strokeWidth={1.8} />
          </View>
          <View style={styles.linkText}>
            <Text style={styles.linkLabel}>{t('plans.single')}</Text>
            <Text style={styles.linkSub}>{t('home.single.sub')}</Text>
          </View>
          <Icon path={chevron} size={15} color={colors.faint2} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.md,
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
  section: {
    gap: spacing.xl,
  },
  targets: {
    gap: spacing.xl,
  },
  targetsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetsLabel: {
    ...type.captionStrong,
    color: colors.tealText,
  },
  editLink: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.teal,
  },
  tile: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  linkText: {
    flex: 1,
    gap: 1,
  },
  linkLabel: {
    ...type.title,
    color: colors.ink,
  },
  linkSub: {
    ...type.caption,
    color: colors.muted2,
  },
  active: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  activeTile: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: overlay.white14,
    borderWidth: 1,
    borderColor: overlay.white22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeText: {
    flex: 1,
    gap: 1,
  },
  activeLabel: {
    ...type.caption,
    color: overlay.white75,
  },
  activeValue: {
    ...type.h3,
    color: colors.white,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  gridItem: {
    width: '47.5%',
    flex: 0,
  },
  custom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.teal,
    borderStyle: 'dashed',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  single: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: colors.sandChip,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
});
