# An unnamed pin renders differently on every screen

Status: fixed
Found: `src/screens/CartScreen.tsx:202`, `src/screens/PlansScreen.tsx:126`, `src/screens/AddressesScreen.tsx:60`, `src/components/LocationPicker.tsx:64`
Summary: A `SavedLocation` with no `label` renders as a blank line in the cart, the addresses list and the picker, but as the add-address prompt on the home header — four sites, three different answers to the same missing field.

## Details
Fixed: All four sites now render `label || t('location.pinned')`.

The original report follows.

`SavedLocation.label` is optional (`src/state/LocationContext.tsx:11`) and no site
has a shared fallback:

| Site | Code | Renders |
|---|---|---|
| `src/screens/CartScreen.tsx:202` | `selected ? (selected.label ?? '') : t('location.add')` | empty line above the address |
| `src/screens/AddressesScreen.tsx:60` | `const name = l.label ?? ''` | empty row title, and an accessibility label of `" · <address>"` |
| `src/components/LocationPicker.tsx:64` | `{l.label ?? ''}` | empty line above the address |
| `src/screens/PlansScreen.tsx:126` | `selected?.label ?? t('location.add')` | «أضف عنوان التوصيل» — asks for an address that exists |

The home header is the one that actively misleads: `selected` is set, the address
is saved, and the app still says add one.

`location.pinned` — «موقع محدد» / "Pinned location" — already exists at
`src/i18n/strings.ts:78` and `:758`, and is applied at exactly one place:
`src/screens/MapScreen.tsx:251`, where `label.trim() || t('location.pinned')`
means a *newly* saved pin can no longer be nameless. That closes the entry path,
not the defect. Two ways in remain:

- Rows already on disk from before that guard, including the seeded home and
  work rows — which are still read back, because the storage key was never
  bumped. That is [[seeded-addresses-survive-upgrade]], and it is what makes this
  bug reachable today rather than theoretical.
- Any future writer of `saveLocation`, since the field is optional in the type
  and the default lives in one screen rather than in the context.

The fix is `label || t('location.pinned')` at all four render sites — `||`, not
`??`, so a saved empty string is caught too. Better still, default it in
`LocationContext` so the type stops being optional at the boundary and the four
sites cannot drift apart again.

## Related
- Page: [[cart]], [[plans]], [[addresses]], [[map]]
- Feature: [[real-customer-data-only]]
- Bugs: [[seeded-addresses-survive-upgrade]], [[location-hydration-has-no-loaded-flag]], [[cart-map-preview-without-an-address]]
- Bugs: [[pinned-location-label-untranslated]]
