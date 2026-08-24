# Subscription pricing

Status: shipped
Summary: A box's headline price is what a month on it actually costs, with the meals-a-day and the length under it.

## Details
The card and the box page showed `boxTotal(box)` — one turn of the rotation, roughly two days — under a label reading "Box total". Both now show `priceOf(planFromBox(box)).total`, the same call Subscribe makes, so the number does not move when the customer gets there.

Default plan: 30 days × Sun–Thu = 22 deliveries, with the 15% duration discount.

The line under it is `planRhythm` — "3 وجبات باليوم · لمدة شهر" — sharing one helper between the card and the page so they cannot drift. Arabic counts one, two, 3–10 and 11+ differently, so it goes through `i18n/count.ts`.

Removed as dead: `boxTotal`, `boxPerMeal`, `boxes.avgPerMeal`. The average per meal was not a number anyone decides on.

Trade accepted: the box page footer no longer equals the sum of the meals listed above it. The list is one rotation, the price is a month.

## Related
- Page: [[box-detail]], [[boxes]], [[plans]], [[subscribe]]
- Feature: [[multi-select-dishes]], [[full-day-macros]]
