import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import UpcomingDays from '../components/UpcomingDays';
import { colors, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { count } from '../i18n/count';
import { planProgress, usePlan } from '../state/PlanContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

export default function UpcomingScreen({ navigation }: RootStackScreenProps<'Upcoming'>) {
  const { t } = useLanguage();
  const { subscription } = usePlan();

  const progress = useMemo(
    () => (subscription ? planProgress(subscription) : null),
    [subscription],
  );

  return (
    <Screen scroll={false} texture>
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
          <Text style={styles.title}>{t('orders.upcoming')}</Text>
          <Text style={styles.subtitle}>
            {progress ? count('count.days', progress.remainingDays, t) : t('orders.upcoming.sub')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* No limit here — this screen is the whole run, which is the reason it
            exists at all. */}
        <UpcomingDays onPressMeal={(id, siblings) => navigation.navigate('DishDetail', { id, siblings, fromPlan: true })} />
        <Text style={styles.hint}>{t('orders.upcoming.sub')}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.xl,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flexShrink: 1,
    gap: 2,
  },
  title: {
    ...type.h1,
    color: colors.ink,
  },
  subtitle: {
    ...type.caption,
    color: colors.muted2,
  },
  content: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.giant,
    gap: spacing.xxl,
  },
  hint: {
    ...type.caption,
    color: colors.muted2,
    textAlign: 'center',
  },
});
