# Location storage error never hydrates

Status: fixed
Found: `src/state/LocationContext.tsx:46`
Summary: A corrupt or unreadable address list threw out of the load effect, so `hydrated` stayed false forever.

## Details
`JSON.parse` and `multiGet` ran with no `try`, and `setHydrated(true)` sat after them. Any throw left every screen that waits on `hydrated` showing nothing instead of the empty state. Now wrapped, and `hydrated` is set either way.

## Related
- Page: [[addresses]], [[map]], [[cart]]
- Bugs: [[location-hydration-has-no-loaded-flag]]
