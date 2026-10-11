# Bundled Leaflet

Status: shipped
Summary: The map and tracking screens load Leaflet from the app bundle instead of unpkg.

## Details
`src/vendor/leaflet.ts` holds Leaflet 1.9.4's `dist/leaflet.css` and `dist/leaflet.js`, copied verbatim from the npm package as two string constants. `MapScreen` and `TrackingScreen` inline them into the WebView HTML (`<style>` and `<script>`) in place of the two `unpkg.com` tags. A file in `assets/` would need `expo-file-system` to read at runtime, and Metro cannot import a `.js` file as text, so a TS module is the dependency-free way to ship it.

Every app image (logo, patterns, catering, offers, dish placeholder) was already a local `require` from `assets/`. What still needs the network: map tiles from `basemaps.cartocdn.com` (a city at street zoom is far too large to bundle) and address search / reverse geocoding from Nominatim. Leaflet's CSS references `images/*.png` for its default marker and layer control; neither screen uses them (pins are `divIcon`s), so those images are not shipped.

Unverified on a device: typechecks only.

## Related
- Page: [[map]], [[tracking]]
- Features: [[on-device-sign-in]]
- Bugs: [[carto-tiles-need-api-key]]
