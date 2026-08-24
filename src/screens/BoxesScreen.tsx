import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import BoxCard from '../components/BoxCard';
import CustomPlanCard from '../components/CustomPlanCard';
import SectionHeader from '../components/SectionHeader';
import { colors, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { type BoxGoal, dietBoxes } from '../data/menu';
import { usePlan } from '../state/PlanContext';
import { useAuth } from '../state/AuthContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

// The full catalogue, one step off the Plans tab. It exists because a customer
// already on a plan should still be able to look at the others — the gate on
// having two runs at checkout, not at the shop window.
export default function BoxesScreen({ navigation }: RootStackScreenProps<'Boxes'>) {
  const { t } = useLanguage();
  const { subscription, startFromBox, startCustom } = usePlan();
  const { status } = useAuth();

  const feature = dietBoxes.find((b) => b.popular) ?? dietBoxes[0];
  const rest = dietBoxes.filter((b) => b.id !== feature.id);

  const openBox = (id: BoxGoal) => {
    startFromBox(id);
    navigation.navigate('BoxDetail', { id });
  };

  const openCustom = () => {
    // Building a plan is the first half of subscribing to one — it ends at a
    // checkout that needs a number to deliver to. Same gate as Subscribe, the
    // cart and catering, asked here rather than after the work is done.
    if (status !== 'authed') {
      navigation.navigate('Login');
      return;
    }
    startCustom();
    navigation.navigate('PlanBuilder');
  };

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
          <Text style={styles.title}>{t('plans.boxes')}</Text>
          <Text style={styles.subtitle}>
            {subscription ? t('plans.others.sub') : t('boxes.subtitle')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <SectionHeader title={t('plans.forYou')} subtitle={t(`box.${feature.id}.for`)} />
          <BoxCard box={feature} variant="feature" onPress={() => openBox(feature.id)} />
        </View>

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
          <CustomPlanCard onPress={openCustom} />
        </View>

        {/* Said once, here, rather than discovered at the checkout gate. */}
        {subscription ? <Text style={styles.note}>{t('plans.others.note')}</Text> : null}
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
    gap: spacing.giant,
  },
  section: {
    gap: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  // Two to a row. `flexGrow` let the four of them share one line and squeeze
  // instead of wrapping — the plans grid has always been flex: 0.
  gridItem: {
    width: '47.5%',
    flex: 0,
  },
  note: {
    ...type.caption,
    color: colors.muted2,
    textAlign: 'center',
  },
});
