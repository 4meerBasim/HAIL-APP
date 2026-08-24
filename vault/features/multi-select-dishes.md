# Multi-select dishes

Status: shipped
Summary: A meal time holds as many dishes as the customer picks, and each one is a meal that is delivered and paid for.

## Details
A grid cell was `string | null` — one dish per meal time per day. It is now `string[]`, and tapping a dish toggles it in or out.

Pricing follows: `mealsPerDayOf` was `mealSlots.length` (the number of meal *times*) and is now the dishes-per-day average off the grid. `mealCount` no longer multiplies an average — it walks the rotation across the delivery days and sums, because days need not carry the same number of dishes.

Worked example: adding one dish to day 1's breakfast on the balanced box takes the month from 22 meals / 117,000 to 26 meals / 138,250 — day 1 recurs four times in 22 delivery days.

`rotationDaySlots` keeps the day → slot → meals nesting for anything that labels a meal with its time; `rotationDays` flattens it.

## Related
- Page: [[plan-builder]], [[box-detail]]
- Feature: [[meal-times]], [[subscription-pricing]]
- Bugs: [[empty-cell-truthiness]], [[slot-labels-wrong-under-multi-select]]
