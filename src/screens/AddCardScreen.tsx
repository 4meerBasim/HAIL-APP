import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Text from '../components/AppText';
import AppTextInput from '../components/AppTextInput';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Button from '../components/Button';
import PaymentCard, { type CardField } from '../components/PaymentCard';
import { colors, ltrField, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useStoredState } from '../state/useStoredState';
import {
  type StoredCard,
  cvvLength,
  detectBrand,
  digitsOnly,
  expiryValid,
  formatExpiryInput,
  formatNumberInput,
  luhnValid,
  numberLength,
} from '../data/card';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

export default function AddCardScreen({ navigation }: RootStackScreenProps<'AddCard'>) {
  const { t, isRTL } = useLanguage();
  const [, setCard] = useStoredState<StoredCard | null>('@hail/card', null);
  const [, setMethod] = useStoredState('@hail/payment-method', 'cash');

  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [focused, setFocused] = useState<CardField | null>(null);
  const [touched, setTouched] = useState(false);

  const brand = useMemo(() => detectBrand(number), [number]);

  // Only what the device can know for certain: the full length for the brand,
  // a passing Luhn check (a transposed digit, the mistake people actually make),
  // an expiry that is a real month and not already past, and a CVV of the
  // brand's length. Whether the card is good is still the bank's answer — this
  // only stops one that cannot be.
  const complete =
    number.length === numberLength(brand) &&
    luhnValid(number) &&
    expiryValid(expiry, new Date()) &&
    cvv.length === cvvLength(brand);

  // Every field is kept as bare digits in state and formatted on the way out,
  // so a paste with spaces or dashes lands the same as typing does. The brand is
  // re-read from the incoming digits, not from state: the digit that decides
  // Amex from Visa is the same one that would otherwise be capped at the old
  // brand's length.
  const onNumber = (value: string) => {
    const raw = digitsOnly(value);
    const next = detectBrand(raw);
    setNumber(raw.slice(0, numberLength(next)));
    // An Amex CVV is four digits; leaving Amex would otherwise keep a fourth
    // digit the field can no longer show or delete past its new maxLength.
    setCvv((c) => c.slice(0, cvvLength(next)));
  };
  const onExpiry = (value: string) => setExpiry(digitsOnly(value).slice(0, 4));
  const onCvv = (value: string) => setCvv(digitsOnly(value).slice(0, cvvLength(brand)));

  const save = () => {
    setTouched(true);
    if (!complete) return;
    setCard({
      brand,
      last4: number.slice(-4),
      holder: holder.trim(),
      expiry: formatExpiryInput(expiry),
    });
    setMethod('card');
    navigation.goBack();
  };

  const field = (
    label: string,
    value: string,
    onChangeText: (v: string) => void,
    key: CardField,
    extra: {
      placeholder: string;
      maxLength?: number;
      keyboardType?: 'number-pad' | 'default';
      autoCapitalize?: 'none' | 'characters';
    },
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <AppTextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(key)}
        onBlur={() => setFocused((f) => (f === key ? null : f))}
        placeholder={extra.placeholder}
        placeholderTextColor={colors.faint}
        keyboardType={extra.keyboardType ?? 'number-pad'}
        maxLength={extra.maxLength}
        autoCapitalize={extra.autoCapitalize ?? 'none'}
        autoCorrect={false}
        accessibilityLabel={label}
        // Card details are Latin and left-to-right whatever the app language is.
        style={[styles.input, focused === key && styles.inputOn]}
      />
    </View>
  );

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
          <Icon
            path={isRTL ? icons.chevronRight : icons.chevronLeft}
            size={15}
            color={colors.ink}
            strokeWidth={2.4}
          />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('card.title')}</Text>
          <Text style={styles.subtitle}>{t('card.subtitle')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PaymentCard
            digits={number}
            holder={holder}
            expiry={expiry}
            cvv={cvv}
            brand={brand}
            focused={focused}
          />

          <View style={styles.form}>
            {field(
              t('card.number'),
              formatNumberInput(number, brand),
              onNumber,
              'number',
              { placeholder: '4242 4242 4242 4242', maxLength: 22 },
            )}

            {field(t('card.holder'), holder, setHolder, 'holder', {
              placeholder: t('card.holderPlaceholder'),
              keyboardType: 'default',
              autoCapitalize: 'characters',
              maxLength: 26,
            })}

            <View style={styles.row}>
              <View style={styles.flex}>
                {field(
                  t('card.expiry'),
                  formatExpiryInput(expiry),
                  onExpiry,
                  'expiry',
                  { placeholder: t('card.expiryPlaceholder'), maxLength: 5 },
                )}
              </View>
              <View style={styles.flex}>
                {field(t('card.cvv'), cvv, onCvv, 'cvv', {
                  placeholder: '•'.repeat(cvvLength(brand)),
                  maxLength: cvvLength(brand),
                })}
              </View>
            </View>
          </View>

          {touched && !complete ? <Text style={styles.error}>{t('card.invalid')}</Text> : null}

          <Text style={styles.note}>{t('card.securityNote')}</Text>

          <Button label={t('card.save')} variant="primary" size="lg" full onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  form: {
    gap: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    ...type.captionStrong,
    color: colors.muted,
  },
  input: {
    ...type.bodyStrong,
    color: colors.ink,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.sand,
    borderRadius: radius.control,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    ...ltrField,
  },
  inputOn: {
    borderColor: colors.teal,
  },
  error: {
    ...type.captionStrong,
    color: colors.coral,
  },
  note: {
    ...type.caption,
    color: colors.muted2,
  },
});
