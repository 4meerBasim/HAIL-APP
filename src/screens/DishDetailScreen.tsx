import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import MacroRow from '../components/MacroRow';
import PressScale from '../components/PressScale';
import PricePill from '../components/PricePill';
import Hero, { heroAspect } from '../components/Hero';
import BuildRow from '../components/BuildRow';
import { colors, fonts, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useOrderText } from '../i18n/orderText';
import { formatNumber } from '../i18n/digits';
import {
  type Dish,
  dishParts,
  formatPrice,
  getDish,
  groupNumber,
  macros as dishMacros,
  parsePrice,
} from '../data/menu';
import { priceOf, sizes } from '../data/extras';
import {
  BUILT_MEAL_ID,
  ingredientPriceAt,
  isByWeight as isPartByWeight,
  gramsOf as partGramsOf,
  mealMacros,
  mealPrice,
  parseBuildKey,
} from '../data/ingredients';
import { type MealBuild, emptyBuild, useMealBuild } from '../state/MealBuildContext';
import { useCart } from '../state/CartContext';
import { type BuildTarget, usePlan } from '../state/PlanContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const DEFAULT_DISH_ID = 'quzi';

/** A built meal read back out of a cart line's key. */
interface BuiltMeal {
  picked: string[];
  grams: Record<string, number>;
}
// How far a finger has to travel sideways before letting go counts as a page
// turn rather than a tap that wandered. A flick past the velocity threshold
// turns the page whatever the distance.
const SWIPE = 56;
// Past this many, a row of dots stops being countable and becomes a smear —
// so the bar states the position in words instead.
const DOT_MAX = 8;

interface PageProps {
  dish: Dish;
  qty: number;
  onQty: (next: number) => void;
  onAdd: () => void;
  /** A plan meal is not bought here: it is tailored and saved back. */
  mode: 'buy' | 'read' | 'edit';
  /** What the plan already remembers about this meal, ready to read. */
  saved: string[];
  /** Only the page on screen reports its scroll — the bar follows that one.
   *  Typed off Animated.ScrollView: a native-driven Animated.event is an
   *  object, and handing it to a plain ScrollView makes React Native try to
   *  call it — which is the "Object is not a function" this screen threw. */
  onScroll?: React.ComponentProps<typeof Animated.ScrollView>['onScroll'];
  onEdit: () => void;
  onSave: () => void;
  width: number;
  active: boolean;
  /** Null on a plan meal: the kitchen batches those, so they are not built. */
  build: MealBuild | null;
  /** A meal assembled on the Menu tab, reopened from the basket. Read-only —
   *  it is already in the cart, so this page says what is in it, not how to
   *  change it. */
  built: BuiltMeal | null;
  onSize: (id: string) => void;
  onOpenExtras: () => void;
  onClearAdded: () => void;
  unit: number;
}

