import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber, toWesternDigits } from '../i18n/digits';
import { useOrderText } from '../i18n/orderText';
import {
  DELIVERY_MINUTES,
  SUPPORT_PHONE,
  SUPPORT_WHATSAPP,
  type TrackingStatus,
  deliveredBy,
  trackingDestination,
  trackingProgressOf,
  trackingRestaurant,
  trackingRoute,
  trackingStatusOf,
  trackingStatuses,
} from '../data/menu';
import { useNow, useOrders } from '../state/OrdersContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';
import { LEAFLET_CSS, LEAFLET_JS } from '../vendor/leaflet';

// The tracking basemap is the same OpenStreetMap standard tiles + tone chain the
// address picker uses, so the two map surfaces read as one product. Tone before
// hue for the reason documented there: brightness is pulled first so contrast
// has room to expand the streets rather than flattening them into the ceiling.
const buildHtml = (fromLabel: string, toLabel: string): string => `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>${LEAFLET_CSS}</style>
<style>
  html, body, #map { margin: 0; height: 100%; background: ${colors.mapBg}; }
  .leaflet-tile-pane { filter: brightness(0.94) contrast(1.14) sepia(0.16) saturate(0.9); }
  .leaflet-control-attribution {
    font-family: -apple-system, sans-serif; font-size: 9px;
    padding: 2px 7px; border-radius: 9px 0 0 0; border: none; box-shadow: none;
    background: rgba(255,255,255,0.82); color: ${colors.muted};
  }
  .leaflet-control-attribution a { color: ${colors.tealDark}; text-decoration: none; }
  /* Centred over its point via translateX(-50%) rather than left-anchored: the
     destination pill sits at the end of the route hard against the map edge, and
     a right-growing label was clipped to its first glyph or two ("Yo"). Centring
     lets the fitBounds padding keep the whole caption on screen both sides. */
  .cap {
    background: ${colors.tealDark}; color: #fff; border-radius: 12px;
    padding: 4px 9px; font: 700 10.5px -apple-system, sans-serif; white-space: nowrap;
    transform: translateX(-50%);
  }
  .cap.dest { background: ${colors.gold}; }
  .van {
    width: 40px; height: 40px; border-radius: 50%;
    background: ${colors.teal}; border: 3px solid #fff;
    box-shadow: 0 4px 12px rgba(16,60,59,.35);
    display: flex; align-items: center; justify-content: center;
  }
  .van svg { width: 20px; height: 20px; }
  .halo {
    position: absolute; left: 50%; top: 50%; width: 40px; height: 40px;
    margin: -20px 0 0 -20px; border-radius: 50%; background: ${colors.teal};
    animation: halo 1800ms ease-out infinite;
  }
  @keyframes halo {
    from { transform: scale(1); opacity: .45; }
    to   { transform: scale(2.6); opacity: 0; }
  }
</style>
</head>
<body>
<div id="map"></div>
<script>${LEAFLET_JS}</script>
<script>
  var ROUTE = ${JSON.stringify(trackingRoute)};
  var FROM = [${trackingRestaurant.lat}, ${trackingRestaurant.lng}];
  var TO = [${trackingDestination.lat}, ${trackingDestination.lng}];

  // Non-interactive on purpose: this is a status display, not a picker, and a
  // map that pans under the thumb competes with the sheet below it.
  var map = L.map('map', {
    zoomControl: false, attributionControl: true,
    dragging: false, touchZoom: false, doubleClickZoom: false,
    scrollWheelZoom: false, boxZoom: false, keyboard: false, tap: false
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // The travelled leg sits on top of the full route, so progress reads as the
  // solid line eating into the dashed one.
  L.polyline(ROUTE, { color: '${colors.sand}', weight: 6, opacity: 1, lineCap: 'round' }).addTo(map);
  var done = L.polyline([], { color: '${colors.teal}', weight: 6, opacity: 1, lineCap: 'round' }).addTo(map);

  var cap = function (text, cls) {
    return L.divIcon({ className: '', html: '<div class="cap ' + cls + '">' + text + '</div>', iconAnchor: [0, 28] });
  };
  L.marker(FROM, { icon: cap(${JSON.stringify(fromLabel)}, 'from'), interactive: false }).addTo(map);
  L.marker(TO, { icon: cap(${JSON.stringify(toLabel)}, 'dest'), interactive: false }).addTo(map);

  var VAN = '<div class="halo"></div><div class="van"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></div>';
  var van = L.marker(FROM, {
    icon: L.divIcon({ className: '', html: VAN, iconSize: [40, 40], iconAnchor: [20, 20] }),
    interactive: false, zIndexOffset: 500
  }).addTo(map);

  map.fitBounds(L.latLngBounds(ROUTE), { padding: [56, 56] });

  // Walk the polyline by cumulative segment length so the marker tracks the
  // road rather than the straight line between endpoints.
  var lengths = [], total = 0;
  for (var i = 1; i < ROUTE.length; i++) {
    var dy = ROUTE[i][0] - ROUTE[i-1][0], dx = ROUTE[i][1] - ROUTE[i-1][1];
    var d = Math.sqrt(dy*dy + dx*dx);
    lengths.push(d); total += d;
  }

  var at = function (ratio) {
    var want = Math.max(0, Math.min(1, ratio)) * total, run = 0;
    for (var i = 0; i < lengths.length; i++) {
      if (run + lengths[i] >= want) {
        var f = lengths[i] === 0 ? 0 : (want - run) / lengths[i];
        return {
          point: [
            ROUTE[i][0] + (ROUTE[i+1][0] - ROUTE[i][0]) * f,
            ROUTE[i][1] + (ROUTE[i+1][1] - ROUTE[i][1]) * f
          ],
          upto: i + 1
        };
      }
      run += lengths[i];
    }
    return { point: ROUTE[ROUTE.length - 1], upto: ROUTE.length - 1 };
  };

  window.jr = {
    setProgress: function (ratio) {
      var r = at(ratio);
      van.setLatLng(r.point);
      done.setLatLngs(ROUTE.slice(0, r.upto).concat([r.point]));
    }
  };
</script>
</body>
</html>
`;

