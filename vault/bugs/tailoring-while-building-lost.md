# Tailoring a meal while building was lost

Status: fixed
Found: `src/screens/DishDetailScreen.tsx` `saveEdit`
Summary: A meal opened from the builder, the plan menu or Subscribe saved its size and extras onto the running subscription, so nothing reached the plan being confirmed.

## Details
`DishDetail` takes a `building` param; `setMealBuild` takes a target (`plan` or `subscription`). Builds made while building live on the plan state and are carried into the subscription by `confirm`.

## Related
- Page: [[dish-detail]], [[plan-builder]], [[subscribe]]
- Bugs: [[tailoring-not-priced]]
