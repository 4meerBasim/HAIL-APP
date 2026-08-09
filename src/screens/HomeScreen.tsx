import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Button from '../components/Button';
import Card from '../components/Card';
import Chip from '../components/Chip';
import DishCard from '../components/DishCard';
import SectionHeader from '../components/SectionHeader';
import { colors, overlay, radius, scrim, spacing, type } from '../theme';
import { type Lang, useLanguage } from '../i18n/LanguageContext';
import { toArabicDigits } from '../i18n/digits';
import { type Dish, dishes, featuredIds, formatPrice, heroImage } from '../data/menu';
import { useCart } from '../state/CartContext';
import type { MenuCategory, TabScreenProps } from '../navigation/RootNavigator';

const HEADER_GRADIENT = [colors.tealDark, colors.tealMid] as const;
const LANGS: Lang[] = ['ar', 'en'];
const FEATURED_COUNT = 3;
const POPULAR_COUNT = 3;

const inCategory = (dish: Dish, cat: MenuCategory): boolean =>
  cat === 'all' || (cat === 'pop' ? dish.pop : dish.cat === cat);

export default function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const { t, lang, isRTL, setLang } = useLanguage();
  const { items } = useCart();
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState<MenuCategory>('all');

  const cartCount = items.reduce((sum, it) => sum + it.qty, 0);
  const arrow = isRTL ? icons.arrowLeft : icons.arrowRight;

  const cats = useMemo<{ k: MenuCategory; label: string }[]>(
    () => [
      { k: 'all', label: t('filter.all') },
      { k: 'h', label: t('filter.healthy') },
      { k: 'r', label: t('filter.regular') },
      { k: 'pop', label: t('filter.mostOrdered') },
    ],
    [t],
  );

  // With no filter on, the kitchen's own pick leads; a filter falls back to the
  // first matching dishes so the row is never empty.
  const featured = useMemo(() => {
    if (cat === 'all') {
      return featuredIds.flatMap((id) => dishes.filter((d) => d.id === id));
    }
    return dishes.filter((d) => inCategory(d, cat)).slice(0, FEATURED_COUNT);
  }, [cat]);

  const popular = useMemo(() => {
    const featuredSet = new Set(featured.map((d) => d.id));
    return dishes
      .filter((d) => d.pop && inCategory(d, cat) && !featuredSet.has(d.id))
      .slice(0, POPULAR_COUNT);
  }, [cat, featured]);

  const openMenu = () => navigation.navigate('Menu', { cat });

  return (
    <Screen edges={['left', 'right']}>
      <LinearGradient
        colors={HEADER_GRADIENT}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.xl }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.identity}>
            <Text style={styles.greeting} numberOfLines={1}>
              {t('home.greeting')}
            </Text>
            <View style={styles.locationRow}>
              <Icon path={icons.pin} size={13} color={colors.gold} strokeWidth={2} />
              <Text style={styles.location} numberOfLines={1}>
                {t('home.location')}
              </Text>
            </View>
          </View>

          <View style={styles.langPill}>
            {LANGS.map((l) => {
              const on = lang === l;
              return (
                <TouchableOpacity
                  key={l}
                  activeOpacity={0.8}
                  onPress={() => void setLang(l)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={t(`lang.${l}`)}
                  style={[styles.langItem, on && styles.langItemOn]}
                >
                  <Text style={[styles.langText, on && styles.langTextOn]}>{t(`lang.${l}`)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Cart')}
            accessibilityRole="button"
            accessibilityLabel={t('cart.title')}
            style={styles.cartBtn}
          >
            <Icon path={icons.bag} size={18} color={colors.white} strokeWidth={1.8} />
            {cartCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{toArabicDigits(cartCount, lang)}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Menu', { cat: 'all' })}
          accessibilityRole="search"
          accessibilityLabel={t('home.searchPlaceholder')}
          style={styles.search}
        >
          <Icon path={icons.search} size={17} color={colors.muted2} strokeWidth={2} />
          <Text style={styles.searchText} numberOfLines={1}>
            {t('home.searchPlaceholder')}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.promo}>
          <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient
            colors={[scrim.hero, scrim.heroFade]}
            locations={[0.38, 0.9]}
            start={{ x: isRTL ? 1 : 0, y: 0.5 }}
            end={{ x: isRTL ? 0 : 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.promoText}>
            <Text style={styles.promoKicker}>{t('home.hero.kicker')}</Text>
            <Text style={styles.promoTitle}>{t('home.hero.title')}</Text>
            <Button
              label={t('home.hero.cta')}
              variant="amber"
              size="sm"
              trailing={arrow}
              onPress={() => navigation.navigate('Menu', { cat: 'all' })}
              style={styles.promoCta}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {cats.map((c) => (
            <Chip key={c.k} label={c.label} selected={cat === c.k} onPress={() => setCat(c.k)} />
          ))}
        </ScrollView>

        <View style={styles.section}>
          <SectionHeader
            title={t('home.featured')}
            actionLabel={t('common.seeAll')}
            onAction={openMenu}
          />
          <View style={styles.featuredRow}>
            {featured.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                style={styles.featuredCard}
                onPress={() => navigation.navigate('DishDetail', { id: dish.id })}
              />
            ))}
          </View>
        </View>

        {popular.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title={t('home.mostOrderedWeek')} />
            {popular.map((dish) => (
              <Card
                key={dish.id}
                padding={spacing.lg}
                onPress={() => navigation.navigate('DishDetail', { id: dish.id })}
                accessibilityLabel={lang === 'ar' ? dish.name : t(`dish.${dish.id}.name`, dish.name)}
                style={styles.popRow}
              >
                <Image source={{ uri: dish.image }} style={styles.popImage} resizeMode="cover" />
                <View style={styles.popText}>
                  <Text style={styles.popName} numberOfLines={1}>
                    {lang === 'ar' ? dish.name : t(`dish.${dish.id}.name`, dish.name)}
                  </Text>
                  <Text style={styles.popSub} numberOfLines={1}>
                    {lang === 'ar' ? dish.sub : t(`dish.${dish.id}.sub`, dish.sub)}
                  </Text>
                </View>
                <Text style={styles.popPrice}>{formatPrice(dish.price, lang)}</Text>
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.xxxl,
    borderBottomLeftRadius: radius.sheet,
    borderBottomRightRadius: radius.sheet,
    gap: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    ...type.caption,
    color: overlay.white70,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  location: {
    ...type.bodyStrong,
    color: colors.white,
  },
  langPill: {
    flexDirection: 'row',
    backgroundColor: overlay.white14,
    borderRadius: radius.pill,
    padding: 3,
  },
  langItem: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  langItemOn: {
    backgroundColor: colors.white,
  },
  langText: {
    ...type.captionStrong,
    fontSize: 11,
    color: overlay.white80,
  },
  langTextOn: {
    color: colors.tealDark,
  },
  cartBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: overlay.white14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    end: -2,
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    borderWidth: 1.5,
    borderColor: colors.tealDark,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...type.micro,
    fontSize: 9.5,
    lineHeight: 13,
    color: colors.amberText,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: overlay.white96,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
  },
  searchText: {
    ...type.body,
    flex: 1,
    color: colors.muted2,
  },
  body: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.giant,
    gap: spacing.xxxl,
  },
  promo: {
    height: 132,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.tealDark,
  },
  promoText: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    gap: spacing.sm,
  },
  promoKicker: {
    ...type.captionStrong,
    color: colors.gold,
    letterSpacing: 0.5,
  },
  promoTitle: {
    ...type.h2,
    fontSize: 19,
    lineHeight: 26,
    color: colors.white,
  },
  promoCta: {
    borderRadius: radius.pill,
    paddingVertical: 6,
  },
  chips: {
    gap: spacing.md,
    alignItems: 'center',
  },
  section: {
    gap: spacing.lg,
  },
  featuredRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  featuredCard: {
    flex: 1,
  },
  popRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    borderRadius: radius.card,
  },
  popImage: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.sand,
  },
  popText: {
    flex: 1,
    gap: 2,
  },
  popName: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  popSub: {
    ...type.caption,
    fontSize: 11,
    color: colors.muted2,
  },
  popPrice: {
    ...type.h3,
    fontSize: 13,
    color: colors.teal,
  },
});
