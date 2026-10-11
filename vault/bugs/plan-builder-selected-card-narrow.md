# Selected dish card narrower than the total card

Status: fixed
Found: plan builder slot summary (seen on the Android emulator)
Summary: After adding a dish, its summary card is narrower than the "Breakfast total" card under it, leaving a gap at the end edge.

## Details
Seen after picking Penne al forno. The selected-dish card does not stretch to
the full content width the total card uses.

## Fix
The picked dishes render in a horizontal scroller where each card has a fixed
264-wide `mealCard` style, so a single pick left a gap to the end edge while the
meal-time total card below it spanned the full content width. When exactly one
dish is picked it now renders as a plain full-width `MealRow` (no `mealCard`
width, no scroller), matching the total card. Two or more still scroll
horizontally at the fixed width.

## Related
- Feature: [[virtualise-dish-picker]], [[multi-select-dishes]]
- Page: [[plan-builder]]
