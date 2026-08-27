# Ingredient weights and macros

Status: shipped
Summary: On اصنع وجبتك the customer sets how many grams of rice, chicken, salad or sauce goes in the box; the price and the nutrition figures both follow the weight, and the running total rides along on every step.

## Details

**Weights.** Every ingredient in `src/data/ingredients.ts` now carries the
amount the kitchen packs by default (`grams`), the amount one press moves
(`step`), whether the customer sets it at all (`byWeight`), and its nutrition
per 100g (`per100`). A picked `byWeight` part grows a `Stepper` under its card
on [[menu]].

`byWeight` sits on the **item**, not the group, because a group is not uniform:
a samoon is one or none while the rices beside it are weighed, and the same goes
for an egg among the extras. Pieces still carry a weight so they count toward
the meal's nutrition — they just have no control.

Range is one step to three times the default. `changeGrams` snaps to the part's
own step and clamps to that range, so a held button cannot walk the figure past
either end. A weight equal to the default is **not** stored — an absent entry
means "as the kitchen packs it", so the meal carries only what was actually
changed. Taking a part off drops its weight with it.

**Price.** `ingredientPriceAt(id, grams)` scales the listed price by
`grams / defaultGrams` and lands on the 250-dinar step the whole app quotes in,
with a floor of one step so a small sauce never rounds down to free. `mealPrice`
sums the box. The old flat `ingredientPrice` was removed — nothing called it
once the weight-aware version existed.

**Macros.** `ingredientMacrosAt` scales `per100` by the weight and `mealMacros`
sums the box. The figures render in a `MacroRow` (`size="sm"`, `onDark`) inside
the teal box at the top of [[menu]] — which is the one element that travels with
the customer through every step, so the numbers move as each part goes in, while
a choice about them can still be made.

**Cart.** The build key sent to `CartContext` is now `id@grams` per part, not
just the id: 200g of kebab and 350g of it are different lines on the kitchen's
docket and must not collapse into one. The line label names each weight too.

## Related
- Page: [[menu]], [[cart]]
- Features: [[ingredient-photo-placeholders]], [[full-day-macros]], [[built-meal-detail-from-cart]]
- Bugs: [[grams-stepper-collapsed-in-card]]
