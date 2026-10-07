import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { count } from '../i18n/count';
import {
  DELIVERY_FEE,
  DELIVERY_MINUTES,
  type DropChoice,
  type PaymentMethod,
  SERVICE_FEE,
  dropKeys,
  formatPrice,
  groupNumber,
  isPaymentMethod,
  parsePrice,
  paymentMethods,
} from '../data/menu';
import { BUILT_MEAL_ID } from '../data/ingredients';
import { type StoredCard, brandLabel } from '../data/card';
import { useCart } from '../state/CartContext';
import { useOrders } from '../state/OrdersContext';
import { useLocations } from '../state/LocationContext';
import { usePlan } from '../state/PlanContext';
import { useAuth } from '../state/AuthContext';
import { useStoredState } from '../state/useStoredState';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import CartItemCard from '../components/CartItemCard';
import CartRow, { type CartItem } from '../components/CartRow';
import DashedRule from '../components/DashedRule';
import Button from '../components/Button';
import Dialog from '../components/Dialog';
import LocationPicker from '../components/LocationPicker';
import MapPreview from '../components/MapPreview';
import PressScale from '../components/PressScale';
import { RootStackScreenProps } from '../navigation/RootNavigator';

// A subscriber pays less for anything ordered outside the plan — the one
// discount the app can work out for itself from what it already knows.
const SUBSCRIBER_RATE = 0.1;
// Long enough for a gate code and a landmark, short enough that the kitchen
// reads it.
const NOTE_MAX = 200;

