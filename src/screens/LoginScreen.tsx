import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  type KeyboardEvent,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import Text from '../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import { colors, fonts, overlay, radius, shadow, spacing, type } from '../theme';
import { type Lang, useLanguage } from '../i18n/LanguageContext';
import { useAuth, type IdentityChannel, type SignInFailure } from '../state/AuthContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const GRADIENT_COLORS = [colors.tealDark, colors.teal, colors.tealMid] as const;

// One revolution of the girih patches. Matches the splash so the two screens
// turn at the same pace and the handover reads as one continuous backdrop.
const SPIN_MS = 40000;
// UIKit's keyboard animation is not one of the standard ease curves — it starts
// fast and settles long. A generic ease-out drifts away from the keyboard
// mid-flight, and the gap between the two is what reads as lag; this tracks it.
const KEYBOARD_CURVE = Easing.bezier(0.38, 0.7, 0.125, 1);
const DIAL_CODE = '+964';
const LOGO = require('../../assets/logo-hail.png');
// Shipped at 1x/2x/3x so `repeat` tiles off the ~139pt base rather than the
// full-width source, which would read as one stretched motif instead of texture.
const PATTERN = require('../../assets/pattern-arabic.jpg');
// Same girih, alpha-cut from the same source so the tile stays seam-identical,
// with the white field dropped and the lines flattened to colors.goldLight. The
// .jpg cannot be reused on the hero: it is gold-on-white, so over the teal
// gradient the white field dominates and any opacity that reveals the lines
// washes the whole patch pale. Only the sheet, which is cream, can use it.
const PATTERN_GOLD = require('../../assets/pattern-arabic-gold.png');
const PATCH_TOP = 320;
const PATCH_SIDE = 225;

