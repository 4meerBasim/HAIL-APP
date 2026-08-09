import React from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  background?: string;
  scroll?: boolean;
  edges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
}

const DEFAULT_EDGES: Edge[] = ['top', 'bottom', 'left', 'right'];

export default function Screen({
  children,
  style,
  background = colors.cream,
  scroll = false,
  edges = DEFAULT_EDGES,
  contentContainerStyle,
}: ScreenProps) {
  const { isRTL } = useLanguage();
  const direction = isRTL ? 'rtl' : 'ltr';

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: background, direction }]}
    >
      {scroll ? (
        // Children go straight into the content container: an extra wrapper View
        // would swallow the container's `gap`, collapsing every section rhythm.
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[contentContainerStyle, style]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
