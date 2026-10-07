import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Button from '../components/Button';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useLocations, type SavedLocation } from '../state/LocationContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';
import { LEAFLET_CSS, LEAFLET_JS } from '../vendor/leaflet';

interface Picked {
  lat: number;
  lng: number;
  address: string;
}

interface Hit {
  lat: number;
  lng: number;
  label: string;
}

type Incoming =
  | ({ type: 'pick' } & Picked)
  | { type: 'results'; items: Hit[] };

const BAGHDAD = { lat: 33.3152, lng: 44.3661 };

// CARTO Positron, tinted toward the brand in CSS rather than swapped for a
// themed basemap — the filter rides on the tile pane only, so markers and
// controls keep their real colours.
//
// Leaflet's own zoom control is off: its default chrome is a grey stacked box
// that lands exactly where the back button sits, and there is no way to restyle
// it into the app's control language without fighting its stylesheet. The RN
// layer draws the controls instead and drives the map through `window.jr`.
const buildHtml = (markers: SavedLocation[], center: { lat: number; lng: number }) => `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>${LEAFLET_CSS}</style>
<style>
  html, body, #map { margin: 0; height: 100%; background: ${colors.cream}; }
  /* Tone before hue, and in this order for a reason. Positron is a light
     basemap: almost every meaningful pixel already sits between 200 and 255, so
     raising contrast on its own pushes roads and blocks into the white ceiling
     and they converge — the map goes flat. brightness(<1) first pulls the range
     off the ceiling, then contrast(>1) has room to expand it. The previous
     sepia + hue-rotate(122deg) + brightness(1.03) did the opposite and washed
     the whole basemap to a single pale ice-blue.
     For a teal cast instead of warm, swap in:
       brightness(0.95) contrast(1.12) sepia(0.1) hue-rotate(120deg) saturate(0.8) */
  .leaflet-tile-pane {
    filter: brightness(0.94) contrast(1.14) sepia(0.16) saturate(0.9);
  }
  .leaflet-control-attribution {
    font-family: -apple-system, sans-serif; font-size: 9px;
    padding: 2px 7px; border-radius: 9px 0 0 0;
    background: rgba(255,255,255,0.82); color: ${colors.muted};
    box-shadow: none; border: none;
  }
  .leaflet-control-attribution a { color: ${colors.tealDark}; text-decoration: none; }

  /* Teardrop rather than a dot: a circle centred on the tap reads as "somewhere
     near here", where a tip reads as the exact point that gets saved. Rotating a
     square with three rounded corners keeps it one element, so the shadow falls
     from the whole silhouette instead of from a stacked pseudo-element. */
  .pin {
    width: 26px; height: 26px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2.5px solid ${colors.white};
    box-shadow: 0 3px 8px rgba(16,60,59,0.35);
    display: flex; align-items: center; justify-content: center;
  }
  .pin i {
    width: 7px; height: 7px; border-radius: 50%;
    background: rgba(255,255,255,0.9); display: block;
  }
  .pin-fav { background: ${colors.gold}; }
  .pin-plain { background: ${colors.teal}; }
  .pin-new { background: ${colors.coral}; }

  /* One ring, once. A looping pulse under a pin the customer is still adjusting
     turns into visual noise the moment they drag it. */
  .halo {
    position: absolute; left: 50%; top: 50%;
    width: 26px; height: 26px; margin: -13px 0 0 -13px;
    border-radius: 50%; background: ${colors.coral};
    animation: halo 900ms ease-out 1 forwards;
  }
  @keyframes halo {
    from { transform: scale(0.4); opacity: 0.45; }
    to   { transform: scale(3.2); opacity: 0; }
  }
</style>
</head>
<body>
<div id="map"></div>
<script>${LEAFLET_JS}</script>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([${center.lat}, ${center.lng}], 13);
  var HOME = [${center.lat}, ${center.lng}];

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);

  var icon = function (cls) {
    return L.divIcon({
      className: '',
      html: '<div class="pin ' + cls + '"><i></i></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 26]
    });
  };

  var saved = ${JSON.stringify(
    markers.map((m) => ({ lat: m.lat, lng: m.lng, favourite: m.favourite })),
  )};
  saved.forEach(function (m) {
    L.marker([m.lat, m.lng], { icon: icon(m.favourite ? 'pin-fav' : 'pin-plain') }).addTo(map);
  });

  var picked = null;
  var halo = null;
  var send = function (payload) {
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  };

  var drop = function (lat, lng, address) {
    if (picked) map.removeLayer(picked);
    if (halo) map.removeLayer(halo);
    halo = L.marker([lat, lng], {
      icon: L.divIcon({ className: '', html: '<div class="halo"></div>', iconSize: [0, 0] }),
      interactive: false
    }).addTo(map);
    picked = L.marker([lat, lng], { icon: icon('pin-new') }).addTo(map);
    send({ type: 'pick', lat: lat, lng: lng, address: address || '' });
  };

  // Best-effort street name. Nominatim rate-limits hard and can refuse, so a
  // failure just leaves the coordinates showing rather than blocking the save.
  // Answers can come back out of order: one for a pin the customer has since
  // moved is dropped, or it would name — and save — the earlier spot.
  var stillPinned = function (lat, lng) {
    if (!picked) return false;
    var at = picked.getLatLng();
    return at.lat === lat && at.lng === lng;
  };
  var reverse = function (lat, lng) {
    fetch('https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=' + lat + '&lon=' + lng)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.display_name && stillPinned(lat, lng)) {
          send({ type: 'pick', lat: lat, lng: lng, address: d.display_name });
        }
      })
      .catch(function () {});
  };

  map.on('click', function (e) {
    drop(e.latlng.lat, e.latlng.lng, '');
    reverse(e.latlng.lat, e.latlng.lng);
  });

  // Driven from the RN control stack and the search card.
  // No zoom buttons: pinch and double-tap already zoom, and the stacked control
  // was the one piece of chrome the map did not need.
  window.jr = {
    recenter: function () { map.flyTo(picked ? picked.getLatLng() : HOME, 14, { duration: 0.6 }); },
    pick: function (lat, lng, label) {
      map.flyTo([lat, lng], 16, { duration: 0.7 });
      drop(lat, lng, label);
    },
    search: function (q) {
      // Biased to Iraq: an unqualified Arabic street name matches half the
      // region otherwise, and the customer is picking a delivery address.
      fetch('https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=iq&q=' + encodeURIComponent(q))
        .then(function (r) { return r.json(); })
        .then(function (d) {
          send({
            type: 'results',
            items: (d || []).map(function (x) {
              return { lat: parseFloat(x.lat), lng: parseFloat(x.lon), label: x.display_name };
            })
          });
        })
        .catch(function () { send({ type: 'results', items: [] }); });
    }
  };
</script>
</body>
</html>
`;

