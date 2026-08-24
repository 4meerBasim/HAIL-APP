import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import CartBar from '../components/CartBar';
import RotatingHint from '../components/RotatingHint';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Chip from '../components/Chip';
import Badge from '../components/Badge';
import DishCard from '../components/DishCard';
import { colors, fonts, radius, spacing, type } from '../theme';
import { useScrollToTop } from '@react-navigation/native';
import { useLanguage } from '../i18n/LanguageContext';
import { type Dish, dishesOfCourse, searchHints } from '../data/menu';
import { useCart } from '../state/CartContext';
import { useNotifications } from '../state/NotificationsContext';
import type { MenuCategory, RootStackScreenProps } from '../navigation/RootNavigator';

type CatKey = MenuCategory;

// Sweets and drinks are ordered against a meal, from the meal's own page, so
// this list is meals and nothing else.
const MAINS = dishesOfCourse('main');

const GRID_GAP = spacing.xl;
const H_PAD = spacing.huge;

// Every meal the kitchen sells on its own, without a subscription. It used to
// be the Menu tab; the tab is where a meal is built from parts now, and this is
// where the ready ones are — one step off the subscriptions page.
export default function SingleMealsScreen({
  navigation,
  route,
}: RootStackScreenProps<'SingleMeals'>) {
  const { t, lang, isRTL } = useLanguage();
  const { items, addItem } = useCart();
  const list = useRef<FlatList<Dish>>(null);
  useScrollToTop(list);
  const { unreadCount } = useNotifications();
  const cartCount = items.reduce((sum, it) => sum + it.qty, 0);
  const { width } = useWindowDimensions();
  const [cat, setCat] = useState<CatKey>(route.params?.cat ?? 'all');
  const [query, setQuery] = useState('');

  const routeCat = route.params?.cat;
  useEffect(() => {
    if (routeCat) {
      setCat(routeCat);
    }
  }, [routeCat]);

  // Arriving from the Plans search box: put the caret in the field so the tap
  // that got the customer here is the only tap they need. The param is cleared
  // once used, otherwise the tab would refocus every time it is revisited —
  // and leaving it set would stop a later request from firing the effect again.
  const focusSearch = route.params?.focusSearch;
  const searchRef = useRef<TextInput>(null);
  useEffect(() => {
    if (!focusSearch) return;
    // A frame or two for the tab transition, else the keyboard is swallowed.
    const id = setTimeout(() => {
      searchRef.current?.focus();
      navigation.setParams({ focusSearch: undefined });
    }, 150);
    return () => clearTimeout(id);
  }, [focusSearch, navigation]);

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

  const hints = useMemo(
    () =>
      searchHints().map(
        (d) => `${t('home.searchPrefix')} ${lang === 'ar' ? d.name : t(`dish.${d.id}.name`, d.name)}`,
      ),
    [t, lang],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MAINS.filter((d) => {
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
      // The list travels with the meal: opening one from here means the rest
      // are a swipe away, rather than a trip back to the grid each time.
      onPress={() =>
        navigation.navigate('DishDetail', {
          id: item.id,
          siblings: filtered.map((d) => d.id),
        })
      }
      onAdd={() => addItem(item.id, 1)}
    />
  );

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={styles.backBtn}
        >
          <Icon
            path={isRTL ? icons.chevronRight : icons.chevronLeft}
            size={15}
            color={colors.ink}
            strokeWidth={2.4}
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t('plans.single')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Inbox')}
            accessibilityRole="button"
            accessibilityLabel={t('profile.notifications')}
            style={styles.cartBtn}
          >
            <Icon path={icons.bell} size={18} color={colors.ink} strokeWidth={1.8} />
            <Badge count={unreadCount} ringColor={colors.cream} />
          </TouchableOpacity>

          {/* Only once there is something in it — an empty basket at the top of
              the menu is a button that does nothing but disappoint. */}
          {cartCount > 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Cart')}
              accessibilityRole="button"
              accessibilityLabel={t('cart.title')}
              style={styles.cartBtn}
            >
              <Icon path={icons.bag} size={18} color={colors.ink} strokeWidth={1.8} />
              <Badge count={cartCount} ringColor={colors.cream} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Icon path={icons.search} size={15} color={colors.muted2} />
          <View style={styles.searchWrap}>
            <TextInput
              ref={searchRef}
              style={[
                styles.searchInput,
                { textAlign: 'auto', writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              accessibilityLabel={t('home.searchPrefix')}
            />

            {/* The native placeholder cannot animate, so the field carries none
                and the hint is drawn over it — dropped the moment anything is
                typed. */}
            {query.length === 0 ? (
              <RotatingHint phrases={hints} style={styles.searchHint} />
            ) : null}
          </View>
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
      </View>

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
  );

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} texture>
      <FlatList
        ref={list}
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(d) => d.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        style={styles.list}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('menu.noResults')}</Text>
          </View>
        }
      />

      {/* The tab bar carries this everywhere else; off the tabs it has to carry
          itself, or adding a meal here leads nowhere visible. */}
      <CartBar />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Rides the grid as its list header rather than sitting over it, so there is
  // nothing to scroll under and no bar to separate from the page — the girih
  // texture runs straight through behind the field and the chips.
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: H_PAD,
  },
  title: {
    ...type.h1,
    flex: 1,
    color: colors.ink,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  cartBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: H_PAD,
  },
  // The field is white on a warm page now, so it needs a line of its own to
  // read as a field rather than a hole.
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: radius.control,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.huge,
  },
  searchWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  searchHint: {
    ...type.body,
    position: 'absolute',
    start: 0,
    end: 0,
    color: colors.muted2,
  },
  searchInput: {
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
    paddingHorizontal: H_PAD,
    alignItems: 'center',
  },
  emptyText: {
    ...type.body,
    color: colors.muted2,
  },
  // The row scrolls edge to edge and carries the gutter as content padding, so a
  // chip runs off the screen rather than being clipped short of it.
  chipsRow: {
    gap: spacing.md,
    alignItems: 'center',
    paddingHorizontal: H_PAD,
  },
  list: {
    flex: 1,
  },
  // The gutter lives on the rows, not the container: the header sits in here
  // too and its chip row has to run off the screen edge, which it cannot do
  // through a container padding.
  grid: {
    paddingBottom: spacing.giant,
    gap: GRID_GAP,
  },
  column: {
    paddingHorizontal: H_PAD,
    gap: GRID_GAP,
  },
});
