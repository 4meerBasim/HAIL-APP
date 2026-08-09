import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  DimensionValue,
  Easing,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import { colors, fonts, radius, shadow } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { toWesternDigits } from '../i18n/digits';
import {
  DEFAULT_TRACKING,
  trackingOrder,
  trackingStepIndex,
  trackingSteps,
  type TrackingStatus,
} from '../data/menu';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

// Route SVG uses the design frame; markers are positioned as a % of the same box
// so they stay locked to the (stretched) route regardless of device size.
const MAP_W = 402;
const MAP_H = 680;
const pct = (n: number, base: number): DimensionValue => `${(n / base) * 100}%` as `${number}%`;

// Route geometry lifted verbatim from the design's <!-- 07 TRACKING --> SVGs.
const ROUTE = 'M330 180 C 300 260, 180 260, 150 340 S 90 470, 120 540';

// Step labels are localized via t(); these are the strings.ts keys in step order.
const STEP_KEYS = ['track.step.preparing', 'track.step.ontheway', 'track.step.delivered'] as const;

// Status cycle order derived from the exported step-index map (preparing -> ontheway -> delivered).
const STATUS_ORDER = (Object.keys(trackingStepIndex) as TrackingStatus[]).sort(
  (a, b) => trackingStepIndex[a] - trackingStepIndex[b],
);

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface GridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  o: number;
  w: number;
}

