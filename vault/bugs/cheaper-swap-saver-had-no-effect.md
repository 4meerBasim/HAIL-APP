# Cheaper-swap saver edited the wrong field

Status: fixed
Found: `src/data/plan.ts` `applySaverTo` `swapCheaper`
Summary: The saver rewrote `dishIds` and `slots` but not the grid they are derived from, so the swap was undone by the next `gridOf` and the saving it advertised never arrived.

## Details
The swap is now made cell by cell in the grid and written back through `withGrid`.

## Related
- Page: [[subscribe]]
- Feature: [[subscription-pricing]]
