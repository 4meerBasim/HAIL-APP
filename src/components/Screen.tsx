import React, { useRef } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import Texture from './Texture';
import { colors } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  background?: string;
  scroll?: boolean;
  edges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  // Sits behind the content and outside the ScrollView, so it stays put while
  // the page scrolls rather than sliding away with it.
  texture?: boolean;
}

const DEFAULT_EDGES: Edge[] = ['top', 'bottom', 'left', 'right'];

export default function Screen({
  children,
  style,
  background = colors.cream,
  scroll = false,
  edges = DEFAULT_EDGES,
  contentContainerStyle,
  texture = false,
}: ScreenProps) {
  const { isRTL } = useLanguage();
  const direction = isRTL ? 'rtl' : 'ltr';

  // Pressing the tab you are already on returns that screen to the top, which
  // every scrolling screen built on Screen gets without asking for it.
  const scroller = useRef<ScrollView>(null);
  useScrollToTop(scroller);

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: background, direction }]}
    >
      {texture ? <Texture /> : null}
      {scroll ? (
        // Children go straight into the content container: an extra wrapper View
        // would swallow the container's `gap`, collapsing every section rhythm.
        <ScrollView
          ref={scroller}
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
