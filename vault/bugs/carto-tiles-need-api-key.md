# Map tiles need a CARTO API key

Status: fixed
Found: `src/screens/MapScreen.tsx:112`, tracking map (seen on the Android emulator)
Summary: The address picker and the order tracking map show blank tiles stamped "API KEY REQUIRED · carto.com/basemaps/apikey".

## Details
Both maps load `basemaps.cartocdn.com/light_all` with no key, and CARTO now
watermarks keyless requests. Needs a CARTO key, or a different tile provider
whose terms allow use from a mobile app. On the tracking map the "You" pin label
is also clipped to "Yo".

## Fix
Both WebView maps now load `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
(keyless, no `{s}`/`{r}` placeholders, maxZoom 19) with the required
`&copy; OpenStreetMap contributors` attribution left visible on the map. No API
key and no new dependency. The clipped destination pill on the tracking map is
fixed by centring the `.cap` caption over its point with `translateX(-50%)`, so a
label at the route's end no longer grows off the map edge past the fitBounds
padding. README's tech-stack Maps row now reads "OpenStreetMap tiles".

## Related
- Feature: [[bundled-leaflet]]
- Page: [[map]], [[tracking]]
