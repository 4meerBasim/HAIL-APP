# Swiped dish page arrived without its edit options

Status: fixed
Found: `src/screens/DishDetailScreen.tsx`
Summary: Swiping to the next meal showed the page with no size or extras controls for a frame, then they appeared.

## Details
`MealBuildContext` holds one dish's build at a time and is pointed at the new dish from an effect — which lands *after* the render it belongs to. The old gate `build.dishId === dish.id` was therefore false on the first frame of every page you swiped to, so it rendered with `build={null}`.

Fixed with `buildFor(dishId, active)`, which returns the context's build when it matches and a plain `emptyBuild(dishId)` otherwise — exactly what `start()` is about to set. The default size is free, so the swap is invisible. Unit price moved to `priceWith(dish, build)` per page so it matches the controls shown.

A separate earlier gap in the same area: the saved-build lines were computed only for the active index and passed as `[]` to every other page. Now `savedFor(dishId)`.

## Related
- Page: [[dish-detail]], [[single-meals]]
