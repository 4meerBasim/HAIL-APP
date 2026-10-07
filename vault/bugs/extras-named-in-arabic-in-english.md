# Sweets and drinks named in Arabic in English mode

Status: fixed
Found: `src/screens/MealExtrasScreen.tsx`, `src/screens/DishDetailScreen.tsx`
Summary: Added sweets and drinks were labelled with the raw `item.name`, which is Arabic, whatever the language.

## Details
Both screens now name them through `useOrderText().dishName`, the same localised lookup `MealRow` uses.

## Related
- Page: [[dish-detail]]
- Feature: [[language-switching]]
