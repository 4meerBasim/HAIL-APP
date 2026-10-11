import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { fonts, localFont, localSize } from '../theme';

// Drop-in replacement for react-native's <TextInput> that swaps the English
// family a style names for the Arabic one and sizes English down, as AppText
// does for <Text>.
export default function AppTextInput({
  style,
  ...rest
}: TextInputProps & { ref?: React.Ref<TextInput> }) {
  const { lang } = useLanguage();
  const flat = StyleSheet.flatten(style) || {};
  const fontFamily = localFont(flat.fontFamily ?? fonts.regular, lang);
  const size = flat.fontSize === undefined ? null : { fontSize: localSize(flat.fontSize, lang) };
  return <TextInput {...rest} style={[style, { fontFamily }, size]} />;
}
