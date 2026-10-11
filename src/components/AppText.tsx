import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { fonts, localFont, localSize } from '../theme';

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
//
// It also swaps the English family a style names for the Arabic one, and
// sizes English down to the measure the type scale was set for.
export default function AppText({ style, ...rest }: TextProps) {
  const { lang, isRTL } = useLanguage();
  const flat = StyleSheet.flatten(style) || {};
  const textAlign = flat.textAlign ?? 'auto';
  const writingDirection = flat.writingDirection ?? (isRTL ? 'rtl' : 'ltr');
  const fontFamily = localFont(flat.fontFamily ?? fonts.regular, lang);
  const size = flat.fontSize === undefined ? null : { fontSize: localSize(flat.fontSize, lang) };
  return <Text {...rest} style={[style, { textAlign, writingDirection, fontFamily }, size]} />;
}
