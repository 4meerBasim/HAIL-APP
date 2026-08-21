import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Button from '../components/Button';
import { colors, fonts, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { DIAL_CODE, formatPhone, normalizePhone, phoneValid, samePhone } from '../data/phone';
import { useAuth } from '../state/AuthContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const CODE_LENGTH = 4;

export default function AddPhoneScreen({ navigation, route }: RootStackScreenProps<'AddPhone'>) {
  const { t, isRTL } = useLanguage();
  const { phones, requestOtp, attachPendingPhone } = useAuth();
  const asPrimary = route.params?.asPrimary ?? false;

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<'duplicate' | 'code' | null>(null);

  const ready = phoneValid(phone);

  // Caught before the code step rather than after it: sending someone through a
  // verification they cannot pass is the worse of the two failures.
  const onSend = () => {
    if (phones.some((p) => samePhone(p, phone))) {
      setError('duplicate');
      return;
    }
    requestOtp(normalizePhone(phone));
    setSent(true);
    setError(null);
  };

  const onVerify = () => {
    if (attachPendingPhone(code, asPrimary)) navigation.goBack();
    else setError('code');
  };

  // 'auto' resolves against the paragraph's writing direction; a physical
  // 'right' would be mirrored back to the left by RN's RTL swap.
  const readingSide = { textAlign: 'auto', writingDirection: isRTL ? 'rtl' : 'ltr' } as const;

  // A dial code and its number read left-to-right in any language, so the row
  // order is reversed back under RTL to keep +964 leading.
  const phoneRowSide = { flexDirection: isRTL ? 'row-reverse' : 'row' } as const;

  return (
    <Screen scroll={false} texture>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => (sent ? setSent(false) : navigation.goBack())}
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
          <Text style={styles.title}>{t(asPrimary ? 'phones.change' : 'phones.add')}</Text>
          <Text style={styles.subtitle}>
            {t(asPrimary ? 'phones.change.sub' : 'phones.add.sub')}
          </Text>
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
          {sent ? (
            <>
              <View style={styles.field}>
                <Text style={[styles.label, readingSide]}>{t('login.codeSent')}</Text>
                <Text style={[styles.sentTo, readingSide]}>
                  {formatNumber(formatPhone(phone))}
                </Text>
                <TextInput
                  value={code}
                  onChangeText={(v) => {
                    setCode(v.replace(/\D/g, '').slice(0, CODE_LENGTH));
                    setError(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  autoFocus
                  placeholder="••••"
                  placeholderTextColor={colors.faint}
                  accessibilityLabel={t('login.codeHint')}
                  style={[styles.input, styles.codeInput, error === 'code' && styles.inputError]}
                />
                {error === 'code' ? (
                  <Text style={[styles.error, readingSide]}>{t('login.codeError')}</Text>
                ) : null}
              </View>

              <Button
                label={t('common.continue')}
                variant="primary"
                size="lg"
                full
                disabled={code.length !== CODE_LENGTH}
                onPress={onVerify}
              />
            </>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={[styles.label, readingSide]}>{t('login.phoneLabel')}</Text>
                <View style={[styles.phoneRow, phoneRowSide]}>
                  <View style={styles.prefix}>
                    <Text style={styles.prefixText}>{DIAL_CODE}</Text>
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={(v) => {
                      setPhone(v);
                      setError(null);
                    }}
                    keyboardType="phone-pad"
                    autoFocus
                    placeholder="770 000 0000"
                    placeholderTextColor={colors.faint}
                    accessibilityLabel={t('login.phoneLabel')}
                    style={[
                      styles.input,
                      styles.phoneInput,
                      error === 'duplicate' && styles.inputError,
                    ]}
                  />
                </View>
                {error === 'duplicate' ? (
                  <Text style={[styles.error, readingSide]}>{t('phones.duplicate')}</Text>
                ) : null}
              </View>

              <Button
                label={t('common.continue')}
                variant="primary"
                size="lg"
                full
                disabled={!ready}
                onPress={onSend}
              />
            </>
          )}

          <Text style={[styles.note, readingSide]}>{t('phones.verifyNote')}</Text>
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
  field: {
    gap: spacing.sm,
  },
  label: {
    ...type.captionStrong,
    color: colors.muted,
  },
  sentTo: {
    ...type.bodyStrong,
    color: colors.ink,
    writingDirection: 'ltr',
  },
  phoneRow: {
    gap: spacing.md,
  },
  prefix: {
    borderRadius: radius.control,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.sand,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
  },
  prefixText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'center',
    writingDirection: 'ltr',
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
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  phoneInput: {
    flex: 1,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 14,
    fontSize: 24,
  },
  inputError: {
    borderColor: colors.coral,
  },
  error: {
    ...type.caption,
    color: colors.coral,
  },
  note: {
    ...type.caption,
    color: colors.muted2,
  },
});
