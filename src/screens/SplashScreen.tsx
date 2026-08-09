import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors, fonts, overlay, radius, spacing } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

const GRADIENT_COLORS = [colors.tealDark, colors.teal, colors.tealMid] as const;
const GRADIENT_LOCATIONS = [0, 0.62, 1] as const;

export default function SplashScreen() {
  const { t } = useLanguage();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={GRADIENT_LOCATIONS}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.18, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.ring1} pointerEvents="none" />
      <View style={styles.ring2} pointerEvents="none" />

      <View style={styles.brand}>
        <View style={styles.logo}>
          <Text style={styles.logoGlyph}>{t('brand.glyph')}</Text>
        </View>
        <Text style={styles.title}>{t('brand.name')}</Text>
        <Text style={styles.wordmark}>{t('brand.wordmark')}</Text>
        <ActivityIndicator color={overlay.white70} style={styles.spinner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.tealDark,
    overflow: 'hidden',
  },
  ring1: {
    position: 'absolute',
    top: -90,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 34,
    borderColor: overlay.white06,
  },
  ring2: {
    position: 'absolute',
    top: 140,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 26,
    borderColor: overlay.white05,
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius.sheet,
    backgroundColor: overlay.white12,
    borderWidth: 1,
    borderColor: overlay.white25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlyph: {
    fontFamily: fonts.bold,
    fontSize: 44,
    color: colors.white,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 44,
    lineHeight: 53,
    color: colors.white,
  },
  wordmark: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 5,
    color: overlay.white75,
  },
  spinner: {
    marginTop: spacing.huge,
  },
});
