# Reordering meal times silently rehomed dishes

Status: fixed
Found: `src/data/plan.ts` — `reorderSlots`
Summary: `reorderSlots` moved `mealSlots` but not the grid columns that index into them, so every successful drag reassigned dishes to the wrong meals.

## Details
`withGrid` maps grid column *i* to `slotIds[i]`. Moving a slot without permuting the columns therefore changed which meal each dish belonged to — a data corruption, not a cosmetic bug, and invisible at the moment it happened.

Fixed by deleting `reorderSlots` and replacing it with `sortSlotsByTime`, which moves the cells with the slots.

## Related
- Page: [[plan-builder]]
- Feature: [[chronological-meal-order]]
- Bug: [[drag-reorder-unreliable]]