export default function TrackingScreen({ route, navigation }: RootStackScreenProps<'Tracking'>) {
  const { t, lang, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<TrackingStatus>(route.params?.status ?? DEFAULT_TRACKING);
  const [mapSize, setMapSize] = useState<{ w: number; h: number } | null>(null);

  const idx = trackingStepIndex[status];

  // JS-driven value for the SVG dash offset (native driver can't animate SVG props).
  const dash = useRef(new Animated.Value(0)).current;
  // Native-driven value for the marker/live-dot pulses (transform + opacity).
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dashLoop = Animated.loop(
      Animated.timing(dash, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    const pulseLoop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    dashLoop.start();
    pulseLoop.start();
    return () => {
      dashLoop.stop();
      pulseLoop.stop();
    };
  }, [dash, pulse]);

  // One full dash period (2 + 14) so the loop is seamless.
  const dashOffset = dash.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const ringScale = pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 2.2, 2.2] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.45, 0, 0] });

  const grid = useMemo<GridLine[] | null>(() => {
    if (!mapSize) return null;
    const { w, h } = mapSize;
    const lines: GridLine[] = [];
    for (let x = 0; x <= w; x += 28) lines.push({ x1: x, y1: 0, x2: x, y2: h, o: 0.5, w: 1 });
    for (let y = 0; y <= h; y += 28) lines.push({ x1: 0, y1: y, x2: w, y2: y, o: 0.5, w: 1 });
    for (let x = 0; x <= w; x += 110) lines.push({ x1: x, y1: 0, x2: x, y2: h, o: 0.9, w: 2 });
    for (let y = 0; y <= h; y += 110) lines.push({ x1: 0, y1: y, x2: w, y2: y, o: 0.9, w: 2 });
    return lines;
  }, [mapSize]);

  const cycleStatus = () =>
    setStatus((s) => STATUS_ORDER[(trackingStepIndex[s] + 1) % STATUS_ORDER.length]);

  const minutes = lang === 'ar' ? trackingOrder.minutes : toWesternDigits(trackingOrder.minutes);
  const avatar = t('track.driver.name').trim().charAt(0);

  // Connector segments are physical (left/width %); map coloring to the right segment per direction.
  const leftSegOn = isRTL ? idx >= 2 : idx >= 1;
  const rightSegOn = isRTL ? idx >= 1 : idx >= 2;

  const leadPos: ViewStyle = isRTL ? { right: 16 } : { left: 16 };
  const trailPos: ViewStyle = isRTL ? { left: 16 } : { right: 16 };
  const textStart: TextStyle = {
    textAlign: isRTL ? 'right' : 'left',
    writingDirection: isRTL ? 'rtl' : 'ltr',
  };

  return (
    <Screen background={colors.mapBg} edges={['left', 'right']}>
      <View style={styles.map} onLayout={(e) => setMapSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {grid && (
          <Svg style={StyleSheet.absoluteFill} width={mapSize!.w} height={mapSize!.h}>
            {grid.map((l, i) => (
              <Line
                key={i}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke={colors.white}
                strokeOpacity={l.o}
                strokeWidth={l.w}
              />
            ))}
          </Svg>
        )}

        <View style={styles.blob1} />
        <View style={styles.blob2} />

        <Svg
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          preserveAspectRatio="none"
        >
          <AnimatedPath
            d={ROUTE}
            stroke={colors.teal}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={[2, 14]}
            strokeDashoffset={dashOffset}
          />
          <Circle cx={330} cy={180} r={9} fill={colors.tealDark} />
        </Svg>

        <View style={[styles.pin, styles.restaurantPin]}>
          <Text style={styles.restaurantText}>{t('track.restaurant')}</Text>
        </View>

        <View style={styles.driverMarker}>
          <Animated.View
            style={[styles.driverRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}
          />
          <View style={styles.driverDot}>
            <Icon path={icons.truck} size={20} color={colors.white} strokeWidth={1.8} />
          </View>
        </View>

        <View style={[styles.pin, styles.driverBadge]}>
          <Text style={styles.driverBadgeText}>{t('track.driver.badge')}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={[styles.backBtn, { top: insets.top + 12 }, leadPos]}
        >
          <Icon
            path={isRTL ? icons.chevronRight : icons.chevronLeft}
            size={14}
            color={colors.ink}
            strokeWidth={2.4}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={cycleStatus}
          accessibilityRole="button"
          accessibilityLabel={t('track.cycle')}
          style={[styles.livePill, { top: insets.top + 12 }, trailPos]}
        >
          <View style={styles.liveDotWrap}>
            <Animated.View
              style={[styles.liveRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}
            />
            <View style={styles.liveDot} />
          </View>
          <Text style={styles.liveText}>{t('track.live')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headline, textStart]}>{t(`track.headline.${status}`)}</Text>
            <Text style={[styles.orderLine, textStart]}>{t('track.orderLine')}</Text>
          </View>
          <View style={styles.minuteBox}>
            <Text style={styles.minuteNum}>{minutes}</Text>
            <Text style={styles.minuteLabel}>{t('track.minute')}</Text>
          </View>
        </View>

        <View style={styles.steps}>
          <View
            style={[styles.connector, styles.connectorLeft, { backgroundColor: leftSegOn ? colors.teal : colors.sand }]}
          />
          <View
            style={[styles.connector, styles.connectorRight, { backgroundColor: rightSegOn ? colors.teal : colors.sand }]}
          />
          <View style={styles.stepRow}>
            {trackingSteps.map((_, i) => {
              const done = i < idx;
              const active = i === idx;
              const filled = done || active;
              return (
                <View key={STEP_KEYS[i]} style={styles.stepCol}>
                  <View
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor: filled ? colors.teal : colors.white,
                        borderColor: filled ? colors.teal : colors.faint3,
                      },
                    ]}
                  >
                    {filled && (
                      <Icon
                        path={done ? icons.check : icons.dot}
                        size={12}
                        color={colors.white}
                        fill={done ? 'none' : colors.white}
                        strokeWidth={done ? 3 : 1}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: filled ? colors.tealDark : colors.faint,
                        fontFamily: active ? fonts.bold : fonts.medium,
                      },
                    ]}
                  >
                    {t(STEP_KEYS[i])}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatar}</Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={[styles.driverName, textStart]}>{t('track.driver.name')}</Text>
            <Text style={[styles.driverRole, textStart]}>{t('track.driver.role')}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('track.call')}
            style={styles.iconBtn}
          >
            <Icon path={icons.phone} size={17} color={colors.tealText} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('track.chat')}
            style={styles.iconBtn}
          >
            <Icon path={icons.chat} size={17} color={colors.tealText} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    top: 120,
    right: -30,
    width: 220,
    height: 150,
    backgroundColor: colors.mapShape1,
    borderRadius: 40,
    transform: [{ rotate: '-8deg' }],
  },
  blob2: {
    position: 'absolute',
    top: 330,
    left: -40,
    width: 190,
    height: 120,
    backgroundColor: colors.mapShape2,
    borderRadius: 40,
    transform: [{ rotate: '6deg' }],
  },
  pin: {
    position: 'absolute',
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  restaurantPin: {
    top: pct(158, MAP_H),
    right: pct(52, MAP_W),
    backgroundColor: colors.tealDark,
  },
  restaurantText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: colors.white,
  },
  driverMarker: {
    position: 'absolute',
    top: pct(520, MAP_H),
    right: pct(258, MAP_W),
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
  driverDot: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverBadge: {
    top: pct(568, MAP_H),
    right: pct(238, MAP_W),
    backgroundColor: colors.white,
    ...shadow.card,
  },
  driverBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: colors.ink,
  },
  backBtn: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  livePill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    ...shadow.card,
  },
  liveDotWrap: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveRing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.green,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.green,
  },
  liveText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 15,
    ...shadow.sheet,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flexShrink: 1,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.ink,
  },
  orderLine: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted2,
    marginTop: 2,
  },
  minuteBox: {
    backgroundColor: colors.healthyBg,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  minuteNum: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.tealText,
  },
  minuteLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.tealText,
  },
  steps: {
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: 12.5,
    height: 3,
  },
  connectorLeft: {
    left: '16.67%',
    width: '33.33%',
  },
  connectorRight: {
    left: '50%',
    width: '33.33%',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 11,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.white,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.ink,
  },
  driverRole: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted2,
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.healthyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