const MAP_FADE = ['rgba(232,235,226,0)', 'rgba(232,235,226,0.75)'] as const;

const MINUTE = 60_000;

// Often enough that the step and the minutes left never visibly lag the clock,
// rarely enough that the map is not re-driven for nothing.
const TICK_MS = 30_000;

const clock = (ms: number): string => {
  const at = new Date(ms);
  return toWesternDigits(
    `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`,
  );
};

export default function TrackingScreen({ navigation }: RootStackScreenProps<'Tracking'>) {
  const { t, isRTL } = useLanguage();
  const { summarize } = useOrderText();
  const insets = useSafeAreaInsets();
  const { orders } = useOrders();
  const now = useNow(TICK_MS);
  const web = useRef<WebView>(null);

  // The order this screen opened on stays on screen once it lands, so the
  // customer sees it reach "delivered" instead of the page going blank under
  // them the moment the window closes.
  const live = orders.find((o) => o.status === 'active') ?? null;
  const [pinnedId, setPinnedId] = useState<string | null>(live?.id ?? null);
  useEffect(() => {
    if (live) setPinnedId(live.id);
  }, [live]);
  const order = orders.find((o) => o.id === pinnedId) ?? null;

  const status: TrackingStatus = order ? trackingStatusOf(order, now) : 'delivered';
  const progress = order && status !== 'delivered' ? trackingProgressOf(order, now) : 1;

  // Built once. Rebuilding the document on a status change would reload the map
  // and lose the driver's position mid-animation; the marker moves through
  // `window.jr` instead.
  const html = useMemo(() => buildHtml(t('track.restaurant'), t('track.destination')), [t]);

  // Also fired from onLoadEnd: on mount this runs before Leaflet has parsed, so
  // `window.jr` does not exist yet and the first position would be dropped.
  const applyProgress = useCallback(() => {
    web.current?.injectJavaScript(`window.jr && window.jr.setProgress(${progress});true;`);
  }, [progress]);

  useEffect(applyProgress, [applyProgress]);

  const idx = trackingStatuses.indexOf(status);

  // Native-driven value for the marker/live-dot pulses (transform + opacity).
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    pulseLoop.start();
    return () => {
      pulseLoop.stop();
    };
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 2.2, 2.2] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.45, 0, 0] });

  // 'auto' resolves against the paragraph's own writing direction. A physical
  // 'right' is mirrored back to the left by RN's RTL swap — the same trap the
  // login screen documents.
  const readingSide: TextStyle = {
    textAlign: 'auto',
    writingDirection: isRTL ? 'rtl' : 'ltr',
  };

  // The phone and WhatsApp lines are the support desk's: there is no driver
  // feed to put a name or a number on, so the honest contact is the one that
  // can reach whoever has the order.
  const call = () => void Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => undefined);
  const chat = () =>
    void Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}`).catch(() => undefined);

  const backButton = (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      style={[styles.backBtn, styles.lead, { top: insets.top + spacing.xl }]}
    >
      <Icon
        path={isRTL ? icons.chevronRight : icons.chevronLeft}
        size={14}
        color={colors.ink}
        strokeWidth={2.4}
      />
    </TouchableOpacity>
  );

  // Nothing in flight: a sample delivery here would be a driver who is not
  // coming, so the screen says there is nothing to follow instead.
  if (!order) {
    return (
      <Screen texture edges={['left', 'right', 'bottom']}>
        {backButton}
        <View style={styles.none}>
          <Icon path={icons.truck} size={30} color={colors.faint} strokeWidth={1.6} />
          <Text style={styles.noneTitle}>{t('track.none.title')}</Text>
          <Text style={styles.noneSub}>{t('track.none.sub')}</Text>
        </View>
      </Screen>
    );
  }

  // The quoted window, counted down: a range while the early end is still
  // ahead, then just what is left until the late end.
  const early = Math.max(0, Math.ceil((order.placedAt + DELIVERY_MINUTES[0] * MINUTE - now) / MINUTE));
  const late = Math.max(0, Math.ceil((deliveredBy(order) - now) / MINUTE));
  const minutesLeft = early > 0 ? `${formatNumber(early)}–${formatNumber(late)}` : formatNumber(late);

  return (
    <Screen background={colors.mapBg} edges={['left', 'right']}>
      <View style={styles.map}>
        <WebView
          ref={web}
          source={{ html }}
          originWhitelist={['*']}
          style={styles.web}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          pointerEvents="none"
          onLoadEnd={applyProgress}
        />

        {/* The sheet's rounded corners otherwise sit straight on live tiles;
            this softens the seam without dimming the route. */}
        <LinearGradient
          colors={MAP_FADE}
          style={styles.mapFade}
          pointerEvents="none"
        />

        {backButton}

        {status !== 'delivered' ? (
          <View style={[styles.livePill, styles.trail, { top: insets.top + spacing.xl }]}>
            <View style={styles.liveDotWrap}>
              <Animated.View
                style={[
                  styles.liveDot,
                  styles.liveRing,
                  { transform: [{ scale: ringScale }], opacity: ringOpacity },
                ]}
              />
              <View style={styles.liveDot} />
            </View>
            <Text style={styles.liveText}>{t('track.live')}</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.giant }]}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headline, readingSide]} numberOfLines={2}>
              {t(`track.headline.${status}`)}
            </Text>
            <Text style={[styles.orderLine, readingSide]} numberOfLines={1}>
              {`${t('track.orderLine').replace('{id}', formatNumber(order.id))} · ${summarize(order)}`}
            </Text>
          </View>
          {status !== 'delivered' ? (
            <View style={styles.minuteBox}>
              <Text style={styles.minuteNum}>{minutesLeft}</Text>
              <Text style={styles.minuteLabel}>{t('track.minute')}</Text>
              <Text style={styles.minuteAt}>
                {`${t('track.arrivesAt')} ${clock(deliveredBy(order))}`}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.steps}>
          <View style={styles.stepRow}>
            {trackingStatuses.map((step, i) => {
              const done = i < idx;
              const active = i === idx;
              const filled = done || active;
              const last = i === trackingStatuses.length - 1;
              return (
                <View key={step} style={styles.stepCol}>
                  {i > 0 ? (
                    <View
                      style={[styles.rail, styles.railLead, done || active ? styles.railOn : null]}
                    />
                  ) : null}
                  {last ? null : (
                    <View style={[styles.rail, styles.railTrail, done ? styles.railOn : null]} />
                  )}
                  <View
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor: filled ? colors.teal : colors.card,
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
                    {t(`track.step.${step}`)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.avatar}>
            <Icon path={icons.truck} size={20} color={colors.white} strokeWidth={1.9} />
          </View>
          <View style={styles.driverInfo}>
            <Text style={[styles.driverName, readingSide]} numberOfLines={1}>
              {t('track.contact')}
            </Text>
            <Text style={[styles.driverRole, readingSide]} numberOfLines={1}>
              {t('track.contact.sub')}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={call}
            accessibilityRole="button"
            accessibilityLabel={t('track.call')}
            style={styles.iconBtn}
          >
            <Icon path={icons.phone} size={17} color={colors.tealText} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={chat}
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

// Dot and rail are derived, not hand-tuned: the rail has to sit on the dot's
// centre line, and it did not when either number was edited on its own.
const DOT = 28;
const RAIL = 3;

const styles = StyleSheet.create({
  map: {
    flex: 1,
    overflow: 'hidden',
  },
  web: {
    flex: 1,
    backgroundColor: colors.mapBg,
  },
  mapFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
  },
  // Logical, not physical. React Native mirrors `left`/`right` under RTL
  // (I18nManager.doLeftAndRightSwapInRTL), so an `isRTL ? {right} : {left}`
  // ternary is a double negative and lands the control on the wrong edge —
  // a back chevron pointing to the trailing edge while sitting on the leading
  // one. `start`/`end` are resolved once, correctly, for both directions.
  lead: {
    start: spacing.huge,
  },
  trail: {
    end: spacing.huge,
  },
  backBtn: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
    shadowColor: colors.ink,
  },
  livePill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    ...shadow.card,
    shadowColor: colors.ink,
  },
  liveDotWrap: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.green,
  },
  // Composed onto liveDot rather than redeclaring its size and colour — the two
  // were duplicate definitions that could drift apart.
  liveRing: {
    position: 'absolute',
  },
  liveText: {
    ...type.captionStrong,
    color: colors.ink,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.xxl,
    gap: spacing.xxl,
    ...shadow.sheet,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.sand,
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  headline: {
    ...type.h3,
    color: colors.ink,
  },
  orderLine: {
    ...type.caption,
    color: colors.muted2,
  },
  minuteBox: {
    backgroundColor: colors.healthyBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  minuteNum: {
    ...type.h2,
    color: colors.tealText,
  },
  minuteLabel: {
    ...type.caption,
    fontSize: 11.5,
    color: colors.tealText,
  },
  minuteAt: {
    ...type.caption,
    fontSize: 11.5,
    fontFamily: fonts.bold,
    color: colors.tealDark,
    marginTop: 2,
  },
  steps: {
    position: 'relative',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Two half-rails per column instead of two absolutely-positioned bars across
  // the whole row. The old version hardcoded 16.67%/33.33% offsets, which only
  // held for exactly three steps, and needed its colours hand-mapped per
  // direction. These are logical (start/end), so they mirror with the language
  // and stay correct if a step is ever added.
  rail: {
    position: 'absolute',
    top: (DOT - RAIL) / 2,
    height: RAIL,
    width: '50%',
    backgroundColor: colors.sand,
  },
  railLead: {
    start: 0,
  },
  railTrail: {
    end: 0,
  },
  railOn: {
    backgroundColor: colors.teal,
  },
  stepDot: {
    width: DOT,
    height: DOT,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    ...type.caption,
    fontSize: 12.5,
    textAlign: 'center',
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: {
    flex: 1,
    gap: 2,
  },
  driverName: {
    ...type.bodyStrong,
    fontSize: 13.5,
    color: colors.ink,
  },
  driverRole: {
    ...type.caption,
    color: colors.muted2,
  },
  none: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.huge,
  },
  noneTitle: {
    ...type.h3,
    color: colors.ink,
    textAlign: 'center',
  },
  noneSub: {
    ...type.caption,
    color: colors.muted2,
    textAlign: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
