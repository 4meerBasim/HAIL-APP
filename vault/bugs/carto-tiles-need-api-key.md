# Map tiles need a CARTO API key

Status: not-fixed
Found: `src/screens/MapScreen.tsx:112`, tracking map (seen on the Android emulator)
Summary: The address picker and the order tracking map show blank tiles stamped "API KEY REQUIRED · carto.com/basemaps/apikey".

## Details
Both maps load `basemaps.cartocdn.com/light_all` with no key, and CARTO now
watermarks keyless requests. Needs a CARTO key, or a different tile provider
whose terms allow use from a mobile app. On the tracking map the "You" pin label
is also clipped to "Yo".

## Related
- Feature: [[bundled-leaflet]]
- Page: [[map]], [[tracking]]
