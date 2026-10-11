import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Button from '../components/Button';
import MacroRow from '../components/MacroRow';
import PatternFill from '../components/PatternFill';
import PressScale from '../components/PressScale';
import Stepper from '../components/Stepper';
import { colors, fonts, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { ingredientLabel } from '../i18n/orderText';
import { formatPrice, groupNumber } from '../data/menu';
import {
  BUILT_MEAL_ID,
  gramsOf,
  gramsRange,
  ingredientGroups,
  ingredientPriceAt,
  isCompleteMeal,
  mealMacros,
  mealPrice,
} from '../data/ingredients';
import { useCart } from '../state/CartContext';
import type { TabScreenProps } from '../navigation/RootNavigator';

const STEP_MS = 260;

// Ticking a part on grows a grams control under it, which is a height change —
// the cards below slide down rather than jumping.
const GRAMS_PANEL = LayoutAnimation.create(
  180,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity,
);

// Building a meal is a sequence, not a form: base, then what goes on it, then
// what goes round it. One question per screen, so the customer is choosing
// between four things they can see rather than scanning thirty they cannot.
export default function MenuScreen({ navigation }: TabScreenProps<'Menu'>) {
  const { t, lang, isRTL } = useLanguage();
  const { addItem } = useCart();

  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  // Only the parts the customer moved off the kitchen's default weight. An
  // absent entry means "as the kitchen packs it", so the meal carries only what
  // was actually changed.
  const [grams, setGrams] = useState<Record<string, number>>({});
  // Every step is rendered, side by side, and the row is what moves. Fading one
  // step out and the next in leaves an instant with nothing on screen, and no
  // curve makes that read as anything but a flash — so nothing fades: the step
  // you are leaving is still there, travelling off, while the next arrives.
  const { width } = useWindowDimensions();
  const dir = isRTL ? 1 : -1;
  const pos = useRef(new Animated.Value(0)).current;

  // The row is positioned in points, so a rotation would leave it parked on the
  // old width. Re-anchored on width alone — depending on `step` here would snap
  // the row to its target on the same frame `go` starts animating it, which is
  // the animation gone.
  const at = useRef(step);
  at.current = step;
  useEffect(() => {
    pos.setValue(at.current * width * dir);
  }, [width, dir, pos]);

  const group = ingredientGroups[step];
  const last = step === ingredientGroups.length - 1;
  const chosenHere = group.items.filter((item) => picked.includes(item.id));

  const total = mealPrice(picked, grams);
  const ready = isCompleteMeal(picked);
  const macros = mealMacros(picked, grams);

  // The parts in the order they are chosen in, which is the order the box is
  // packed in — base first, then what sits on it.
  const inBox = ingredientGroups.flatMap((g) => g.items.filter((i) => picked.includes(i.id)));

  // The weight on the meal right now: what the customer set, or the amount the
  // kitchen packs if they never touched it.
  const weightOf = (id: string) => grams[id] ?? gramsOf(id);

  // Each part names its weight wherever it is listed, so the price beside it
  // has a reason. Pieces — a samoon, an egg — stay named on their own.
  const partLabel = (id: string) => ingredientLabel(id, weightOf(id), t);

  // Taking a part off drops its weight with it, so putting it back later starts
  // from the kitchen's amount again rather than from a figure set on a choice
  // the customer then reversed.
  const toggle = (id: string) => {
    LayoutAnimation.configureNext(GRAMS_PANEL);
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    setGrams((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const changeGrams = (id: string, next: number) => {
    const { min, max, step: by } = gramsRange(id);
    // Land on the part's own step and inside what the kitchen will weigh, so a
    // held-down button cannot walk the figure past either end.
    const snapped = Math.min(max, Math.max(min, Math.round(next / by) * by));
    setGrams((prev) => {
      const out = { ...prev };
      if (snapped === gramsOf(id)) delete out[id];
      else out[id] = snapped;
      return out;
    });
  };

  // The step leaves the way the customer is going and the next one comes in
  // from the far side, which is the only cue that says "same task, next part".
  const go = (delta: number) => {
    const next = step + delta;
    if (next < 0 || next > ingredientGroups.length - 1) return;
    // The index commits as the movement starts: the step it is moving to is
    // already on screen, so the counter and the bar have nothing to wait for.
    setStep(next);
    Animated.timing(pos, {
      toValue: next * width * dir,
      duration: STEP_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // The meal stays built after it is sent to the cart. Clearing it left the
  // page saying step one with the row still parked on step five, and a customer
  // coming back from the cart to add a second one had to build it twice.
  const add = () => {
    addItem(BUILT_MEAL_ID, 1, {
      // The weights are part of what makes two built meals different: 200g of
      // kebab and 350g of it are not the same line on the kitchen's docket, so
      // they cannot collapse into one.
      key: picked
        .slice()
        .sort()
        .map((id) => `${id}@${weightOf(id)}`)
        .join('+'),
      label: inBox.map((item) => partLabel(item.id)).join(' + '),
      unit: total,
    });
    navigation.navigate('Cart');
  };

  return (
    /* No bottom edge: the tab bar underneath already pads itself past the home
       indicator, so insetting here too left a band of dead cream under the
       step buttons — space the row of choices above them wants. */
    <Screen scroll={false} edges={['top', 'left', 'right']} texture>
      {/* The box being packed, kept in view: it is the only thing on this tab
          that says what the customer is actually making. */}
      <View style={[styles.box, shadow.raised]}>
        <PatternFill opacity={0.45} />

        <View style={styles.boxText}>
          <Text style={styles.boxTitle}>{t('build.title')}</Text>
          <Text style={styles.boxSub} numberOfLines={2}>
            {inBox.length > 0
              ? inBox.map((item) => partLabel(item.id)).join(' + ')
              : t('build.subtitle')}
          </Text>
        </View>

        {/* The box travels with the customer through every step, so the meal's
            nutrition belongs on it rather than on a summary at the end: the
            figures move as each part goes in, which is when a choice about them
            can still be made. */}
        {picked.length > 0 ? (
          <View style={styles.boxMacros}>
            <MacroRow macros={macros} size="sm" onDark />
          </View>
        ) : null}

        {/* One segment per part of the meal, filled as it is answered — a bar
            the customer can count, rather than a percentage. */}
        <View style={styles.track}>
          {ingredientGroups.map((g, i) => (
            <View
              key={g.id}
              style={[
                styles.segment,
                i <= step && styles.segmentDone,
                i === step && styles.segmentNow,
              ]}
            />
          ))}
        </View>

        <View style={styles.boxFoot}>
          <Text style={styles.stepLabel}>
            {t('builder.step')
              .replace('{n}', formatNumber(step + 1))
              .replace('{total}', formatNumber(ingredientGroups.length))}
          </Text>
          <Text style={styles.boxTotal}>{formatPrice(groupNumber(total), lang)}</Text>
        </View>
      </View>

      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.row,
            { width: width * ingredientGroups.length, transform: [{ translateX: pos }] },
          ]}
        >
          {ingredientGroups.map((g, i) => (
            <View key={g.id} style={{ width }} pointerEvents={i === step ? 'auto' : 'none'}>
              <View style={styles.stepHead}>
                <View style={styles.stepTile}>
                  <Icon path={icons[g.icon]} size={19} color={colors.teal} strokeWidth={1.9} />
                </View>
                <View style={styles.stepText}>
                  <Text style={styles.stepTitle}>{t(`ing.${g.id}`)}</Text>
                  <Text style={styles.stepSub}>
                    {t(g.required ? 'build.required' : 'build.optional')}
                  </Text>
                </View>
              </View>

              <ScrollView
                contentContainerStyle={styles.grid}
                showsVerticalScrollIndicator={false}
                scrollEnabled={i === step}
              >
                {g.items.map((item) => {
                  const on = picked.includes(item.id);
                  const weight = weightOf(item.id);
                  const range = gramsRange(item.id);
                  return (
                    <View key={item.id} style={styles.cardWrap}>
                      <PressScale
                        onPress={() => toggle(item.id)}
                        scaleTo={0.97}
                        accessibilityLabel={t(`ing.${item.id}`)}
                        accessibilityState={{ selected: on }}
                        style={[styles.card, on && styles.cardOn, shadow.card]}
                      >
                        {/* The parts of a meal are told apart by sight before
                            they are told apart by name — white rice against
                            red — so each card carries its own photograph. */}
                        <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
                        <Text style={styles.cardName} numberOfLines={2}>
                          {t(`ing.${item.id}`)}
                        </Text>
                        <Text style={[styles.cardPrice, on && styles.cardPriceOn]}>
                          {formatPrice(groupNumber(ingredientPriceAt(item.id, grams[item.id])), lang)}
                        </Text>

                        {on ? (
                          <View style={styles.cardMark}>
                            <Icon
                              path={icons.check}
                              size={11}
                              color={colors.white}
                              strokeWidth={3}
                            />
                          </View>
                        ) : null}
                      </PressScale>

                      {/* The weight only matters once the part is in the box,
                          and the price follows the food — so the control
                          arrives with the choice rather than sitting there
                          greyed out beforehand. */}
                      {on && item.byWeight ? (
                        <Stepper
                          compact
                          value={weight}
                          suffix={t('detail.gram')}
                          onDecrement={() => changeGrams(item.id, weight - range.step)}
                          onIncrement={() => changeGrams(item.id, weight + range.step)}
                          canDecrement={weight > range.min}
                          canIncrement={weight < range.max}
                          style={styles.cardGrams}
                        />
                      ) : null}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          ))}
        </Animated.View>
      </View>

      <View style={styles.bar}>
        {step > 0 ? (
          <Button
            label={t('builder.prev')}
            variant="outline"
            size="md"
            onPress={() => go(-1)}
            style={styles.back}
          />
        ) : null}

        {last ? (
          <Button
            label={ready ? t('build.add') : t('build.needBoth')}
            variant="primary"
            size="md"
            full
            disabled={!ready}
            onPress={add}
            style={styles.next}
          />
        ) : (
          <Button
            // A required step with nothing chosen has no next; an optional one
            // says so rather than pretending the button is broken.
            label={
              group.required || chosenHere.length > 0 ? t('builder.next') : t('build.skip')
            }
            variant="primary"
            size="md"
            full
            disabled={group.required && chosenHere.length === 0}
            onPress={() => go(1)}
            style={styles.next}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.tealDark,
    borderRadius: radius.xl,
    marginHorizontal: spacing.huge,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxl,
    gap: spacing.xl,
  },
  boxText: {
    gap: 2,
  },
  boxMacros: {
    borderTopWidth: 1,
    borderTopColor: overlay.white16,
    paddingTop: spacing.lg,
  },
  boxTitle: {
    ...type.h3,
    color: colors.white,
  },
  boxSub: {
    ...type.caption,
    color: overlay.white75,
  },
  track: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: overlay.white16,
  },
  segmentDone: {
    backgroundColor: colors.goldLight,
  },
  segmentNow: {
    backgroundColor: colors.white,
  },
  boxFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  stepLabel: {
    ...type.caption,
    fontSize: 12,
    color: overlay.white75,
  },
  boxTotal: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.white,
  },
  stage: {
    flex: 1,
    paddingTop: spacing.xxl,
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stepHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.xl,
  },
  stepTile: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.healthyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    gap: 1,
  },
  stepTitle: {
    ...type.h3,
    color: colors.ink,
  },
  stepSub: {
    ...type.caption,
    color: colors.muted2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.xxl,
  },
  // The card and its grams control are one column: the width lives out here so
  // the control sits exactly as wide as the card it belongs to.
  cardWrap: {
    width: '47.5%',
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.sand,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  cardOn: {
    borderColor: colors.teal,
    backgroundColor: colors.white,
  },
  cardImage: {
    width: '100%',
    height: 76,
    borderRadius: radius.sm,
    backgroundColor: colors.healthyBg,
  },
  cardGrams: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.sand,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cardName: {
    ...type.title,
    fontSize: 14.5,
    color: colors.ink,
  },
  cardPrice: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.muted2,
  },
  cardPriceOn: {
    fontFamily: fonts.bold,
    color: colors.tealText,
  },
  cardMark: {
    position: 'absolute',
    top: spacing.lg,
    end: spacing.lg,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Kept tight: every point this bar takes is a point off the row of choices
  // above it, and the choices are what the customer came here to make.
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.sandChip,
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  back: {
    paddingHorizontal: spacing.xl,
  },
  next: {
    flex: 1,
  },
});
