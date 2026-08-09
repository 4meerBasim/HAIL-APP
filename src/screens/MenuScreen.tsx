import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Chip from '../components/Chip';
import DishCard from '../components/DishCard';
import { colors, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { dishes, Dish } from '../data/menu';
import { useCart } from '../state/CartContext';
import type { MenuCategory, TabScreenProps } from '../navigation/RootNavigator';

type CatKey = MenuCategory;

const GRID_GAP = spacing.xl;
const H_PAD = spacing.huge;

export default function MenuScreen({ navigation, route }: TabScreenProps<'Menu'>) {
  const { t, isRTL } = useLanguage();
  const { addItem } = useCart();
  const { width } = useWindowDimensions();
  const [cat, setCat] = useState<CatKey>(route.params?.cat ?? 'all');
  const [query, setQuery] = useState('');

  const routeCat = route.params?.cat;
  useEffect(() => {
    if (routeCat) {
      setCat(routeCat);
    }
  }, [routeCat]);

  const itemWidth = (width - H_PAD * 2 - GRID_GAP) / 2;

  const cats = useMemo<{ k: CatKey; label: string }[]>(
    () => [
      { k: 'all', label: t('filter.all') },
      { k: 'h', label: t('filter.healthy') },
      { k: 'r', label: t('filter.regular') },
      { k: 'pop', label: t('filter.mostOrdered') },
    ],
    [t],
  );

  const filterPills = [
    t('menu.filter.diet'),
    t('menu.filter.category'),
    t('menu.filter.price'),
    t('menu.filter.calories'),
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter((d) => {
      const inCat = cat === 'all' || (cat === 'pop' ? d.pop : d.cat === cat);
      if (!inCat) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [
        d.name,
        d.sub,
        t(`dish.${d.id}.name`, d.name),
        t(`dish.${d.id}.sub`, d.sub),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [cat, query, t]);

  const renderItem = ({ item }: ListRenderItemInfo<Dish>) => (
    <DishCard
      dish={item}
      showAdd
      style={{ width: itemWidth }}
      onPress={() => navigation.navigate('DishDetail', { id: item.id })}
      onAdd={() => {
        addItem(item.id, 1);
        navigation.navigate('Cart');
      }}
    />
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('menu.title')}</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Icon path={icons.search} size={15} color={colors.muted2} />
            <TextInput
              style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
              value={query}
              onChangeText={setQuery}
              placeholder={t('menu.searchPlaceholder')}
              placeholderTextColor={colors.muted2}
              returnKeyType="search"
              accessibilityLabel={t('menu.searchPlaceholder')}
            />
            {query.length > 0 ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setQuery('')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('menu.searchClear')}
              >
                <Text style={styles.clearText}>{t('menu.searchClear')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity activeOpacity={0.85} style={styles.filterBtn}>
            <Icon path={icons.filter} size={17} color={colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {filterPills.map((label) => (
            <TouchableOpacity key={label} activeOpacity={0.7} style={styles.pill}>
              <Text style={styles.pillText}>{label}</Text>
              <Icon path={icons.chevronDown} size={12} color={colors.muted2} strokeWidth={2.2} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {cats.map((c) => (
            <Chip
              key={c.k}
              label={c.label}
              selected={cat === c.k}
              onPress={() => setCat(c.k)}
              shape="pill"
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(d) => d.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('menu.noResults')}</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: H_PAD,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  title: {
    ...type.h1,
    color: colors.ink,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: 13,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    ...type.body,
    color: colors.ink,
  },
  clearText: {
    ...type.captionStrong,
    color: colors.teal,
  },
  empty: {
    paddingTop: spacing.giant,
    alignItems: 'center',
  },
  emptyText: {
    ...type.body,
    color: colors.muted2,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsRow: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: 11,
  },
  pillText: {
    ...type.captionStrong,
    color: colors.body,
  },
  chipsRow: {
    gap: spacing.md,
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: H_PAD,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.giant,
    gap: GRID_GAP,
  },
  column: {
    gap: GRID_GAP,
  },
});
