import React, { useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollToTop } from '@react-navigation/native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import Badge from '../components/Badge';
import PatternFill from '../components/PatternFill';
import RotatingHint from '../components/RotatingHint';
import SubscriptionPanel from '../components/SubscriptionPanel';
import { SkeletonCard } from '../components/Skeleton';
import DashedOutline from '../components/DashedOutline';
import CustomPlanCard from '../components/CustomPlanCard';
import PressScale from '../components/PressScale';
import { icons } from '../components/icons';
import Button from '../components/Button';
import BoxCard from '../components/BoxCard';
import SectionHeader from '../components/SectionHeader';
import LocationPicker from '../components/LocationPicker';
import { colors, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useCart } from '../state/CartContext';
import { useNotifications } from '../state/NotificationsContext';
import { usePlan } from '../state/PlanContext';
import { useAuth } from '../state/AuthContext';
import { locationLabel, useLocations } from '../state/LocationContext';
import { type BoxGoal, dietBoxes, searchHints } from '../data/menu';
import type { TabScreenProps } from '../navigation/RootNavigator';

// Same girih tile the login hero uses, alpha-cut so only the gold lines land on
// the gradient. `repeat` sizes off the asset's own tile, so each patch carries
// explicit dimensions — an absolute child pinned to opposite edges would
// collapse to one stretched motif instead.
const PATTERN_GOLD = require('../../assets/pattern-arabic-gold.png');
const LOGO = require('../../assets/logo-hail.png');
const PATCH_SM = 128;

const HEADER_GRADIENT = [colors.tealDark, colors.tealMid] as const;
const PLAN_GRADIENT = [colors.tealDark, colors.teal] as const;

