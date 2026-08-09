import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Text from '../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { colors, fonts, overlay, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../state/AuthContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const GRADIENT_COLORS = [colors.tealDark, colors.teal, colors.tealMid] as const;
const CODE_LENGTH = 4;
const DIAL_CODE = '+964';

export default function LoginScreen({ navigation }: RootStackScreenProps<'Login'>) {
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { requestOtp, verifyOtp, continueAsGuest } = useAuth();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  const phoneReady = phone.replace(/\D/g, '').length >= 10;
  const codeReady = code.length === CODE_LENGTH;

  const onSend = () => {
    requestOtp(phone);
    setSent(true);
    setError(false);
  };

  const onVerify = () => {
    if (verifyOtp(code)) {
      navigation.replace('Onboarding');
    } else {
      setError(true);
    }
  };

  const onGuest = () => {
    continueAsGuest();
    navigation.replace('Tabs');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={[0, 0.62, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.18, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.ringTop} pointerEvents="none" />
      <View style={styles.ringSide} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.content, { paddingTop: insets.top, direction: isRTL ? 'rtl' : 'ltr' }]}
      >
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoGlyph}>{t('brand.glyph')}</Text>
          </View>
          <Text style={styles.title}>{t('brand.name')}</Text>
          <Text style={styles.wordmark}>{t('brand.wordmark')}</Text>
          <Text style={styles.tagline}>{t('brand.tagline')}</Text>
        </View>

        <View style={[styles.sheet, { paddingBottom: spacing.giant + insets.bottom }]}>
          {sent ? (
            <>
              <View style={styles.headingBlock}>
                <Text style={styles.heading}>{t('login.codeSent')}</Text>
                <Text style={styles.subheading}>{t('login.codeHint')}</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{phone}</Text>
                <TextInput
                  value={code}
                  onChangeText={(v) => {
                    setCode(v.replace(/\D/g, '').slice(0, CODE_LENGTH));
                    setError(false);
                  }}
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  autoFocus
                  placeholder="••••"
                  placeholderTextColor={colors.faint2}
                  accessibilityLabel={t('login.codeHint')}
                  style={[styles.input, styles.codeInput, error && styles.inputError]}
                />
                {error ? <Text style={styles.error}>{t('login.codeError')}</Text> : null}
              </View>

              <View style={styles.actions}>
                <Button
                  label={t('common.continue')}
                  variant="primary"
                  size="lg"
                  full
                  disabled={!codeReady}
                  onPress={onVerify}
                  style={shadow.teal}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSent(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                >
                  <Text style={styles.link}>{t('login.changeNumber')}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.headingBlock}>
                <Text style={styles.heading}>{t('login.title')}</Text>
                <Text style={styles.subheading}>{t('login.subtitle')}</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('login.phoneLabel')}</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.prefix}>
                    <Text style={styles.prefixText}>{DIAL_CODE}</Text>
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="770 000 0000"
                    placeholderTextColor={colors.faint2}
                    accessibilityLabel={t('login.phoneLabel')}
                    style={[styles.input, styles.phoneInput]}
                  />
                </View>
              </View>

              <View style={styles.actions}>
                <Button
                  label={t('common.continue')}
                  variant="primary"
                  size="lg"
                  full
                  disabled={!phoneReady}
                  onPress={onSend}
                  style={shadow.teal}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onGuest}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                >
                  <Text style={styles.link}>{t('login.browse')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.tealDark,
    overflow: 'hidden',
  },
  ringTop: {
    position: 'absolute',
    top: -90,
    start: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 34,
    borderColor: overlay.white06,
  },
  ringSide: {
    position: 'absolute',
    top: 140,
    end: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 26,
    borderColor: overlay.white05,
  },
  content: {
    flex: 1,
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: radius.sheet,
    backgroundColor: overlay.white12,
    borderWidth: 1,
    borderColor: overlay.white25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  logoGlyph: {
    fontFamily: fonts.bold,
    fontSize: 42,
    color: colors.white,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: 48,
    color: colors.white,
  },
  wordmark: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 5,
    color: overlay.white75,
  },
  tagline: {
    ...type.body,
    fontSize: 14,
    color: overlay.white90,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.sheet2,
    borderTopRightRadius: radius.sheet2,
    paddingTop: spacing.giant,
    paddingHorizontal: spacing.huge,
    gap: spacing.giant,
    ...shadow.sheet,
  },
  headingBlock: {
    gap: spacing.xs,
  },
  heading: {
    ...type.h1,
    color: colors.ink,
  },
  subheading: {
    ...type.body,
    color: colors.muted,
  },
  field: {
    gap: spacing.md,
  },
  fieldLabel: {
    ...type.captionStrong,
    color: colors.muted,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  prefix: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.sand,
    backgroundColor: colors.white,
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
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.sand,
    backgroundColor: colors.white,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.ink,
  },
  phoneInput: {
    flex: 1,
    textAlign: 'left',
    writingDirection: 'ltr',
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
  actions: {
    gap: spacing.xxl,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.tealText,
    textAlign: 'center',
  },
});