// One dish, from the photo down to the add button. Rendered for the neighbours
// as well as the dish on screen — that is what makes the swipe a slide instead
// of a cut: the next page is already there, moving with the finger.
function DishPage({
  dish,
  qty,
  onQty,
  onAdd,
  mode,
  saved,
  onEdit,
  onSave,
  onScroll,
  width,
  active,
  build,
  built,
  onSize,
  onOpenExtras,
  onClearAdded,
  unit,
}: PageProps) {
  const { t, lang } = useLanguage();
  const { dishName: nameOf } = useOrderText();
  const fmtNum = (n: number | string): string => formatNumber(n);

  const dishName = lang === 'ar' ? dish.name : t(`dish.${dish.id}.name`, dish.name);
  // Nutrition follows the plate: a double portion is twice the food, so the
  // numbers under it move with the size rather than describing a meal the
  // customer is no longer ordering.
  const portion = sizes.find((size) => size.id === build?.size)?.portion ?? 1;
  const base = dishMacros[dish.id];
  // A built meal has no figures of its own — it is whatever went into it, so
  // its nutrition is summed from the parts rather than looked up.
  const macros = built
    ? mealMacros(built.picked, built.grams)
    : base
      ? {
          calories: base.calories * portion,
          protein: base.protein * portion,
          carbs: base.carbs * portion,
          fat: base.fat * portion,
        }
      : undefined;

  // Each part, named at the weight it was ordered at, priced as it was charged.
  const builtParts = built
    ? built.picked.map((id) => ({
        id,
        label: isPartByWeight(id)
          ? `${t(`ing.${id}`)} · ${formatNumber(built.grams[id] ?? partGramsOf(id))}${t('detail.gram')}`
          : t(`ing.${id}`),
        price: ingredientPriceAt(id, built.grams[id]),
      }))
    : [];
  const description = t(`detail.${dish.id}.desc`, dish.sub);
  // What comes in the box, straight off the offer sheet's own "+" list.
  const parts = dishParts(lang === 'ar' ? dish.sub : t(`dish.${dish.id}.sub`, dish.sub));

  // The button-side price is the line total, so the stepper and the money the
  // customer is about to spend never disagree — extras included.
  const lineTotal = formatPrice(groupNumber(unit * qty), lang);

  const money = (n: number) => formatPrice(groupNumber(n), lang);

  // Everything the customer added, named and priced as one line — the page
  // says what is on the meal, the page behind the row is where it is chosen.
  const counted = Object.entries(build?.items ?? {});
  const added = [
    ...(build?.extras ?? []).map((id) => t(`opt.${id}`)),
    ...counted.map(([id, n]) => (n > 1 ? `${nameOf(id)} ×${formatNumber(n)}` : nameOf(id))),
  ];
  const addedPrice =
    (build?.extras ?? []).reduce((sum, id) => sum + priceOf(id), 0) +
    counted.reduce((sum, [id, n]) => sum + parsePrice(getDish(id)?.price ?? '0') * n, 0);

  return (
    <View style={{ width }} pointerEvents={active ? 'auto' : 'none'}>
      <Animated.ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        scrollEnabled={active}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <Hero source={dish.image} zoomable={active} />

        <View style={styles.sheet}>
        <Text style={styles.title}>{dishName}</Text>

        <Text style={styles.desc}>{description}</Text>

        {!build && !built && parts.length > 0 ? (
          <View style={styles.chips}>
            {parts.map((part) => (
              <View key={part} style={styles.chip}>
                <Text style={styles.chipText}>{part}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {macros ? (
          <View style={[styles.macros, shadow.card]}>
            <MacroRow macros={macros} />
            {portion !== 1 ? (
              <Text style={styles.macrosNote}>
                {t('opt.macrosFor').replace('{size}', t(`opt.${build?.size}`))}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* What went in the box, itemised. The meal is already in the basket,
            so this states it rather than offering to change it — the place to
            build another is the tab it was built on. */}
        {built ? (
          <View style={styles.total}>
            {builtParts.map((part) => (
              <View key={part.id} style={styles.totalLine}>
                <Text style={styles.totalLabel} numberOfLines={1}>
                  {part.label}
                </Text>
                <Text style={styles.totalValue}>{money(part.price)}</Text>
              </View>
            ))}
            <View style={styles.totalRule} />
            <View style={styles.totalLine}>
              <Text style={styles.totalGrand}>{t('opt.total')}</Text>
              <Text style={styles.totalGrandValue}>{money(unit)}</Text>
            </View>
          </View>
        ) : null}

        {/* Saved, and shown: an edit that disappears the moment it is stored
            leaves the customer with no way to tell whether it took. */}
        {mode === 'read' && saved.length > 0 ? (
          <View style={styles.build}>
            <Text style={styles.buildTitle}>{t('detail.tailored')}</Text>
            <View style={styles.savedCard}>
              {saved.map((line, i) => (
                <View key={`${line}-${i}`} style={styles.savedLine}>
                  <Icon path={icons.check} size={12} color={colors.teal} strokeWidth={3} />
                  <Text style={styles.savedText} numberOfLines={2}>
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* The meal is built on the meal's own page. Sweets and drinks are the
            exception: those are menu items with photographs and prices of
            their own, so they are chosen from a listing page like any other. */}
        {build ? (
          <>
            <View style={styles.build}>
              <Text style={styles.buildTitle}>{t('opt.size')}</Text>
              <Text style={styles.buildHint}>{t('opt.size.sub')}</Text>

              {sizes.map((size) => {
                const on = build.size === size.id;
                return (
                  <PressScale
                    key={size.id}
                    onPress={() => onSize(size.id)}
                    scaleTo={0.985}
                    accessibilityLabel={`${t(`opt.${size.id}`)} · ${t(`opt.${size.id}.serves`)}`}
                    accessibilityState={{ selected: on }}
                    style={[styles.sizeRow, on && styles.sizeRowOn, shadow.card]}
                  >
                    {/* The bowl grows with the portion: the size of the thing is
                        the one part of this that does not need reading. */}
                    <View style={[styles.sizeTile, on && styles.sizeTileOn]}>
                      <Icon
                        path={icons.bowl}
                        size={13 + size.portion * 6}
                        color={on ? colors.white : colors.teal}
                        strokeWidth={1.8}
                      />
                    </View>

                    <View style={styles.sizeText}>
                      <Text style={styles.sizeName}>
                        {`${t(`opt.${size.id}`)} · ${t(`opt.${size.id}.portion`)}`}
                      </Text>
                      <View style={styles.sizeServes}>
                        <Icon
                          path={icons.user}
                          size={11}
                          color={colors.muted2}
                          strokeWidth={2}
                        />
                        <Text style={styles.sizeServesText}>{t(`opt.${size.id}.serves`)}</Text>
                      </View>
                    </View>

                    <Text style={[styles.sizePrice, on && styles.sizePriceOn]}>
                      {size.price > 0 ? `+ ${money(size.price)}` : t('opt.free')}
                    </Text>

                    <View style={[styles.sizeMark, on && styles.sizeMarkOn]}>
                      {on ? (
                        <Icon path={icons.check} size={11} color={colors.white} strokeWidth={3} />
                      ) : null}
                    </View>
                  </PressScale>
                );
              })}
            </View>

            <View style={styles.build}>
              <Text style={styles.buildTitle}>{t('opt.extras')}</Text>
              <BuildRow
                icon="plus"
                label={t('opt.extras.add')}
                sub={added.length > 0 ? added.join(' · ') : t('opt.extras.sub')}
                price={addedPrice > 0 ? `+ ${money(addedPrice)}` : undefined}
                selected={added.length > 0}
                action="open"
                onPress={onOpenExtras}
                onClear={added.length > 0 ? onClearAdded : undefined}
                clearLabel={t('opt.clear')}
              />
            </View>

            {/* The running total, itemised: every line that moved the price is
                named, so the number at the bottom is never a surprise. */}
            <View style={styles.total}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>{t('opt.base')}</Text>
                <Text style={styles.totalValue}>{formatPrice(dish.price, lang)}</Text>
              </View>
              {[
                ...(build.size !== sizes[0].id
                  ? [{ id: build.size, label: t(`opt.${build.size}`), price: priceOf(build.size) }]
                  : []),
                ...build.extras.map((id) => ({ id, label: t(`opt.${id}`), price: priceOf(id) })),
                ...counted.map(([id, n]) => ({
                  id,
                  label: n > 1 ? `${nameOf(id)} ×${formatNumber(n)}` : nameOf(id),
                  price: parsePrice(getDish(id)?.price ?? '0') * n,
                })),
              ].map((line) => (
                <View key={line.id} style={styles.totalLine}>
                  <Text style={styles.totalLabel} numberOfLines={1}>
                    {line.label}
                  </Text>
                  <Text style={styles.totalValue}>{`+ ${money(line.price)}`}</Text>
                </View>
              ))}
              <View style={styles.totalRule} />
              <View style={styles.totalLine}>
                <Text style={styles.totalGrand}>{t('opt.total')}</Text>
                <Text style={styles.totalGrandValue}>{money(unit)}</Text>
              </View>
            </View>
          </>
        ) : null}

        </View>
      </Animated.ScrollView>

      <View style={styles.ctaBar}>
        {mode === 'buy' ? (
          <View style={styles.ctaRow}>
            {/* Nothing encloses it: two round buttons with the count between
                them. A pill around a pair of buttons is a shape inside a shape,
                and beside a plain gold button it was the fussier of the two. */}
            <View style={styles.stepper}>
              <TouchableOpacity
                activeOpacity={0.6}
                disabled={qty <= 1}
                onPress={() => onQty(Math.max(1, qty - 1))}
                accessibilityRole="button"
                accessibilityLabel={t('common.decrease')}
                style={[styles.stepBtn, qty <= 1 && styles.stepBtnOff]}
              >
                <Icon
                  path={icons.minus}
                  size={15}
                  color={qty <= 1 ? colors.faint2 : colors.tealText}
                  strokeWidth={3}
                />
              </TouchableOpacity>

              <Text style={styles.stepCount}>{fmtNum(qty)}</Text>

              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => onQty(qty + 1)}
                accessibilityRole="button"
                accessibilityLabel={t('common.increase')}
                style={styles.stepBtn}
              >
                <Icon path={icons.plus} size={15} color={colors.tealText} strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <PricePill value={lineTotal} size="sm" style={styles.ctaPrice} />

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onAdd}
              style={[styles.cta, styles.ctaPrimary]}
              accessibilityRole="button"
            >
              <Text style={styles.ctaPrimaryText} numberOfLines={1}>
                {t('detail.addToCart')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* A meal that arrives under the plan is already paid for: no count to
             set, no basket to add it to. The one thing left to do with it is
             change how it is cooked. */
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={mode === 'edit' ? onSave : onEdit}
            style={[styles.cta, styles.ctaPrimary, styles.ctaWide]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaPrimaryText} numberOfLines={1}>
              {t(mode === 'edit' ? 'detail.saveEdit' : 'detail.edit')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function DishDetailScreen({ route, navigation }: RootStackScreenProps<'DishDetail'>) {
  const { t, isRTL } = useLanguage();
  const { dishName: nameOf } = useOrderText();
  const { addItem } = useCart();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [qty, setQty] = useState(1);
  // A meal ordered on its own is built by the customer; one arriving under a
  // plan is not, so the whole block is absent rather than disabled.
  const fromPlan = route.params?.fromPlan === true;
  // Which plan this meal is tailored on: the one being built, or the one
  // already running. Both open read-only; they differ in where the edit lands.
  const target: BuildTarget = route.params?.building === true ? 'plan' : 'subscription';
  // Opened from the basket: the parts and the weights come back out of the cart
  // line's own key, which is the only place a built meal is recorded.
  const builtKey = route.params?.built;
  const built = useMemo<BuiltMeal | null>(
    () => (builtKey ? parseBuildKey(builtKey) : null),
    [builtKey],
  );
  const { build, start, load, setSize, clearAdded } = useMealBuild();
  const { setMealBuild, plan, subscription } = usePlan();
  const mealBuilds = (target === 'plan' ? plan : subscription)?.mealBuilds;
  // A plan meal is already paid for, so this page does not sell it. It opens
  // read-only with one button — edit — and the same builder the à-la-carte
  // meal uses appears in place once that is pressed.
  const [editing, setEditing] = useState(false);
  // The bar belongs to the photo: fixed against the meals sliding sideways
  // under it, but travelling up with the page as it scrolls.
  const scrollY = useRef(new Animated.Value(0)).current;

  // Arriving from a delivery day brings that whole day with it, so the screen
  // is the day rather than one dish out of it. Everywhere else it is a run of
  // one and none of the pager shows at all.
  const day = useMemo(() => {
    const opened = route.params?.id ?? DEFAULT_DISH_ID;
    const ids = route.params?.siblings?.length ? route.params.siblings : [opened];
    const dishes = ids.map((id) => getDish(id) ?? getDish(DEFAULT_DISH_ID)!);
    return { dishes, start: Math.max(0, ids.indexOf(opened)) };
  }, [route.params?.id, route.params?.siblings]);

  const [at, setAt] = useState(day.start);
  const many = day.dishes.length > 1;

  // Pages are laid out in reading order, so under Arabic the first sits at the
  // right edge and the row travels the other way. One sign carries that
  // everywhere instead of a mirrored branch per calculation.
  const dir = isRTL ? 1 : -1;
  const restAt = (i: number) => i * width * dir;

  const pos = useRef(new Animated.Value(restAt(day.start))).current;
  const live = useRef({ at, count: day.dishes.length });
  live.current = { at, count: day.dishes.length };

  // The index is committed as the spring starts, not when it lands: the page it
  // moves to is already on screen, so the dots and the arrows have no reason to
  // wait for the movement to finish.
  const goTo = (next: number, velocity = 0) => {
    setAt(next);
    // The incoming page has its own scroll offset; the bar is told to sit at
    // the top with it rather than keeping the outgoing page's lift.
    scrollY.setValue(0);
    // The stepper prices what is on screen, so it starts over with the dish.
    setQty(1);
    Animated.spring(pos, {
      toValue: restAt(next),
      velocity: velocity * width,
      // No overshoot: a page bouncing off its stop reads as a rubber band, not
      // as a page.
      bounciness: 0,
      speed: 16,
      useNativeDriver: true,
    }).start();
  };

  const goToRef = useRef(goTo);
  goToRef.current = goTo;

  const swipe = useRef(
    PanResponder.create({
      // Claimed only once the finger is clearly travelling sideways, so a tap
      // on the photo still opens it and the stepper still works.
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderGrant: () => pos.stopAnimation(),
      onPanResponderMove: (_e, g) => {
        const { at: i, count } = live.current;
        const wanted = g.dx * dir > 0 ? 1 : -1;
        // Past either end the row still moves, but heavily damped — the give is
        // what says "there is nothing that way" without a message.
        const past = i + wanted < 0 || i + wanted > count - 1;
        pos.setValue(restAt(i) + (past ? g.dx * 0.25 : g.dx));
      },
      onPanResponderRelease: (_e, g) => {
        const { at: i, count } = live.current;
        // Distance or speed: a flick turns the page without travelling far.
        const enough = Math.abs(g.dx) > SWIPE || Math.abs(g.vx) > 0.35;
        const wanted = g.dx * dir > 0 ? 1 : -1;
        const next = enough ? Math.max(0, Math.min(count - 1, i + wanted)) : i;
        goToRef.current(next, g.vx);
      },
      onPanResponderTerminate: () => goToRef.current(live.current.at),
    }),
  ).current;

  const dish = day.dishes[Math.min(at, day.dishes.length - 1)];
  // The hero is sized by its photo, so the bar can be parked against its lower
  // edge without waiting on a layout pass.
  const heroBottom = width / heroAspect(dish.image);

  // A build belongs to one dish: opening another meal — or paging to the next
  // one in a day — starts it over rather than carrying extras across.
  useEffect(() => {
    if (!fromPlan) start(dish.id);
  }, [fromPlan, dish.id, start]);

  // Opening the editor seeds it from whatever the plan already remembers about
  // this meal, so editing twice does not start from plain the second time.
  const edit = () => {
    load(dish.id, mealBuilds?.[dish.id] ?? { size: sizes[0].id, extras: [], items: {} });
    setEditing(true);
  };

  const saveEdit = () => {
    setMealBuild(target, dish.id, { size: build.size, extras: build.extras, items: build.items });
    setEditing(false);
  };

  // What the plan remembers about a dish, in the order it reads on the page.
  //
  // Computed per dish rather than for the one on screen: every page in the
  // swipe row is already mounted, so building this only for the active index
  // meant the page you swiped to arrived with nothing under its name and filled
  // in a frame later, once the index committed. The pages are few and this is a
  // lookup and a map, so there is nothing to save by deferring it.
  const savedFor = useCallback(
    (dishId: string): string[] => {
      const stored = mealBuilds?.[dishId];
      if (!stored) return [];
      return [
        ...(stored.size !== sizes[0].id ? [t(`opt.${stored.size}`)] : []),
        ...stored.extras.map((id) => t(`opt.${id}`)),
        ...Object.entries(stored.items).map(([id, n]) =>
          n > 1 ? `${nameOf(id)} ×${formatNumber(n)}` : nameOf(id),
        ),
      ];
    },
    [mealBuilds, nameOf, t],
  );

  /**
   * The build a given page should show.
   *
   * Falls back to a plain build when the context is still holding the previous
   * dish. `start` is called from an effect, which lands a frame AFTER the page
   * it belongs to has rendered — so keying the controls off `build.dishId`
   * alone meant every page you swiped to arrived with no size and no extras and
   * grew them a moment later. A plain build is exactly what `start` is about to
   * set, and the default size is free, so the swap is invisible.
   *
   * Under `fromPlan` the meal is cooked as specified, so only the page being
   * edited gets controls at all.
   */
  const buildFor = useCallback(
    (dishId: string, active: boolean): MealBuild | null => {
      // A built meal reopened from the basket is already made and already paid
      // into the cart, so it gets no size control and no extras row — the
      // sizes and extras here belong to plated dishes, not to one assembled
      // out of weighed parts.
      if (built && dishId === BUILT_MEAL_ID) return null;
      if (fromPlan && !(active && editing)) return null;
      return build.dishId === dishId ? build : emptyBuild(dishId);
    },
    [build, built, editing, fromPlan],
  );

  const priceWith = useCallback(
    (d: Dish, mealBuild: MealBuild | null): number => {
      // The built meal's listed price is 0 — it is worth what went into it, so
      // it is priced from its parts at the weights they were ordered at.
      if (built && d.id === BUILT_MEAL_ID) return mealPrice(built.picked, built.grams);
      return (
        parsePrice(d.price) +
        (mealBuild
          ? priceOf(mealBuild.size) +
            mealBuild.extras.reduce((sum, id) => sum + priceOf(id), 0) +
            Object.entries(mealBuild.items).reduce(
              (sum, [id, n]) => sum + parsePrice(getDish(id)?.price ?? '0') * n,
              0,
            )
          : 0)
      );
    },
    [built],
  );

  // Adding from a reopened built meal means "another one of exactly this",
  // so it carries the key it came in on and lands back on the basket line it
  // was opened from. Without this the page would add a bare `built-meal` line
  // at its listed price, which is zero.
  const builtBuild =
    built && builtKey
      ? {
          key: builtKey,
          label: built.picked
            .map((id) =>
              isPartByWeight(id)
                ? `${t(`ing.${id}`)} ${formatNumber(built.grams[id] ?? partGramsOf(id))}${t('detail.gram')}`
                : t(`ing.${id}`),
            )
            .join(' + '),
          unit: mealPrice(built.picked, built.grams),
        }
      : null;

  // The active page's figures, for the cart and the bar at the foot.
  const mine = buildFor(dish.id, true);
  const unit = priceWith(dish, mine);

  // What the customer built, in the order it reads on the page, for the cart.
  const summary = mine
    ? [
        ...(mine.size !== sizes[0].id ? [t(`opt.${mine.size}`)] : []),
        ...mine.extras.map((id) => t(`opt.${id}`)),
        ...Object.entries(mine.items).map(([id, n]) =>
          n > 1 ? `${nameOf(id)} ×${formatNumber(n)}` : nameOf(id),
        ),
      ]
        .filter(Boolean)
        .join(' · ')
    : '';
  // Chrome, not content: the bar it always was, on the layer the back button
  // lives on — so the meals travel underneath it and it stays put.
  const pagerBar = many ? (
    <Animated.View
      style={[
        styles.pager,
        {
          top: heroBottom - 46,
          transform: [
            {
              translateY: scrollY.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -1],
                // Clamped below zero so an overscroll bounce at the top does
                // not push the bar down over the photo.
                extrapolateLeft: 'clamp',
              }),
            },
          ],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.pagerBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={at <= 0}
          onPress={() => goTo(at - 1)}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel={t('builder.prev')}
          style={at <= 0 && styles.pagerOff}
        >
          <Icon
            path={isRTL ? icons.chevronRight : icons.chevronLeft}
            size={14}
            color={colors.white}
            strokeWidth={2.6}
          />
        </TouchableOpacity>

        {day.dishes.length > DOT_MAX ? (
          <Text style={styles.pagerCount}>
            {`${formatNumber(at + 1)} / ${formatNumber(day.dishes.length)}`}
          </Text>
        ) : (
          <View style={styles.dots}>
            {day.dishes.map((d, i) => (
              <View key={`${d.id}-dot-${i}`} style={[styles.dot, i === at && styles.dotOn]} />
            ))}
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={at >= day.dishes.length - 1}
          onPress={() => goTo(at + 1)}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel={t('builder.next')}
          style={at >= day.dishes.length - 1 && styles.pagerOff}
        >
          <Icon
            path={isRTL ? icons.chevronLeft : icons.chevronRight}
            size={14}
            color={colors.white}
            strokeWidth={2.6}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  ) : null;

  return (
    <Screen scroll={false} edges={['bottom', 'left', 'right']} texture>
      <View style={styles.page} {...swipe.panHandlers}>
        <Animated.View
          style={[
            styles.row,
            {
              width: width * day.dishes.length,
              transform: [{ translateX: pos }],
            },
          ]}
        >
          {day.dishes.map((d, i) => (
            <DishPage
              key={`${d.id}-${i}`}
              dish={d}
              width={width}
              active={i === at}
              qty={i === at ? qty : 1}
              onQty={setQty}
              build={buildFor(d.id, i === at)}
              built={d.id === BUILT_MEAL_ID ? built : null}
              onSize={setSize}
              onOpenExtras={() => navigation.navigate('MealExtras')}
              onClearAdded={clearAdded}
              unit={priceWith(d, buildFor(d.id, i === at))}
              mode={!fromPlan ? 'buy' : editing ? 'edit' : 'read'}
              saved={savedFor(d.id)}
              onScroll={
                i === at
                  ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                      useNativeDriver: true,
                    })
                  : undefined
              }
              onEdit={edit}
              onSave={saveEdit}
              onAdd={() => {
                addItem(
                  d.id,
                  qty,
                  d.id === BUILT_MEAL_ID && builtBuild
                    ? builtBuild
                    : summary
                      ? { key: summary, label: summary, unit }
                      : undefined,
                );
                // Back to the list, where the bar above the tabs now carries
                // the new total — going straight to checkout ended the browse.
                navigation.goBack();
              }}
            />
          ))}
        </Animated.View>

        {pagerBar}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={[styles.circleBtn, styles.lead, { top: insets.top + 12 }]}
        >
          <Icon
            path={isRTL ? icons.chevronRight : icons.chevronLeft}
            size={14}
            color={colors.ink}
            strokeWidth={2.4}
          />
        </TouchableOpacity>
      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    overflow: 'hidden',
  },
  // Laid out in reading order so the first page is the one the language starts
  // from; `stretch` gives every page the row's full height.
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  // See TrackingScreen: `left`/`right` are mirrored under RTL, so the physical
  // ternary this replaced put the control on the wrong edge.
  lead: {
    start: 16,
  },
  // Hung off the photo's own lower edge rather than measured from the top of
  // the screen: the photo scrolls now, and the bar goes where it goes.
  pager: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pagerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: scrim.hero,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  pagerOff: {
    opacity: 0.35,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pagerCount: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.white,
    minWidth: 46,
    textAlign: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    opacity: 0.5,
  },
  dotOn: {
    width: 16,
    opacity: 1,
  },
  circleBtn: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  scroller: {
    flex: 1,
  },
  scrollBody: {
    paddingBottom: spacing.xs,
  },
  // Rides up over the photo and keeps going: the picture is part of the scroll,
  // so reading about the meal puts it away.
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    marginTop: -24,
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.huge,
    paddingBottom: spacing.xl,
    gap: 13,
  },
  // The one thing that does not scroll: with the meal built on the same page,
  // the running price and the button have to stay where they were.
  ctaBar: {
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.sandChip,
    paddingHorizontal: spacing.huge,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 35,
    color: colors.ink,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 27,
    color: colors.body,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.body,
  },
  macros: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  macrosNote: {
    ...type.caption,
    fontSize: 12,
    color: colors.muted2,
    textAlign: 'center',
  },
  build: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  savedCard: {
    gap: spacing.md,
    backgroundColor: colors.healthyBg,
    borderRadius: radius.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  savedLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  savedText: {
    ...type.caption,
    flex: 1,
    fontSize: 13,
    color: colors.tealDark,
  },
  buildTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  buildHint: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.muted2,
    marginTop: -6,
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.sand,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  sizeRowOn: {
    borderColor: colors.teal,
    backgroundColor: colors.white,
  },
  sizeTile: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.healthyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeTileOn: {
    backgroundColor: colors.teal,
  },
  sizeText: {
    flex: 1,
    gap: 2,
  },
  sizeName: {
    ...type.title,
    fontSize: 15,
    color: colors.ink,
  },
  sizeServes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sizeServesText: {
    ...type.caption,
    fontSize: 12.5,
    color: colors.muted2,
  },
  sizePrice: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.muted2,
  },
  sizePriceOn: {
    fontFamily: fonts.bold,
    color: colors.tealText,
  },
  sizeMark: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeMarkOn: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  total: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.sand,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  totalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  totalLabel: {
    ...type.caption,
    flexShrink: 1,
    color: colors.muted,
  },
  totalValue: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.body,
  },
  totalRule: {
    height: 1,
    backgroundColor: colors.sandChip,
  },
  totalGrand: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  totalGrandValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.tealText,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.healthyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnOff: {
    backgroundColor: colors.sandChip,
  },
  stepCount: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    minWidth: 26,
    textAlign: 'center',
    includeFontPadding: false,
  },
  // PricePill aligns itself to the top of a column by default; in this row it
  // has to sit on the stepper's centre line.
  ctaPrice: {
    alignSelf: 'center',
  },
  cta: {
    flex: 1,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The buy row is a row, so its button flexes across it. On its own in the
  // bar there is nothing to flex against — a column parent gives a flex child
  // no height at all, which is how the label ended up invisible.
  ctaWide: {
    flex: 0,
    alignSelf: 'stretch',
    marginBottom: spacing.xs,
  },
  ctaPrimary: {
    backgroundColor: colors.gold,
    paddingVertical: 15,
    ...shadow.cta,
  },
  ctaPrimaryText: {
    fontFamily: fonts.bold,
    fontSize: 16.5,
    color: colors.white,
  },
});
