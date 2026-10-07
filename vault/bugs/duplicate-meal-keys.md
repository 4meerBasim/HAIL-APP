# Duplicate React keys on plan meal lists

Status: fixed
Found: `src/screens/PlanMenuScreen.tsx`, `src/components/UpcomingMeals.tsx`
Summary: Lists were keyed by `dishId`, but a rotation can carry the same dish twice, giving duplicate keys and mis-reconciled rows.

## Details
Keys now include the row index.

## Related
- Page: [[subscribe]]
- Feature: [[multi-select-dishes]]
