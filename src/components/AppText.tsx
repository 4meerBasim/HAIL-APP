import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';

// Drop-in replacement for react-native's <Text>. React Native defaults text
// alignment to the native layout direction, which left-aligns Arabic. This
// aligns to the reading start unless a style already sets textAlign, so
// centered/explicit labels keep their alignment.
//
// 'auto' resolves against the paragraph's writing direction, set just below
// from the language. Naming the physical side instead ('right' for Arabic)
// reads as equivalent but isn't: once a subtree resolves RTL — through
// I18nManager.forceRTL or a direction:'rtl' ancestor — the physical value is
// mirrored back to the left, which is the bug this used to have.
export default function AppText({ style, ...rest }: TextProps) {
  const { isRTL } = useLanguage();
  const flat = StyleSheet.flatten(style) || {};
  const textAlign = flat.textAlign ?? 'auto';
  const writingDirection = flat.writingDirection ?? (isRTL ? 'rtl' : 'ltr');
  return <Text {...rest} style={[style, { textAlign, writingDirection }]} />;
}
