import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Text from './AppText';
import { colors, fonts, radius } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { Category } from '../data/menu';

export interface TagProps {
  variant: Category;
  style?: StyleProp<ViewStyle>;
}

// The offer photographs are shot on pale studio paper, so a pale chip laid over
// one has nothing to sit against — the border is what gives it an edge there.
export default function Tag({ variant, style }: TagProps) {
  const { t } = useLanguage();
  const isHealthy = variant === 'h';
  const backgroundColor = isHealthy ? colors.healthyBg : colors.regularBg;
  const color = isHealthy ? colors.tealText : colors.amberIcon;
  const label = isHealthy ? t('tag.healthy') : t('tag.regular');

  return (
    <View style={[styles.tag, { backgroundColor, borderColor: color }, style]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
  },
});