export default function CartScreen({ navigation }: RootStackScreenProps<'Cart'>) {
  const { t, lang, isRTL } = useLanguage();
  const { items, changeQty, clearCart, subtotal } = useCart();
  const { placeOrder } = useOrders();
  const { status } = useAuth();
  const { selected, hydrated: locHydrated } = useLocations();
  const { subscription } = usePlan();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Starts on the default chosen under Profile → Payments, and only that: a
  // pick made here is for this order. Read rather than copied into state, so
  // the stored value landing after first render still takes effect.
  const [storedPayment] = useStoredState<string>('@hail/payment-method', 'cash');
  const [picked, setPayment] = useState<PaymentMethod | null>(null);
  const payment: PaymentMethod = picked ?? (isPaymentMethod(storedPayment) ? storedPayment : 'cash');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [emptying, setEmptying] = useState(false);
  const [note, setNote] = useState('');
  const [why, setWhy] = useState<'delivery' | 'service' | null>(null);
  const [noteOn, setNoteOn] = useState(false);
  const [drop, setDrop] = useStoredState<DropChoice>('@hail/drop', 'hand');
  const [card, , reloadCard] = useStoredState<StoredCard | null>('@hail/card', null);

  // The card sheet sends the customer to AddCard, which pops straight back here
  // with the cart still mounted — re-read the card or confirm keeps asking for one.
  useEffect(() => navigation.addListener('focus', reloadCard), [navigation, reloadCard]);

  const readingSide = { textAlign: 'auto', writingDirection: isRTL ? 'rtl' : 'ltr' } as const;
  const chevron = isRTL ? icons.chevronLeft : icons.chevronRight;

  const qty = items.reduce((sum, it) => sum + it.qty, 0);
  const discount = subscription ? Math.round((subtotal * SUBSCRIBER_RATE) / 250) * 250 : 0;
  const total = subtotal - discount + DELIVERY_FEE + SERVICE_FEE;

  // Stepping the only line down to zero empties the cart, which is a bigger
  // move than "one fewer" — so it is asked rather than done.
  const onDec = (id: string, itemQty: number) => {
    if (items.length === 1 && itemQty <= 1) {
      setEmptying(true);
      return;
    }
    changeQty(id, -1);
  };

  // A meal assembled on the Menu tab has no page of its own — its parts live
  // only in this line's build key, so the key is what reopens it, read-only.
  // Every other line is a real dish already on the menu and opens nothing from
  // here. Shared, because the cart draws one line as a row and several as
  // cards, and the built meal is far more often the only thing in the basket.
  const openBuilt = (it: CartItem): (() => void) | undefined =>
    it.dishId === BUILT_MEAL_ID
      ? () =>
          navigation.navigate('DishDetail', {
            id: it.dishId,
            built: it.id.slice(it.id.indexOf('|') + 1),
          })
      : undefined;

  // Confirming is what creates the order — Orders and Tracking have nothing to
  // show until this runs, so it has to record the cart before navigating away.
  //
  // The stack is rebuilt rather than pushed onto: the cart the customer just
  // emptied is behind tracking otherwise, and backing out of a live order onto
  // an empty basket is a dead end. Back from here is the app itself.
  const confirm = () => {
    // Same gate as Subscribe and Catering: a guest can fill a basket, but the
    // order needs a number to deliver to.
    if (status !== 'authed') {
      navigation.navigate('Login');
      return;
    }
    // An order needs somewhere to go: with no saved address, send the customer
    // to pick one before the order is placed rather than after. Until location
    // storage has hydrated, `null` means "not loaded yet", not "no address" —
    // so we wait rather than bounce a customer who does have one.
    if (!selected) {
      if (locHydrated) navigation.navigate('Map');
      return;
    }
    // A card payment with no card on file has nothing to charge — ask for one first.
    if (payment === 'card' && !card) {
      setCardOpen(true);
      return;
    }
    placeOrder(
      items.map((it) => ({
        dishId: it.dishId,
        qty: it.qty,
        unit: parsePrice(it.price),
        build: it.build,
      })),
      { note, drop, payment, charges: { discount, delivery: DELIVERY_FEE, service: SERVICE_FEE } },
    );
    clearCart();
    navigation.reset({
      index: 1,
      routes: [{ name: 'Tabs', params: { screen: 'Plans' } }, { name: 'Tracking' }],
    });
  };

  const money = (n: number) => formatPrice(groupNumber(n), lang);

  return (
    <Screen edges={['top', 'left', 'right']} texture>
      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backBtn, shadow.card]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              hitSlop={8}
            >
              <Icon
                path={isRTL ? icons.chevronRight : icons.chevronLeft}
                size={14}
                color={colors.ink}
                strokeWidth={2.4}
              />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t('cart.title')}</Text>
              {qty > 0 ? (
                <Text style={styles.subtitle}>{count('count.items', qty, t)}</Text>
              ) : null}
            </View>
          </View>

          {/* One line reads as a row; several read as a shelf. Sliding them
              sideways is what keeps the address, the payment and the total on
              the same screen as the food. */}
          {items.length === 0 ? (
            <Text style={styles.emptyItems}>{t('cart.empty')}</Text>
          ) : items.length === 1 ? (
            <CartRow
              item={items[0]}
              onInc={() => changeQty(items[0].id, 1)}
              onDec={() => onDec(items[0].id, items[0].qty)}
              onOpen={openBuilt(items[0])}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.shelf}
              contentContainerStyle={styles.shelfBody}
            >
              {items.map((it) => (
                <CartItemCard
                  key={it.id}
                  item={it}
                  width={width * 0.44}
                  onInc={() => changeQty(it.id, 1)}
                  onDec={() => onDec(it.id, it.qty)}
                  onOpen={openBuilt(it)}
                />
              ))}
            </ScrollView>
          )}

          {/* Where it is going, when it lands, and what the driver should do
              when it does — one card, because it is one question. */}
          <Card padding={0} style={styles.mapCard}>
            {/* A drawn pin is only honest once there is a place it points at —
                with no address set, the card is the prompt to add one. */}
            {selected ? (
              <PressScale
                onPress={() => navigation.navigate('Map')}
                scaleTo={0.99}
                accessibilityLabel={t('location.openMap')}
              >
                <MapPreview />
              </PressScale>
            ) : null}

            <View style={styles.mapBody}>
              <View style={styles.addressRow}>
                <View style={styles.addressText}>
                  <Text style={[styles.addressTitle, readingSide]} numberOfLines={1}>
                    {selected ? selected.label || t('location.pinned') : t('location.add')}
                  </Text>
                  <Text style={[styles.addressSub, readingSide]} numberOfLines={2}>
                    {selected?.address ?? t('location.openMap.sub')}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => setPickerOpen(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('location.deliverTo')}
                >
                  <Text style={styles.changeLink}>
                    {selected ? t('common.change') : t('common.add')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.etaRow}>
                <Icon path={icons.clock} size={14} color={colors.tealText} strokeWidth={2} />
                <Text style={styles.etaLabel}>{t('cart.eta')}</Text>
                <Text style={styles.etaValue}>
                  {t('cart.eta.value')
                    .replace('{a}', formatNumber(DELIVERY_MINUTES[0]))
                    .replace('{b}', formatNumber(DELIVERY_MINUTES[1]))}
                </Text>
              </View>

              <View style={styles.dropBlock}>
                <Text style={[styles.dropLabel, readingSide]}>{t('cart.drop')}</Text>
                <View style={styles.dropRow}>
                  {dropKeys.map((key) => {
                    const on = drop === key;
                    return (
                      <PressScale
                        key={key}
                        onPress={() => setDrop(key)}
                        scaleTo={0.96}
                        accessibilityLabel={t(`drop.${key}`)}
                        accessibilityState={{ selected: on }}
                        style={[styles.drop, on && styles.dropOn]}
                      >
                        <Text style={[styles.dropText, on && styles.dropTextOn]} numberOfLines={2}>
                          {t(`drop.${key}`)}
                        </Text>
                      </PressScale>
                    );
                  })}
                </View>
              </View>
            </View>
          </Card>

          <Card style={styles.block}>
            <Text style={[styles.blockLabel, readingSide]}>{t('cart.payment')}</Text>

            {paymentMethods.map((method) => {
              const on = payment === method;
              return (
                <TouchableOpacity
                  key={method}
                  style={[styles.payOption, on ? styles.payOptionOn : null]}
                  activeOpacity={0.85}
                  onPress={() => setPayment(method)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <View style={[styles.radio, on && styles.radioOn]} />
                  <View style={styles.payText}>
                    <Text style={[styles.payTitle, readingSide]}>
                      {t(`cart.pay.${method}.title`)}
                    </Text>
                    <Text style={[styles.paySub, readingSide]} numberOfLines={1}>
                      {method !== 'card'
                        ? t(`cart.pay.${method}.sub`)
                        : card
                          ? `${brandLabel[card.brand]} •••• ${formatNumber(card.last4)}`
                          : t('cart.card.none')}
                    </Text>
                  </View>

                  {/* The card the money would come off, one tap away — asking the
                      customer to remember it, or to leave for Payments to check,
                      is the friction that loses the order. */}
                  {method === 'card' ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setCardOpen(true)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel={t('cart.card.title')}
                      style={styles.info}
                    >
                      <Icon path={icons.exclaim} size={13} color={colors.tealText} strokeWidth={2.4} />
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </Card>

          {/* Fees on an empty basket would be a bill for nothing — the price
              only appears once there is something to price. */}
          {items.length > 0 ? (
            <Card style={styles.block}>
              <Text style={[styles.blockLabel, readingSide]}>{t('cart.priceDetails')}</Text>

              <View style={styles.line}>
                <Text style={styles.lineLabel}>{t('cart.subtotal')}</Text>
                <Text style={styles.lineValue}>{money(subtotal)}</Text>
              </View>

              {/* Shown only when there is one: a permanent "0 discount" line is a
                  reminder that the customer is not getting anything. */}
              {discount > 0 ? (
                <View style={styles.line}>
                  <Text style={[styles.lineLabel, styles.saveLabel]}>{t('cart.discount')}</Text>
                  <Text style={[styles.lineValue, styles.saveValue]}>{`− ${money(discount)}`}</Text>
                </View>
              ) : null}

              {/* A charge the customer did not choose should be able to say what
                  it is for, on the line where it appears. */}
              <View style={styles.line}>
                <View style={styles.lineWhy}>
                  <Text style={styles.lineLabel}>{t('cart.delivery')}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setWhy('delivery')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={t('cart.why')}
                    style={styles.why}
                  >
                    <Icon path={icons.exclaim} size={10} color={colors.muted} strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.lineValue}>{money(DELIVERY_FEE)}</Text>
              </View>

              <View style={styles.line}>
                <View style={styles.lineWhy}>
                  <Text style={styles.lineLabel}>{t('cart.service')}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setWhy('service')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={t('cart.why')}
                    style={styles.why}
                  >
                    <Icon path={icons.exclaim} size={10} color={colors.muted} strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.lineValue}>{money(SERVICE_FEE)}</Text>
              </View>

              <DashedRule />

              <View style={styles.line}>
                <Text style={styles.grandLabel}>{t('cart.total')}</Text>
                <Text style={styles.grandValue}>{money(total)}</Text>
              </View>
            </Card>
          ) : null}

          <Card style={styles.block}>
            <View style={styles.noteHead}>
              <View style={styles.noteTile}>
                <Icon path={icons.chat} size={16} color={colors.teal} strokeWidth={1.9} />
              </View>
              <View style={styles.noteHeadText}>
                <Text style={[styles.blockLabel, readingSide]}>{t('cart.note')}</Text>
                <Text style={[styles.noteHint, readingSide]}>{t('cart.note.sub')}</Text>
              </View>
            </View>

            <View style={[styles.noteField, noteOn && styles.noteFieldOn]}>
              <TextInput
                value={note}
                onChangeText={setNote}
                onFocus={() => setNoteOn(true)}
                onBlur={() => setNoteOn(false)}
                placeholder={t('cart.note.hint')}
                placeholderTextColor={colors.faint}
                multiline
                maxLength={NOTE_MAX}
                accessibilityLabel={t('cart.note')}
                // 'auto' plus the language's writing direction, not a physical
                // side: under forceRTL a physical 'right' is mirrored back to
                // the left, which is the bug the old ternary had in Arabic.
                style={[styles.noteInput, readingSide]}
              />
              <Text style={styles.noteCount}>
                {`${formatNumber(note.length)} / ${formatNumber(NOTE_MAX)}`}
              </Text>
            </View>
          </Card>
        </ScrollView>

        {/* An empty cart has nothing to confirm and nothing to total — a dead
            button and a bill for fees alone read as something broken rather
            than as nothing to do. */}
        {items.length > 0 ? (
          <View
            style={[styles.sheet, shadow.sheet, { paddingBottom: Math.max(36, insets.bottom + 16) }]}
          >
            <View style={styles.sheetTop}>
              <Text style={styles.sheetLabel}>{t('cart.total')}</Text>
              <Text style={styles.sheetTotal}>{money(total)}</Text>
            </View>

            <Button
              label={t('cart.confirm')}
              variant="primary"
              size="lg"
              full
              trailing={chevron}
              onPress={confirm}
              style={[styles.cta, shadow.cta]}
            />
          </View>
        ) : null}
      </View>

      <LocationPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onOpenMap={() => {
          setPickerOpen(false);
          navigation.navigate('Map');
        }}
      />

      <Dialog
        visible={cardOpen}
        title={t('cart.card.title')}
        message={
          card
            ? `${brandLabel[card.brand]} •••• ${formatNumber(card.last4)}\n${card.holder} · ${card.expiry}`
            : t('cart.card.none.long')
        }
        primaryLabel={card ? t('cart.card.change') : t('cart.card.add')}
        onPrimary={() => {
          setCardOpen(false);
          navigation.navigate(card ? 'Payments' : 'AddCard');
        }}
        secondaryLabel={t('common.close')}
        onSecondary={() => setCardOpen(false)}
        onClose={() => setCardOpen(false)}
      />

      <Dialog
        visible={why !== null}
        title={t(`cart.why.${why ?? 'delivery'}`)}
        message={t(`cart.why.${why ?? 'delivery'}.body`)}
        primaryLabel={t('common.close')}
        onPrimary={() => setWhy(null)}
        onClose={() => setWhy(null)}
      />

      <Dialog
        visible={emptying}
        title={t('cart.removeLast.title')}
        message={t('cart.removeLast.message')}
        primaryLabel={t('common.cancel')}
        onPrimary={() => setEmptying(false)}
        secondaryLabel={t('cart.removeLast.confirm')}
        onSecondary={() => {
          setEmptying(false);
          clearCart();
          navigation.navigate('Tabs', { screen: 'Plans' });
        }}
        onClose={() => setEmptying(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flexShrink: 1,
    gap: 1,
  },
  title: {
    ...type.h1,
    color: colors.ink,
  },
  subtitle: {
    ...type.caption,
    color: colors.muted2,
  },
  emptyItems: {
    ...type.body,
    color: colors.muted2,
    textAlign: 'center',
    paddingVertical: spacing.giant,
  },
  // Bleeds past the page padding so the shelf runs to both edges and reads as
  // something that slides. The vertical bleed is not decoration: a ScrollView
  // clips to its own bounds, so without it the cards' shadows were cut off flat
  // along the top and bottom of every card.
  shelf: {
    marginHorizontal: -spacing.huge,
    marginVertical: -spacing.lg,
  },
  shelfBody: {
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  mapCard: {
    overflow: 'hidden',
  },
  mapBody: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  addressText: {
    flex: 1,
    gap: 2,
  },
  addressTitle: {
    ...type.title,
    fontSize: 15,
    color: colors.ink,
  },
  addressSub: {
    ...type.caption,
    color: colors.muted2,
  },
  changeLink: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.tealText,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.healthyBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  etaLabel: {
    ...type.caption,
    flex: 1,
    color: colors.tealText,
  },
  etaValue: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.tealDark,
  },
  dropBlock: {
    gap: spacing.md,
  },
  dropLabel: {
    ...type.captionStrong,
    color: colors.muted,
  },
  dropRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  drop: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.sand,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropOn: {
    borderColor: colors.teal,
    backgroundColor: colors.healthyBg,
  },
  dropText: {
    ...type.caption,
    fontSize: 12,
    color: colors.body,
    textAlign: 'center',
  },
  dropTextOn: {
    fontFamily: fonts.bold,
    color: colors.tealDark,
  },
  block: {
    gap: spacing.lg,
  },
  blockLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.sand,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  payOptionOn: {
    borderColor: colors.teal,
    backgroundColor: colors.healthyBg,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.sand,
  },
  radioOn: {
    borderColor: colors.teal,
    borderWidth: 6,
  },
  payText: {
    flex: 1,
    gap: 1,
  },
  payTitle: {
    ...type.title,
    fontSize: 14.5,
    color: colors.ink,
  },
  paySub: {
    ...type.caption,
    fontSize: 12,
    color: colors.muted2,
  },
  info: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.tealText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  lineWhy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  why: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    borderColor: colors.faint2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineLabel: {
    ...type.caption,
    flexShrink: 1,
    color: colors.muted,
  },
  lineValue: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.body,
  },
  saveLabel: {
    color: colors.greenDark,
  },
  saveValue: {
    color: colors.greenDark,
  },
  grandLabel: {
    fontFamily: fonts.bold,
    fontSize: 15.5,
    color: colors.ink,
  },
  grandValue: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.tealText,
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  noteTile: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.healthyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteHeadText: {
    flex: 1,
    gap: 1,
  },
  noteHint: {
    ...type.caption,
    fontSize: 12,
    color: colors.muted2,
  },
  // The field carries the border, not the input: the counter sits inside it, so
  // the two have to look like one thing.
  noteField: {
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.sand,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  noteFieldOn: {
    borderColor: colors.teal,
    backgroundColor: colors.white,
  },
  noteInput: {
    minHeight: 62,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.ink,
    textAlignVertical: 'top',
    padding: 0,
  },
  noteCount: {
    ...type.caption,
    fontSize: 11,
    color: colors.faint,
    alignSelf: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  sheetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  sheetLabel: {
    ...type.caption,
    color: colors.muted,
  },
  sheetTotal: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.ink,
  },
  cta: {
    borderRadius: radius.md,
  },
});
