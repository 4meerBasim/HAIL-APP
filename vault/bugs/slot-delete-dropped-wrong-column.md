# Deleting a meal time dropped the wrong dishes

Status: fixed
Found: `src/data/plan.ts` `withoutSlot`
Summary: Removing a meal time shortened `mealSlots` but not the grid, so `gridOf` trimmed the last column and every remaining slot inherited its neighbour's dishes.

## Details
Hit by the trash chip, the sheet's delete and the fewer-meals saver. `withoutSlot` now removes column `idx` from every grid row, merges its dishes into the neighbouring column, and writes back through `withGrid`.

## Related
- Page: [[plan-builder]], [[subscribe]]
- Feature: [[meal-times]]
- Bugs: [[slot-reorder-rehomed-dishes]]
