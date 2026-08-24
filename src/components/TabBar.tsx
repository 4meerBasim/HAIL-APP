import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts, radius, shadow } from '../theme';
import { usePulseLoop } from '../animation';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotifications } from '../state/NotificationsContext';
import { useOrders } from '../state/OrdersContext';
import Badge from './Badge';
import CartBar from './CartBar';
import Icon from './Icon';
import { type IconPath, icons } from './icons';

const TAB_META: Record<string, { icon: IconPath; labelKey: string }> = {
  Plans: { icon: icons.box, labelKey: 'nav.plans' },
  Menu: { icon: icons.puzzle, labelKey: 'nav.build' },
  Orders: { icon: icons.receipt, labelKey: 'nav.orders' },
  Profile: { icon: icons.user, labelKey: 'nav.profile' },
};

// A delivery on its way, on the tab that tracks it: the same breathing dot the
// order card carries, small enough to sit on an icon.
function LiveDot() {
  const anim = usePulseLoop();
  const halo = {
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
  };

  return (
    <View style={styles.live} pointerEvents="none">
      <Animated.View style={[styles.liveDot, styles.liveHalo, halo]} />
      <View style={styles.liveDot} />
    </View>
  );
}

interface TabButtonProps {
  focused: boolean;
  iconPath: IconPath;
  label: string;
  onPress: () => void;
  /** Unread notices, shown on the account tab. */
  badge?: number;
  /** A delivery in flight, shown on the orders tab. */
  live?: boolean;
}

function TabButton({ focused, iconPath, label, onPress, badge = 0, live = false }: TabButtonProps) {
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
          <Icon path={iconPath} size={23} color={colors.muted2} strokeWidth={1.6} />
          <Animated.View style={[StyleSheet.absoluteFill, styles.iconCenter, { opacity: anim }]}>
            <Icon path={iconPath} size={23} color={colors.white} strokeWidth={1.8} />
          </Animated.View>
        </Animated.View>
        {live ? <LiveDot /> : null}
        <Badge count={badge} ringColor={colors.card} style={styles.badge} />
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
  const { unreadCount } = useNotifications();
  const { orders } = useOrders();

  const delivering = orders.some((order) => order.status === 'active');

  // The build tab ends in a bar of its own — what is in the box and what it
  // costs — and two bars stacked on top of each other is one too many.
  const building = state.routes[state.index]?.name === 'Menu';

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {/* Sits in the bar's own layout rather than floating over the screen, so
          a full page of dishes is never hidden behind it. */}
      {building ? null : <CartBar />}
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
              badge={route.name === 'Profile' ? unreadCount : 0}
              live={route.name === 'Orders' && delivering}
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
    backgroundColor: colors.card,
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
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  live: {
    position: 'absolute',
    top: 4,
    end: 10,
    width: 7,
    height: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  liveHalo: {
    position: 'absolute',
  },
  badge: {
    top: -2,
    end: 2,
  },
  label: {
    fontSize: 12.5,
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
