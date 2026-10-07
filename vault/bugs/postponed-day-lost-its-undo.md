# Postponed days lost their Undo and undercounted

Status: fixed
Found: `src/data/plan.ts` `deliveryDays`, `src/components/UpcomingDays.tsx`
Summary: The upcoming list looked exceptions up by the moved-to day, so a postponed row showed as normal with no Undo, and a postpone landing on another delivery was deduplicated away while the price still charged for both.

## Details
`deliveries(plan)` now returns one entry per scheduled day with its original `dayIndex`, the day it arrives (`at`) and its place in the run. The price, progress and the list all walk the same entries. Skipped days and days pushed off the end stay listed (dimmed, with Undo) so they can be reversed.

## Related
- Page: [[upcoming]], [[plans]]
- Feature: [[day-actions-labelled]], [[subscription-pricing]]
