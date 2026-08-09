import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';

// Drop-in replacement for react-native's <Text>. React Native defaults text
// alignment to the native layout direction (LTR here, since I18nManager isn't
// force-flipped), which left-aligns Arabic. This aligns to the reading start
// (right in Arabic, left in English) unless a style already sets textAlign, so
// centered/explicit labels keep their alignment.
export default function AppText({ style, ...rest }: TextProps) {
  const { isRTL } = useLanguage();
  const flat = StyleSheet.flatten(style) || {};
  const textAlign = flat.textAlign ?? (isRTL ? 'right' : 'left');
  const writingDirection = flat.writingDirection ?? (isRTL ? 'rtl' : 'ltr');
  return <Text {...rest} style={[style, { textAlign, writingDirection }]} />;
}