export default function MapScreen({ navigation }: RootStackScreenProps<'Map'>) {
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { locations, saveLocation, selectLocation } = useLocations();
  const web = useRef<WebView>(null);

  const [picked, setPicked] = useState<Picked | null>(null);
  const [label, setLabel] = useState('');
  const [favourite, setFavourite] = useState(true);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const back = isRTL ? icons.arrowRight : icons.arrowLeft;

  // Built once: re-rendering the HTML on every pick would reload the map and
  // throw away the pin the customer just dropped.
  const seeded = useRef(locations);
  const html = useMemo(() => buildHtml(seeded.current, seeded.current[0] ?? BAGHDAD), []);

  const run = (js: string) => web.current?.injectJavaScript(`${js};true;`);

  const onMessage = (e: WebViewMessageEvent) => {
    const msg = JSON.parse(e.nativeEvent.data) as Incoming;
    if (msg.type === 'results') {
      setSearching(false);
      setHits(msg.items);
      return;
    }
    // The reverse lookup lands second and may be empty; never let it wipe an
    // address that already resolved for these coordinates.
    setPicked((prev) => (prev && !msg.address && prev.lat === msg.lat ? prev : msg));
  };

  const onSearch = () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setHits(null);
    run(`window.jr.search(${JSON.stringify(q)})`);
  };

  const onPickHit = (hit: Hit) => {
    setHits(null);
    setQuery(hit.label.split(',')[0]);
    run(`window.jr.pick(${hit.lat},${hit.lng},${JSON.stringify(hit.label)})`);
  };

  const onClearSearch = () => {
    setQuery('');
    setHits(null);
    setSearching(false);
  };

  const onSave = () => {
    if (!picked) return;
    const created = saveLocation({
      label: label.trim() || t('location.pinned'),
      address: picked.address || `${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}`,
      lat: picked.lat,
      lng: picked.lng,
      favourite,
    });
    selectLocation(created.id);
    navigation.goBack();
  };

  // 'auto' resolves against the paragraph's writing direction rather than a
  // physical side, which the RTL swap would mirror back to the wrong edge.
  const readingSide = { textAlign: 'auto', writingDirection: isRTL ? 'rtl' : 'ltr' } as const;

  return (
    <View style={styles.root}>
      {/* The overlay absolute-fills this wrapper rather than the root, so the
          control stack anchors to the bottom of the map and not to the bottom
          of the screen — which is behind the sheet. */}
      <View style={styles.mapWrap}>
      <WebView
        ref={web}
        source={{ html }}
        originWhitelist={['*']}
        onMessage={onMessage}
        style={styles.map}
        // Leaflet's own gesture handling is enough; the RN layer bouncing on
        // top of it makes the map feel like it is fighting the drag.
        bounces={false}
        overScrollMode="never"
      />

      <View
        style={[styles.overlay, { paddingTop: insets.top + spacing.xl, direction: isRTL ? 'rtl' : 'ltr' }]}
        pointerEvents="box-none"
      >
        <View style={styles.topRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            style={styles.control}
          >
            <Icon path={back} size={18} color={colors.ink} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.searchCard}>
            <Icon path={icons.search} size={17} color={colors.muted} strokeWidth={2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={onSearch}
              returnKeyType="search"
              placeholder={t('location.searchPlaceholder')}
              placeholderTextColor={colors.faint2}
              accessibilityLabel={t('location.searchPlaceholder')}
              style={[styles.searchInput, readingSide]}
            />
            {searching ? <ActivityIndicator size="small" color={colors.teal} /> : null}
            {query.length > 0 && !searching ? (
              <TouchableOpacity
                onPress={onClearSearch}
                accessibilityRole="button"
                accessibilityLabel={t('location.clearSearch')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon path={icons.close} size={15} color={colors.muted} strokeWidth={2.5} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {hits ? (
          <View style={styles.results}>
            {hits.length === 0 ? (
              <Text style={[styles.resultEmpty, readingSide]}>{t('location.noResults')}</Text>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" style={styles.resultScroll}>
                {hits.map((hit, i) => (
                  <TouchableOpacity
                    key={`${hit.lat},${hit.lng}`}
                    activeOpacity={0.7}
                    onPress={() => onPickHit(hit)}
                    accessibilityRole="button"
                    style={[styles.resultRow, i > 0 && styles.resultDivider]}
                  >
                    <Icon path={icons.pin} size={15} color={colors.teal} strokeWidth={2} />
                    <Text style={[styles.resultText, readingSide]} numberOfLines={2}>
                      {hit.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}

        <View style={styles.controlStack} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => run('window.jr.recenter()')}
            accessibilityRole="button"
            accessibilityLabel={t('location.recenter')}
            style={[styles.control, styles.recenter]}
          >
            <Icon path={icons.crosshair} size={18} color={colors.white} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
      </View>

      <View style={[styles.sheet, { paddingBottom: spacing.giant + insets.bottom }]}>
        <View style={styles.handle} />
        {picked ? (
          <>
            <View style={styles.pickedRow}>
              <View style={styles.pickedIcon}>
                <Icon path={icons.pin} size={16} color={colors.teal} strokeWidth={2} />
              </View>
              <Text style={[styles.pickedText, readingSide]} numberOfLines={2}>
                {picked.address || `${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}`}
              </Text>
            </View>

            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder={t('location.namePlaceholder')}
              placeholderTextColor={colors.faint2}
              accessibilityLabel={t('location.name')}
              style={[styles.input, readingSide]}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFavourite((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: favourite }}
              style={styles.favRow}
            >
              <View style={[styles.checkbox, favourite && styles.checkboxOn]}>
                {favourite ? (
                  <Icon path={icons.check} size={12} color={colors.white} strokeWidth={3} />
                ) : null}
              </View>
              <Text style={styles.favText}>{t('location.markFavourite')}</Text>
            </TouchableOpacity>

            <Button label={t('location.save')} variant="primary" size="lg" full onPress={onSave} />
          </>
        ) : (
          <View style={styles.hintRow}>
            <View style={styles.pickedIcon}>
              <Icon path={icons.pin} size={16} color={colors.muted} strokeWidth={2} />
            </View>
            <Text style={[styles.hint, readingSide]}>{t('location.tapHint')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const CONTROL = 40;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  // Sits over the WebView rather than in flow so the map keeps the full frame
  // behind the controls. `box-none` on this and the stack lets map drags through
  // everywhere except on the controls themselves.
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.huge,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  // shadow.card's shadowColor is '#103c3b', a dark teal. Everywhere else it
  // falls on cream and reads as depth, but over the teal-tinted basemap it
  // casts a cool halo that makes a #fff control look tinted. Neutral ink here
  // only — the token is right for the rest of the app.
  control: {
    width: CONTROL,
    height: CONTROL,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
    shadowColor: colors.ink,
  },
  searchCard: {
    flex: 1,
    height: CONTROL,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    ...shadow.card,
    shadowColor: colors.ink,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.ink,
    padding: 0,
  },
  results: {
    marginTop: spacing.lg,
    marginStart: CONTROL + spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    overflow: 'hidden',
    ...shadow.card,
    shadowColor: colors.ink,
  },
  resultScroll: {
    maxHeight: 210,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxxl,
  },
  resultDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.sand,
  },
  resultText: {
    ...type.body,
    fontSize: 13,
    color: colors.body,
    flex: 1,
  },
  resultEmpty: {
    ...type.body,
    fontSize: 13,
    color: colors.muted,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxxl,
  },
  controlStack: {
    position: 'absolute',
    end: spacing.huge,
    bottom: spacing.huge,
    gap: spacing.xl,
    alignItems: 'center',
  },
  recenter: {
    backgroundColor: colors.teal,
    ...shadow.cta,
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.sheet2,
    borderTopRightRadius: radius.sheet2,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.huge,
    gap: spacing.xxl,
    ...shadow.sheet,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.sand,
    marginBottom: spacing.md,
  },
  pickedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  pickedIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.sandChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickedText: {
    ...type.bodyStrong,
    color: colors.ink,
    flex: 1,
  },
  input: {
    borderRadius: radius.control,
    backgroundColor: colors.card,
    paddingVertical: 15,
    paddingHorizontal: spacing.huge,
    fontFamily: fonts.semibold,
    fontSize: 15.5,
    color: colors.ink,
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.sand,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  favText: {
    ...type.bodyStrong,
    color: colors.body,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  hint: {
    ...type.body,
    color: colors.muted,
    flex: 1,
  },
});
