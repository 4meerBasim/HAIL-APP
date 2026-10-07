# Box detail calls a hook after an early return

Status: fixed
Found: `src/screens/BoxDetailScreen.tsx:49,65`
Summary: The unknown-box early return sat above a `useMemo`, breaking the Rules of Hooks, and rendered an empty screen with no way back.

## Details
The memo runs above the return and tolerates a missing box. An unknown id now shows `box.missing` and a back button.

## Related
- Page: [[box-detail]]
