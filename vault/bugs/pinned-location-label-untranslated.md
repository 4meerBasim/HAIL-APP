# "Pinned location" stays in English in Arabic

Status: fixed
Found: Plans header address label (seen on the Android emulator)
Summary: The home-screen delivery address reads "Pinned location" under Arabic instead of an Arabic label.

## Details
The label for an address saved from a map pin is stored or rendered as English
text rather than looked up through `t()` at render, so it does not follow the
language.

## Fix
A shared `locationLabel(location, t)` now lives in `LocationContext`, and the
four render sites (`PlansScreen`, `CartScreen`, `AddressesScreen`,
`LocationPicker`) resolve the display name through it instead of
`label || t('location.pinned')`. The helper returns the typed name when there is
one, and otherwise `t('location.pinned')` — so an unnamed pin follows the current
language. It also treats a stored copy of the "Pinned location" literal in either
language (the frozen value old pins saved) as unnamed, so already-saved English
rows now translate too. `MapScreen` no longer freezes the literal on save: an
unnamed pin stores an empty label and is resolved at render.

## Related
- Feature: [[language-switching]]
- Page: [[plans]], [[map]]
- Bugs: [[unnamed-pin-label-inconsistent]]
