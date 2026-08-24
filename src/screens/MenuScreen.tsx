import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import PatternFill from '../components/PatternFill';
import PressScale from '../components/PressScale';
import { colors, fonts, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { formatPrice, groupNumber } from '../data/menu';
import {
  BUILT_MEAL_ID,
  ingredientGroups,
  ingredientPrice,
  isCompleteMeal,
} from '../data/ingredients';
import { useCart } from '../state/CartContext';
import type { TabScreenProps } from '../navigation/RootNavigator';

const STEP_MS = 260;

// Building a meal is a sequence, not a form: base, then what goes on it, then
// what goes round it. One question per screen, so the customer is choosing
// between four things they can see rather than scanning thirty they cannot.
export default function MenuScreen({ navigation }: TabScreenProps<'Menu'>) {
  const { t, lang, isRTL } = useLanguage();
  const { addItem } = useCart();

  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
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

  const total = picked.reduce((sum, id) => sum + ingredientPrice(id), 0);
  const ready = isCompleteMeal(picked);

  // The parts in the order they are chosen in, which is the order the box is
  // packed in — base first, then what sits on it.
  const inBox = ingredientGroups.flatMap((g) => g.items.filter((i) => picked.includes(i.id)));

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

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
      key: picked.slice().sort().join('+'),
      label: inBox.map((item) => t(`ing.${item.id}`)).join(' + '),
      unit: total,
    });
    navigation.navigate('Cart');
  };

  return (
    <Screen scroll={false} texture>
      {/* The box being packed, kept in view: it is the only thing on this tab
          that says what the customer is actually making. */}
      <View style={[styles.box, shadow.raised]}>
        <PatternFill opacity={0.45} />

        <View style={styles.boxText}>
          <Text style={styles.boxTitle}>{t('build.title')}</Text>
          <Text style={styles.boxSub} numberOfLines={2}>
            {inBox.length > 0
              ? inBox.map((item) => t(`ing.${item.id}`)).join(' + ')
              : t('build.subtitle')}
          </Text>
        </View>

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
                  return (
                    <PressScale
                      key={item.id}
                      onPress={() => toggle(item.id)}
                      scaleTo={0.97}
                      accessibilityLabel={t(`ing.${item.id}`)}
                      accessibilityState={{ selected: on }}
                      style={[styles.card, on && styles.cardOn, shadow.card]}
                    >
                      <View style={[styles.cardTile, on && styles.cardTileOn]}>
                        <Icon
                          path={icons[g.icon]}
                          size={18}
                          color={on ? colors.white : colors.teal}
                          strokeWidth={1.9}
                        />
                      </View>
                      <Text style={styles.cardName} numberOfLines={2}>
                        {t(`ing.${item.id}`)}
                      </Text>
                      <Text style={[styles.cardPrice, on && styles.cardPriceOn]}>
                        {formatPrice(groupNumber(item.price), lang)}
                      </Text>

                      {on ? (
                        <View style={styles.cardMark}>
                          <Icon path={icons.check} size={11} color={colors.white} strokeWidth={3} />
                        </View>
                      ) : null}
                    </PressScale>
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
            size="lg"
            onPress={() => go(-1)}
            style={styles.back}
          />
        ) : null}

        {last ? (
          <Button
            label={ready ? t('build.add') : t('build.needBoth')}
            variant="primary"
            size="lg"
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
            size="lg"
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
  card: {
    width: '47.5%',
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
  cardTile: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.healthyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTileOn: {
    backgroundColor: colors.teal,
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
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.sandChip,
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  back: {
    paddingHorizontal: spacing.xxl,
  },
  next: {
    flex: 1,
  },
});
