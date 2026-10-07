# Built meal detail from cart

Status: shipped
Summary: Tapping وجبة من اختيارك in the basket opens it read-only — every part at the weight it was ordered at, what each cost, and the meal's nutrition.

## Details

A meal assembled on [[menu]] has no record anywhere except the cart line's own
build key (`id@grams+id@grams…`), so that key is what reopens it.
`parseBuildKey` in `src/data/ingredients.ts` reads it back into parts and
weights, restoring the packing order — base first — rather than the sorted order
the key stores them in, since the key is sorted to make two identical meals
collide, not to be read. Ids the menu no longer carries are skipped, so the meal
reads as what can still be cooked.

`DishDetail` takes a new optional `built` route param. When it is present the
page:
- renders an itemised panel of parts, each named with its weight and priced at
  `ingredientPriceAt`, over a grand total;
- sums its `MacroRow` from `mealMacros` instead of the per-dish lookup — a built
  meal has no figures of its own, it is whatever went into it;
- gets **no** size control and no extras row: those belong to plated dishes, not
  to a meal assembled from weighed parts;
- prices from `mealPrice`, because `built-meal`'s listed price is `'0'`;
- drops the ingredients chip row, which would otherwise repeat the panel.

**Add-to-cart carries the build.** Adding from this page re-sends the key it
arrived on, so it lands on the basket line it was opened from as another of the
same meal. Without that it would have added a bare `built-meal` line at the
listed price of zero.

**Both cart layouts carry it.** The basket draws a single line as a `CartRow`
and several as a shelf of `CartItemCard`s, so `onOpen` had to go on both — and
`CartScreen` builds it once in `openBuilt` rather than inline at each call site.
Wiring only the card left the commonest case dead: a built meal is very often
the only thing in the basket, which is exactly the `CartRow` branch.

**Only the head is pressable.** In both components `onOpen` wraps the photo and
the text, never the quantity buttons. A touchable wrapping a touchable is how
the +/- stop responding; see [[time-wheel-blocked-by-pressable]].

## Related
- Page: [[cart]], [[dish-detail]], [[menu]]
- Features: [[ingredient-weights-and-macros]]