export default function LoginScreen({ navigation }: RootStackScreenProps<'Login'>) {
  const { t, isRTL, setLang } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { signIn, continueAsGuest } = useAuth();

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  // Which identity the customer is signing in with. Phone stays the default:
  // it is what most people have, and the other route is one tap away.
  const [channel, setChannel] = useState<IdentityChannel>('phone');
  const [failure, setFailure] = useState<SignInFailure | null>(null);

  // KeyboardAvoidingView's `padding` behaviour squeezed the flex:1 brand block
  // as the keyboard came up, so the logo and title snapped smaller in one frame.
  // Driving the lift ourselves means the whole screen slides on the keyboard's
  // own duration, and the brand fades instead of being crushed.
  const kb = useRef(new Animated.Value(0)).current;

  // iOS only. Android's window is already resized under the keyboard by the
  // manifest's default layout mode, so lifting here too would shift twice.
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    const slide = (to: number, duration: number) =>
      Animated.timing(kb, {
        toValue: to,
        duration,
        easing: KEYBOARD_CURVE,
        useNativeDriver: true,
      }).start();

    const show = Keyboard.addListener('keyboardWillShow', (e: KeyboardEvent) =>
      slide(Math.max(0, e.endCoordinates.height - insets.bottom), e.duration || 250),
    );
    const hide = Keyboard.addListener('keyboardWillHide', (e: KeyboardEvent) =>
      slide(0, e.duration || 220),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [insets.bottom, kb]);

  // The patches are circles clipped by borderRadius, so turning them a full
  // 360° leaves the silhouette untouched — only the girih inside rotates.
  // Linear, so the wrap from 360° back to 0° is seamless.
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: SPIN_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const patchSpin = {
    transform: [
      { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
    ],
  };

  const lift = Animated.multiply(kb, -1);

  // The screen slides up by the whole keyboard; the brand gives most of that
  // back and shrinks, so the ring rises into the gap left above the sheet and
  // stays there while the customer types. Proportional to the real keyboard
  // rather than a fixed number — the give-back has to match whatever came up.
  const brandStyle = {
    transform: [
      { translateY: Animated.multiply(kb, 0.62) },
      {
        scale: kb.interpolate({
          inputRange: [0, 210],
          outputRange: [1, 0.62],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  // The wordmark and the line under it do go: at this size they are unreadable,
  // and the ring alone is enough to say whose screen this is.
  const brandTextStyle = {
    opacity: kb.interpolate({
      inputRange: [0, 40, 150],
      outputRange: [1, 1, 0],
      extrapolate: 'clamp',
    }),
  };

  const isEmail = channel === 'email';
  const identityReady = isEmail
    // Deliberately loose: the API decides what a real address is, and a stricter
    // guess here only ever refuses somebody's perfectly good mailbox.
    ? /^\S+@\S+\.\S+$/.test(email.trim())
    : phone.replace(/\D/g, '').length >= 10;

  // The field sits behind a +964 chip, so what the customer types is the local
  // part of the number and the dial code has to be put back before it is sent.
  // Sending the field raw is how 7817768081 reaches the API as an already
  // international number: +7 is Russia, and the code goes to a stranger.
  //
  // The trunk zero and a repeated country code are both stripped, so 0781…,
  // 781… and 964781… are one customer rather than three accounts.
  const e164 = `${DIAL_CODE}${phone.replace(/\D/g, '').replace(/^964/, '').replace(/^0+/, '')}`;

  // Which account is being opened.
  const identity = isEmail
    ? { channel: 'email' as const, value: email.trim() }
    : { channel: 'phone' as const, value: e164 };


  // Reached from the checkout gate, sign-in returns the customer to the screen
  // that sent them here (their half-built plan is still on it); reached on cold
  // start, it is the root and hands over to the tabs.
  const proceed = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('Tabs');
  };

  // No code step: the identity is the sign-in.
  const onSend = () => {
    const result = signIn(identity);
    if (result.ok) proceed();
    else setFailure(result.reason);
  };

  // Resolved at render rather than stored, so the message follows the language
  // rather than whichever one was active when the request failed.
  const errorText = failure ? t(isEmail ? 'login.errorEmail' : 'login.errorPhone') : null;

  // Swapping the route clears the other field: carrying a half-typed number
  // into the email step and back is how a customer ends up sending the one they
  // had already abandoned.
  const onSwapChannel = () => {
    setChannel(isEmail ? 'phone' : 'email');
    setPhone('');
    setEmail('');
    setFailure(null);
  };

  const onGuest = () => {
    continueAsGuest();
    proceed();
  };

  // 'auto' resolves against the paragraph's writing direction, which AppText
  // sets from the language. A physical 'right' gets mirrored back to the left
  // once the subtree resolves RTL — via forceRTL or the direction set below —
  // so the physical side is the one thing that can't be stated safely here.
  const readingSide = { textAlign: 'auto', writingDirection: isRTL ? 'rtl' : 'ltr' } as const;

  // A dial code and its number read left-to-right in any language. Plain 'row'
  // follows the resolved direction and would seat +964 to the right of the
  // field, so the order is reversed back under RTL.
  const phoneRowSide = { flexDirection: isRTL ? 'row-reverse' : 'row' } as const;

  // The toggle offers the language the customer is not in, shown under its own
  // endonym — "English" while reading Arabic, "العربية" while reading English —
  // so each name is legible to the speaker it is offered to.
  const otherLang: Lang = isRTL ? 'en' : 'ar';

  return (
    <View style={[styles.root, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={[0, 0.62, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.18, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.patchTop, patchSpin]} pointerEvents="none">
        <Image source={PATTERN_GOLD} resizeMode="repeat" style={styles.patchTopFill} />
      </Animated.View>
      <Animated.View style={[styles.patchSide, patchSpin]} pointerEvents="none">
        <Image source={PATTERN_GOLD} resizeMode="repeat" style={styles.patchSideFill} />
      </Animated.View>

      {/* A tap anywhere off the field puts the keyboard away. Buttons and the
          inputs are their own responders, so this only catches the misses. */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <Animated.View
          style={[
            styles.content,
            {
              paddingTop: insets.top,
              direction: isRTL ? 'rtl' : 'ltr',
              transform: [{ translateY: lift }],
            },
          ]}
        >
          <Animated.View style={[styles.brand, brandStyle]}>
            <View style={styles.logoRing}>
              <Image source={LOGO} style={styles.logo} resizeMode="cover" />
            </View>
            <Animated.View style={[styles.brandText, brandTextStyle]}>
              <Text style={styles.title}>{t('brand.name')}</Text>
              <Text style={styles.tagline}>{t('brand.tagline')}</Text>
            </Animated.View>
          </Animated.View>

          <View style={[styles.sheet, { paddingBottom: spacing.giant + insets.bottom }]}>
            <Image
              source={PATTERN}
              resizeMode="repeat"
              style={[styles.sheetPattern, { width: windowWidth, height: windowHeight }]}
            />
            <View style={styles.headingBlock}>
              <Text style={[styles.heading, readingSide]}>{t('login.title')}</Text>
              <Text style={[styles.subheading, readingSide]}>
                {t(isEmail ? 'login.subtitleEmail' : 'login.subtitle')}
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, readingSide]}>
                {t(isEmail ? 'login.emailLabel' : 'login.phoneLabel')}
              </Text>

              {isEmail ? (
                <TextInput
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setFailure(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  placeholder={t('login.emailPlaceholder')}
                  placeholderTextColor={colors.faint2}
                  accessibilityLabel={t('login.emailLabel')}
                  style={[styles.input, styles.emailInput, !!errorText && styles.inputError]}
                />
              ) : (
                <View style={[styles.phoneRow, phoneRowSide]}>
                  <View style={styles.prefix}>
                    <Text style={styles.prefixText}>{DIAL_CODE}</Text>
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={(v) => {
                      setPhone(v);
                      setFailure(null);
                    }}
                    keyboardType="phone-pad"
                    placeholder="770 000 0000"
                    placeholderTextColor={colors.faint2}
                    accessibilityLabel={t('login.phoneLabel')}
                    style={[styles.input, styles.phoneInput, !!errorText && styles.inputError]}
                  />
                </View>
              )}

              {errorText ? (
                <Text style={[styles.error, readingSide]}>{errorText}</Text>
              ) : null}
            </View>

            <View style={styles.actions}>
              <Button
                label={t('common.continue')}
                variant="primary"
                size="lg"
                full
                disabled={!identityReady}
                onPress={onSend}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onSwapChannel}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
              >
                <Text style={styles.link}>
                  {t(isEmail ? 'login.usePhone' : 'login.useEmail')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onGuest}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
              >
                <Text style={styles.link}>{t('login.browse')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Sits above the content so the keyboard lift never carries it off, and
          at the reading-end corner within the safe area. `end` resolves against
          the root's direction, set from the language, so it stays in the corner
          under both scripts. */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => void setLang(otherLang)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={t('login.switchLanguage')}
        style={[styles.langToggle, { top: insets.top + spacing.sm, end: spacing.huge }]}
      >
        <Icon path={icons.globe} size={15} color={colors.white} strokeWidth={1.8} />
        <Text style={styles.langToggleText}>{t(`lang.${otherLang}.native`)}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.tealDark,
    overflow: 'hidden',
  },
  // Two girih patches replacing the outline rings, keeping their composition:
  // one bled off the leading top corner, the second trailing and dropped below
  // it. `start`/`end` keep that mirroring with the language, so under Arabic the
  // large patch sits top-right and the small one to its lower left.
  //
  // The tile is the image's own 139x80pt intrinsic size — `repeat` ignores any
  // width/height you give it for tiling purposes and reads the asset's scale
  // suffix, so a finer tile would mean resampling the source, and resampling a
  // tile breaks the wrap and shows a seam. Patch size is the lever instead:
  // larger patches expose more repeats and read as texture rather than as one
  // blown-up motif. The Image carries explicit dimensions because a repeating
  // Image pinned to opposite edges collapses to a single stretched tile.
  patchTop: {
    position: 'absolute',
    top: -105,
    start: -100,
    width: PATCH_TOP,
    height: PATCH_TOP,
    borderRadius: PATCH_TOP / 2,
    overflow: 'hidden',
    opacity: 0.78,
  },
  patchTopFill: {
    width: PATCH_TOP,
    height: PATCH_TOP,
  },
  patchSide: {
    position: 'absolute',
    top: 150,
    end: -85,
    width: PATCH_SIDE,
    height: PATCH_SIDE,
    borderRadius: PATCH_SIDE / 2,
    overflow: 'hidden',
    opacity: 0.78,
  },
  patchSideFill: {
    width: PATCH_SIDE,
    height: PATCH_SIDE,
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
  brandText: {
    alignItems: 'center',
  },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.brown,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: 58,
    color: colors.white,
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
  // Both dimensions come in from the window rather than from edge anchors: a
  // repeating Image resolves its frame from its own intrinsic size, so an
  // absolute child pinned to opposite edges collapses to one tile on that axis
  // instead of stretching. The sheet spans the screen and never exceeds its
  // height, so overshoot lands off-screen. Clipped on the image rather than with
  // overflow:'hidden' on the sheet — clipsToBounds and a drop shadow can't
  // coexist on one iOS view.
  sheetPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderTopLeftRadius: radius.sheet2,
    borderTopRightRadius: radius.sheet2,
    opacity: 0.05,
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
    gap: spacing.md,
  },
  prefix: {
    borderRadius: radius.control,
    backgroundColor: colors.card,
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
  // Fill-only, no outline: the beige surface is enough separation on a white
  // sheet, and dropping the stroke is most of what makes the field feel soft.
  input: {
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.card,
    paddingVertical: 17,
    paddingHorizontal: spacing.huge,
    fontFamily: fonts.semibold,
    fontSize: 16.5,
    color: colors.ink,
  },
  phoneInput: {
    flex: 1,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  // An address is a Latin run, so it reads left-to-right even in Arabic —
  // the same exception the number above relies on.
  emailInput: {
    textAlign: 'left',
    writingDirection: 'ltr',
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
  langToggle: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: overlay.white16,
  },
  langToggleText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.white,
  },
});