export default function PlansScreen({ navigation }: TabScreenProps<'Plans'>) {
  const { t, lang, isRTL } = useLanguage();
  const { items } = useCart();
  const insets = useSafeAreaInsets();
  const { subscription, subscriptionPricing, hydrated, startFromBox, startCustom } = usePlan();
  const { status, user } = useAuth();
  const { unreadCount } = useNotifications();
  const { selected, hydrated: locHydrated } = useLocations();
  const [pickerOpen, setPickerOpen] = useState(false);
  const scroller = useRef<ScrollView>(null);
  useScrollToTop(scroller);

  const cartCount = items.reduce((sum, it) => sum + it.qty, 0);
  const chevron = isRTL ? icons.chevronLeft : icons.chevronRight;
  const arrow = isRTL ? icons.arrowLeft : icons.arrowRight;

  // Arabic greets with صباح الخير until noon and مساء الخير after, so afternoon
  // and evening share a phrase there; English splits them at 5pm.
  const hour = new Date().getHours();
  const partOfDay = hour >= 4 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : 'evening';
  const timeGreeting = t(`home.greeting.${partOfDay}`);

  // The API supplies the name; a phone-only sign-in may not, so a nameless
  // greeting is the fallback rather than a made-up name.
  const name = user?.name.trim();
  const greeting = name
    ? t('home.greeting.named').replace('{greeting}', timeGreeting).replace('{name}', name)
    : timeGreeting;

  const hints = useMemo(
    () => searchHints().map((d) => `${t('home.searchPrefix')} ${lang === 'ar' ? d.name : t(`dish.${d.id}.name`, d.name)}`),
    [t, lang],
  );

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
    <Screen edges={['left', 'right']} texture>
      <LocationPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onOpenMap={() => navigation.navigate('Map')}
      />
      <LinearGradient
        colors={HEADER_GRADIENT}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.xl }]}
      >
        <View style={styles.wash} pointerEvents="none" />

        {/* Logical edges, so the composition mirrors with the language the way
            the login hero's does. Under Arabic `end` is the physical left. */}
        <View style={[styles.patch, styles.patchTopEnd]} pointerEvents="none">
          <Image source={PATTERN_GOLD} resizeMode="repeat" style={styles.fillSm} />
        </View>
        <View style={[styles.patch, styles.patchTopStart]} pointerEvents="none">
          <Image source={PATTERN_GOLD} resizeMode="repeat" style={styles.fillSm} />
        </View>
        <View style={styles.headerRow}>
          <View style={styles.identity}>
            <Text style={styles.greeting} numberOfLines={1}>
              {greeting}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t('location.deliverTo')}
              style={styles.locationRow}
            >
              <Icon path={icons.pin} size={13} color={colors.gold} strokeWidth={2} />
              <Text style={styles.location} numberOfLines={1}>
                {selected ? locationLabel(selected, t) : locHydrated ? t('location.add') : ''}
              </Text>
              <Icon path={icons.chevronDown} size={13} color={overlay.white70} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Inbox')}
              accessibilityRole="button"
              accessibilityLabel={t('profile.notifications')}
              style={styles.cartBtn}
            >
              <Icon path={icons.bell} size={18} color={colors.white} strokeWidth={1.8} />
              <Badge count={unreadCount} ringColor={colors.tealDark} />
            </TouchableOpacity>

            {/* No basket until there is something in it — an empty one is a
                button that can only disappoint. */}
            {cartCount > 0 ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Cart')}
                accessibilityRole="button"
                accessibilityLabel={t('cart.title')}
                style={styles.cartBtn}
              >
                <Icon path={icons.bag} size={18} color={colors.white} strokeWidth={1.8} />
                <Badge count={cartCount} ringColor={colors.tealDark} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('SingleMeals', { cat: 'all', focusSearch: true })}
          accessibilityRole="search"
          accessibilityLabel={t('home.searchPlaceholder')}
          style={styles.search}
        >
          <Icon path={icons.search} size={17} color={colors.muted2} strokeWidth={2} />
          {/* One example at a time, falling through the field: a search box
              that names three dishes at once is a sentence to read, and this
              one is meant to be glanced at. */}
          <RotatingHint phrases={hints} style={styles.searchText} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        ref={scroller}
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Which of the two cards belongs here is not known until storage
            answers, and they say opposite things — so neither is guessed. */}
        {!hydrated ? (
          <SkeletonCard height={132} />
        ) : subscription && subscriptionPricing ? (
          <SubscriptionPanel />
        ) : (
          /* The whole card opens the builder, not just the pill inside it: at
             this size the card reads as one target, and a tap landing on the
             headline and doing nothing reads as the app being broken. The pill
             stays because it is what names the action — it just no longer has
             to be hit. */
          <PressScale
            onPress={openCustom}
            scaleTo={0.985}
            accessibilityLabel={`${t('home.hero.title')} — ${t('home.hero.cta')}`}
          >
          <LinearGradient
            colors={PLAN_GRADIENT}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.promo}
          >
            {/* Heavier than the default: this card is the brand's own pitch and
                carries no photograph, so the girih is what fills it. */}
            <PatternFill opacity={0.5} />
            <View style={styles.promoText}>
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
            {/* The brand mark rather than a dish: this card sells the idea of a
                plan, not any one meal, and a photo cropped into a short banner
                only ever showed a fragment of one. */}
            <View style={styles.promoLogoRing}>
              <Image source={LOGO} style={styles.promoLogo} resizeMode="cover" />
            </View>
          </LinearGradient>
          </PressScale>
        )}

        {subscription ? (
          /* One door to the catalogue rather than the catalogue itself: a
             customer already on a plan is browsing, not shopping, and the
             swap happens at the checkout gate. */
          <View style={styles.section}>
            <SectionHeader title={t('plans.others')} subtitle={t('plans.others.sub')} />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Boxes')}
              accessibilityRole="button"
              accessibilityLabel={t('plans.boxes')}
              style={[styles.custom, shadow.card]}
            >
              <DashedOutline />
              <View style={[styles.tile, { backgroundColor: colors.tile }]}>
                <Icon path={icons.box} size={19} color={colors.teal} strokeWidth={1.8} />
              </View>
              <View style={styles.linkText}>
                <Text style={styles.linkLabel}>{t('plans.boxes')}</Text>
                <Text style={styles.linkSub}>{t('boxes.subtitle')}</Text>
              </View>
              <Icon path={chevron} size={15} color={colors.faint2} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
          <View style={styles.section}>
            <SectionHeader title={t('plans.forYou')} subtitle={t(`box.${feature.id}.for`)} />
            <BoxCard box={feature} variant="feature" onPress={() => openBox(feature.id)} />
          </View>

          <View style={styles.section}>
            <SectionHeader title={t('plans.boxes')} />
            <View style={styles.grid}>
              {rest.map((box) => (
                <BoxCard key={box.id} box={box} onPress={() => openBox(box.id)} style={styles.gridItem} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title={t('plans.orBuild')} />

            <CustomPlanCard onPress={openCustom} />
          </View>
          </>
        )}

        {/* Neither of these is a subscription, so both stay in the open whether
            or not one is running. */}
        <View style={styles.section}>
          <SectionHeader title={t('plans.more')} />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('SingleMeals')}
            accessibilityRole="button"
            accessibilityLabel={t('plans.single')}
            style={styles.single}
          >
            <View style={[styles.tile, { backgroundColor: colors.card }]}>
              <Icon path={icons.utensils} size={19} color={colors.muted} strokeWidth={1.8} />
            </View>
            <View style={styles.linkText}>
              <Text style={styles.linkLabel}>{t('plans.single')}</Text>
              <Text style={styles.linkSub}>{t('home.single.sub')}</Text>
            </View>
            <Icon path={chevron} size={15} color={colors.faint2} strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Catering')}
            accessibilityRole="button"
            accessibilityLabel={t('catering.entry')}
            style={styles.single}
          >
            <View style={[styles.tile, { backgroundColor: colors.tile }]}>
              <Icon path={icons.user} size={19} color={colors.muted} strokeWidth={1.8} />
            </View>
            <View style={styles.linkText}>
              <Text style={styles.linkLabel}>{t('catering.entry')}</Text>
              <Text style={styles.linkSub}>{t('catering.entrySub')}</Text>
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
    // Required: the patches bleed past every edge and would otherwise spill
    // over the rounded corners and down the page.
    overflow: 'hidden',
  },
  // A warm veil over the teal so the gradient reads softer under the texture.
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.regularBg,
    opacity: 0.1,
  },
  patch: {
    position: 'absolute',
    overflow: 'hidden',
    opacity: 0.55,
  },
  patchTopEnd: {
    top: -46,
    end: -30,
    width: PATCH_SM,
    height: PATCH_SM,
    borderRadius: PATCH_SM / 2,
  },
  patchTopStart: {
    top: -34,
    start: -38,
    width: PATCH_SM,
    height: PATCH_SM,
    borderRadius: PATCH_SM / 2,
  },
  fillSm: {
    width: PATCH_SM,
    height: PATCH_SM,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  cartBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: overlay.white14,
    alignItems: 'center',
    justifyContent: 'center',
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
  // A row now the photo is gone: copy on the leading side, the mark on the
  // trailing side, both in flow so neither has to be positioned over the other.
  promo: {
    height: 132,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.tealDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: spacing.xl,
  },
  promoText: {
    flex: 1,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  // The splash's ring at card scale, so the mark is the same object in both
  // places rather than a bare image pasted on teal.
  promoLogoRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    borderColor: colors.gold,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoLogo: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    backgroundColor: colors.card,
    borderRadius: radius.lg,
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
