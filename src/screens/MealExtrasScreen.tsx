import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import BuildRow from '../components/BuildRow';
import PressScale from '../components/PressScale';
import SectionHeader from '../components/SectionHeader';
import Button from '../components/Button';
import DishCard from '../components/DishCard';
import { colors, fonts, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { dishesOfCourse, formatPrice, getDish, groupNumber, parsePrice } from '../data/menu';
import { extraGroups, priceOf } from '../data/extras';
import { formatNumber } from '../i18n/digits';
import { useMealBuild } from '../state/MealBuildContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

// Android needs telling before it will animate a layout change at all; iOS has
// always done it. Called once at module load rather than per render.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Opening and closing a panel is a height change, and a height change is what
// LayoutAnimation is for — the rows below slide down with it rather than
// jumping, and it costs no library.
const PANEL = LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity);

// Everything that can be added to a meal, on a page of its own. Sweets and
// drinks are menu items with photographs and prices, so they are shown the way
// every other menu item in the app is shown; the extras are parts of a plate
// rather than plates, so they are a list of switches. One screen either way:
// the errand is the same, and so are the header, the spacing and the way back.
export default function MealExtrasScreen({ navigation }: RootStackScreenProps<'MealExtras'>) {
  const { t, lang } = useLanguage();
  const { build, chooseExtra, countItem } = useMealBuild();

  // Everything the customer has put on the meal so far, named and priced. The
  // page is a long list of choices; this is the answer to "so what am I
  // actually adding?", which the choices themselves never say together.
  const lines = [
    ...build.extras.map((id) => ({ id, label: t(`opt.${id}`), price: priceOf(id) })),
    ...Object.entries(build.items).map(([id, n]) => {
      const item = getDish(id);
      return {
        id,
        label: n > 1 ? `${item?.name ?? id} ×${formatNumber(n)}` : (item?.name ?? id),
        price: parsePrice(item?.price ?? '0') * n,
      };
    }),
  ];
  const addedTotal = lines.reduce((sum, line) => sum + line.price, 0);
  // Only one row stands open at a time: the page is a list of decisions, and
  // all of them open at once is the wall this was meant to replace.
  const [open, setOpen] = useState<string | null>(null);

  const toggleOpen = (id: string) => {
    LayoutAnimation.configureNext(PANEL);
    setOpen((current) => (current === id ? null : id));
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
          <Text style={styles.title}>{t('opt.extras')}</Text>
          <Text style={styles.subtitle}>{t('opt.extras.hint')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <SectionHeader title={t('opt.extras.page')} subtitle={t('opt.extras.sub')} />
          <View style={styles.list}>
            {extraGroups.map((group) => {
              const chosen = group.options.filter((o) => build.extras.includes(o.id));
              const expanded = open === group.id;
              const groupPrice = chosen.reduce((sum, o) => sum + o.price, 0);
              return (
                <View
                  key={group.id}
                  style={[styles.group, chosen.length > 0 && styles.groupOn]}
                >
                  <BuildRow
                    flat
                    icon={group.icon}
                    label={t(`opt.${group.id}`)}
                    sub={
                      chosen.length > 0
                        ? chosen.map((o) => t(`opt.${o.id}`)).join(' · ')
                        : t('opt.kinds')
                    }
                    price={groupPrice > 0 ? `+ ${formatPrice(groupNumber(groupPrice), lang)}` : undefined}
                    selected={chosen.length > 0}
                    action="dropdown"
                    expanded={expanded}
                    onPress={() => toggleOpen(group.id)}
                  />

                  {/* The kinds sit under the row that opened them rather than
                      on a page of their own: choosing white bread over brown is
                      not an errand worth a screen. */}
                  {expanded ? (
                    <View style={styles.kinds}>
                      {group.options.map((option) => {
                        const on = build.extras.includes(option.id);
                        return (
                          <PressScale
                            key={option.id}
                            onPress={() => chooseExtra(option.id)}
                            scaleTo={0.99}
                            accessibilityLabel={t(`opt.${option.id}`)}
                            accessibilityState={{ selected: on }}
                            style={styles.kind}
                          >
                            {/* A square, because more than one kind can be on
                                the meal at once. */}
                            <View style={[styles.kindMark, on && styles.kindMarkOn]}>
                              {on ? (
                                <Icon
                                  path={icons.check}
                                  size={10}
                                  color={colors.white}
                                  strokeWidth={3}
                                />
                              ) : null}
                            </View>
                            <Text style={styles.kindName} numberOfLines={1}>
                              {t(`opt.${option.id}`)}
                            </Text>
                            <Text style={[styles.kindPrice, on && styles.kindPriceOn]}>
                              {`+ ${formatPrice(groupNumber(option.price), lang)}`}
                            </Text>
                          </PressScale>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* Sweets and drinks are menu items with photographs and prices of
            their own, so they are shown the way every other menu item in the
            app is — a grid of cards, on the same page as the rest. */}
        {(['dessert', 'drink'] as const).map((course) => {
          return (
            <View key={course} style={styles.section}>
              <SectionHeader title={t(`opt.${course}.page`)} subtitle={t(`opt.${course}.sub`)} />
              <View style={styles.grid}>
                {dishesOfCourse(course).map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    showAdd
                    qty={build.items[dish.id] ?? 0}
                    onAdd={() => countItem(dish.id, 1)}
                    onRemove={() => countItem(dish.id, -1)}
                    style={[
                      styles.gridItem,
                      (build.items[dish.id] ?? 0) > 0 && styles.gridItemOn,
                    ]}
                  />
                ))}
              </View>
            </View>
          );
        })}
        {lines.length > 0 ? (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>{t('opt.added')}</Text>
            {lines.map((line) => (
              <View key={line.id} style={styles.summaryLine}>
                <Text style={styles.summaryLabel} numberOfLines={1}>
                  {line.label}
                </Text>
                <Text style={styles.summaryValue}>
                  {`+ ${formatPrice(groupNumber(line.price), lang)}`}
                </Text>
              </View>
            ))}
            <View style={styles.summaryRule} />
            <View style={styles.summaryLine}>
              <Text style={styles.summaryGrand}>{t('opt.addedTotal')}</Text>
              <Text style={styles.summaryGrandValue}>
                {formatPrice(groupNumber(addedTotal), lang)}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Pinned: the page is long enough that the way out of it should not have
          to be scrolled to. */}
      <View style={styles.doneBar}>
        <View style={styles.doneSummary}>
          <Text style={styles.doneCount} numberOfLines={1}>
            {lines.length > 0
              ? lines.map((line) => line.label).join(' · ')
              : t('opt.addedNone')}
          </Text>
          {addedTotal > 0 ? (
            <Text style={styles.doneTotal}>
              {`+ ${formatPrice(groupNumber(addedTotal), lang)}`}
            </Text>
          ) : null}
        </View>

        <Button
          label={t('common.done')}
          variant="primary"
          size="lg"
          full
          onPress={() => navigation.goBack()}
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
  list: {
    gap: spacing.lg,
  },
  // The head and its kinds are one card: the panel is part of the thing that
  // opened it, not a list that happens to sit underneath.
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.sand,
    overflow: 'hidden',
  },
  groupOn: {
    borderColor: colors.teal,
  },
  kinds: {
    borderTopWidth: 1,
    borderTopColor: colors.sandChip,
    backgroundColor: colors.cream,
  },
  kind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  kindMark: {
    width: 18,
    height: 18,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindMarkOn: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  kindName: {
    ...type.caption,
    flex: 1,
    fontSize: 13.5,
    color: colors.ink,
  },
  kindPrice: {
    ...type.caption,
    fontSize: 12.5,
    color: colors.muted2,
  },
  kindPriceOn: {
    color: colors.tealText,
  },
  summary: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.sand,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  summaryTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  summaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  summaryLabel: {
    ...type.caption,
    flexShrink: 1,
    color: colors.muted,
  },
  summaryValue: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.body,
  },
  summaryRule: {
    height: 1,
    backgroundColor: colors.sandChip,
  },
  summaryGrand: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  summaryGrandValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.tealText,
  },
  doneBar: {
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.sandChip,
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  doneSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  doneCount: {
    ...type.caption,
    flexShrink: 1,
    color: colors.muted,
  },
  doneTotal: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.tealText,
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
  // The one already on the meal wears the same teal edge the build rows use.
  gridItemOn: {
    borderWidth: 1.5,
    borderColor: colors.teal,
  },
});
