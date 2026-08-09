import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Button from '../components/Button';
import BoxCard from '../components/BoxCard';
import SectionHeader from '../components/SectionHeader';
import { colors, overlay, radius, scrim, shadow, spacing, type } from '../theme';
import { type Lang, useLanguage } from '../i18n/LanguageContext';
import { toArabicDigits } from '../i18n/digits';
import { useCart } from '../state/CartContext';
import { usePlan } from '../state/PlanContext';
import {
  type BoxGoal,
  MAX_DISCOUNT,
  dietBoxes,
  formatPrice,
  groupNumber,
  heroImage,
} from '../data/menu';
import type { TabScreenProps } from '../navigation/RootNavigator';

const HEADER_GRADIENT = [colors.tealDark, colors.tealMid] as const;
const PLAN_GRADIENT = [colors.tealDark, colors.teal] as const;
const LANGS: Lang[] = ['ar', 'en'];

export default function PlansScreen({ navigation }: TabScreenProps<'Plans'>) {
  const { t, lang, isRTL, setLang } = useLanguage();
  const { items } = useCart();
  const insets = useSafeAreaInsets();
  const { subscription, subscriptionPricing, startFromBox, startCustom } = usePlan();

  const cartCount = items.reduce((sum, it) => sum + it.qty, 0);
  const chevron = isRTL ? icons.chevronLeft : icons.chevronRight;
  const arrow = isRTL ? icons.arrowLeft : icons.arrowRight;

  const feature = dietBoxes.find((b) => b.popular) ?? dietBoxes[0];
  const rest = dietBoxes.filter((b) => b.id !== feature.id);

  const openBox = (id: BoxGoal) => {
    startFromBox(id);
    navigation.navigate('BoxDetail', { id });
  };

  const openCustom = () => {
    startCustom();
    navigation.navigate('PlanBuilder');
  };

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
        ) : (
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
              <Text style={styles.promoKicker}>
                {`${t('home.hero.kicker')} ${toArabicDigits(Math.round(MAX_DISCOUNT * 100), lang)}${t('common.percent')}`}
              </Text>
              <Text style={styles.promoTitle}>{t('home.hero.title')}</Text>
              <Button
                label={t('home.hero.cta')}
                variant="amber"
                size="sm"
                trailing={arrow}
                onPress={openCustom}
                style={styles.promoCta}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader title={t('plans.forYou')} subtitle={t(`box.${feature.id}.for`)} />
          <BoxCard box={feature} variant="feature" onPress={() => openBox(feature.id)} />
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('plans.boxes')} subtitle={t('boxes.subtitle')} />
          <View style={styles.grid}>
            {rest.map((box) => (
              <BoxCard key={box.id} box={box} onPress={() => openBox(box.id)} style={styles.gridItem} />
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
    gap: spacing.giant,
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
  section: {
    gap: spacing.xl,
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
  tile: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
