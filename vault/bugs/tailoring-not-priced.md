# Meal tailoring was not priced into the plan

Status: fixed
Found: `src/data/plan.ts` `buildMeals`/`priceOf`
Summary: A double portion (+5,000) or added extras, sweets and drinks were saved on a plan meal but the plan price ignored them.

## Details
Each line is now the dish's subscription price plus its build surcharge (size, extras, items at menu price), used by `buildMeals`, `rotationTotal` and so every price shown for the plan.

## Related
- Page: [[subscribe]], [[plans]], [[dish-detail]]
- Feature: [[subscription-pricing]]
- Bugs: [[tailoring-while-building-lost]]
