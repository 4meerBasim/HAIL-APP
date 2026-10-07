import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Chip from '../components/Chip';
import MealRow from '../components/MealRow';
import Reveal from '../components/Reveal';
import { colors, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { usePlan } from '../state/PlanContext';
import { type Course, courseKeys, getDish } from '../data/menu';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

type Filter = Course | 'all';

export default function PlanMenuScreen({ navigation }: RootStackScreenProps<'PlanMenu'>) {
  const { t } = useLanguage();
  const { meals } = usePlan();
  const [filter, setFilter] = useState<Filter>('all');

  // Only offer a section the plan actually has something in, so no chip ever
  // leads to an empty list.
  const present = useMemo(() => {
    const seen = new Set<Course>();
    for (const meal of meals) {
      const dish = getDish(meal.dishId);
      if (dish) seen.add(dish.course);
    }
    return courseKeys.filter((c) => seen.has(c));
  }, [meals]);

  const counts = useMemo(() => {
    const out: Partial<Record<Course, number>> = {};
    for (const meal of meals) {
      const dish = getDish(meal.dishId);
      if (dish) out[dish.course] = (out[dish.course] ?? 0) + 1;
    }
    return out;
  }, [meals]);

  const shown = useMemo(
    () =>
      filter === 'all'
        ? meals
        : meals.filter((meal) => getDish(meal.dishId)?.course === filter),
    [filter, meals],
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
          <Text style={styles.title}>{t('planMenu.title')}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {t('planMenu.subtitle')}
          </Text>
        </View>
      </View>

      {meals.length > 0 ? (
        <>
          {present.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filters}
              contentContainerStyle={styles.filtersContent}
            >
              <Chip
                label={`${t('course.all')} · ${formatNumber(meals.length)}`}
                selected={filter === 'all'}
                onPress={() => setFilter('all')}
              />
              {present.map((course) => (
                <Chip
                  key={course}
                  label={`${t(`course.${course}`)} · ${formatNumber(counts[course] ?? 0)}`}
                  selected={filter === course}
                  onPress={() => setFilter(course)}
                />
              ))}
            </ScrollView>
          ) : null}

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {/* One row per meal of the rotation, and a dish that comes round on
                two days is two rows — so the index is part of the key. */}
            {shown.map((meal, i) => (
              <Reveal key={`${meal.dishId}-${i}`} index={i}>
                <MealRow
                  meal={meal}
                  onPress={() =>
                    navigation.navigate('DishDetail', { id: meal.dishId, fromPlan: true, building: true })
                  }
                />
              </Reveal>
            ))}
          </ScrollView>
        </>
      ) : (
        <View style={styles.empty}>
          <Icon path={icons.utensils} size={30} color={colors.faint} strokeWidth={1.6} />
          <Text style={styles.emptyText}>{t('planMenu.empty')}</Text>
        </View>
      )}
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
  filters: {
    flexGrow: 0,
  },
  filtersContent: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.giant,
    gap: spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.giant,
  },
  emptyText: {
    ...type.body,
    color: colors.muted2,
  },
});
