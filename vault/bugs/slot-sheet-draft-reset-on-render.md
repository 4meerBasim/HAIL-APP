# Meal-time sheet reset its draft on every render

Status: fixed
Found: `src/components/SlotSheet.tsx`
Summary: The reset effect depended on the `initial` object, which the builder recreates every render, so any re-render above wiped what was being typed.

## Details
The effect now depends on the initial name and time values.

## Related
- Page: [[plan-builder]]
- Feature: [[meal-times]], [[time-picker]]
