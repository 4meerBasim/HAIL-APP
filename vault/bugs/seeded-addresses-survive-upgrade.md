# Seeded addresses survive the upgrade

Status: not-fixed
Found: `src/state/LocationContext.tsx:4`, read back at `src/state/LocationContext.tsx:36-45`
Summary: The storage key is unchanged, so the fabricated home and work rows the previous build wrote to `@jareesh/locations` hydrate back on an existing install — blank-titled, because the field they were named through is gone.

## Details
[[real-customer-data-only]] deleted the seed array, but not what the seed had
already written. `STORAGE_KEY` is still:

```ts
const STORAGE_KEY = '@jareesh/locations';
```

Every install that ran the previous build has the Karrada "home" and the
Al-Mansour "work" persisted under that key, and the load effect reads it
unconditionally — `stored?.length` is true, so `setLocations(stored)` puts them
straight back and `setSelectedId` points at one of them.

They come back worse than they left. The seed named its rows through
`SavedLocation.labelKey`, which was removed with it; the rows on disk therefore
have no `label` at all, and every render site falls through to an empty string —
see [[unnamed-pin-label-inconsistent]]. The result on an upgraded install is two
untitled addresses the customer never saved, one of them selected, and a cart
that will happily deliver to Karrada.

A fresh install is clean, which is why this does not show up in testing: the
defect only exists where the old build ran first.

The fix is to bump the key — `@jareesh/locations.v2`, with `@jareesh/location-selected`
following it, since a pointer at a discarded id is worse than none. Deleting the
old key on read would also work but is a migration for data that has no value.
Bumping is one line and cannot half-succeed.

## Related
- Page: [[addresses]], [[cart]], [[plans]], [[map]]
- Feature: [[real-customer-data-only]]
- Bugs: [[unnamed-pin-label-inconsistent]], [[location-hydration-has-no-loaded-flag]], [[customer-data-survives-sign-out]]
