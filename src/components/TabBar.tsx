import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts, radius, shadow } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from './Icon';
import { icons } from './icons';

const TAB_META: Record<string, { icon: string; labelKey: string }> = {
  Plans: { icon: icons.box, labelKey: 'nav.plans' },
  Menu: { icon: icons.grid, labelKey: 'nav.menu' },
  Orders: { icon: icons.receipt, labelKey: 'nav.orders' },
  Profile: { icon: icons.user, labelKey: 'nav.profile' },
};

interface TabButtonProps {
  focused: boolean;
  iconPath: string;
  label: string;
  onPress: () => void;
}

function TabButton({ focused, iconPath, label, onPress }: TabButtonProps) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 90,
    }).start();
  }, [focused, anim]);

  const pillStyle = {
    opacity: anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
  };
  const liftStyle = {
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [1, -1] }) }],
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.tab}
    >
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.pill, styles.pillGlow, pillStyle]} />
        <Animated.View style={[styles.iconStack, liftStyle]}>
          <Icon path={iconPath} size={22} color={colors.muted2} strokeWidth={1.7} />
          <Animated.View style={[StyleSheet.absoluteFill, styles.iconCenter, { opacity: anim }]}>
            <Icon path={iconPath} size={22} color={colors.white} strokeWidth={1.9} />
          </Animated.View>
        </Animated.View>
      </View>
      <Text
        numberOfLines={1}
        style={[styles.label, focused ? styles.labelActive : styles.labelInactive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View
        style={[
          styles.bar,
          shadow.sheet,
          { direction: isRTL ? 'rtl' : 'ltr', paddingBottom: Math.max(insets.bottom, 10) + 10 },
        ]}
      >
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];
          if (!meta) {
            return null;
          }
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={route.key}
              focused={focused}
              iconPath={meta.icon}
              label={t(meta.labelKey)}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.cream,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
  pillGlow: {
    shadowColor: colors.teal,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  iconStack: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10.5,
  },
  labelActive: {
    color: colors.tealText,
    fontFamily: fonts.bold,
  },
  labelInactive: {
    color: colors.muted2,
    fontFamily: fonts.medium,
  },
});
