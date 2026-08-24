# Meal-time labels wrong once a slot held two dishes

Status: fixed
Found: `src/screens/BoxDetailScreen.tsx`
Summary: The box page paired each meal with `mealSlots[index]` from the day's flattened list, so a slot's second dish showed the *next* meal time's name and hour.

## Details
Introduced by [[multi-select-dishes]]: once a cell holds more than one dish, a meal's position in the flat list is no longer its slot's index.

Fixed by adding `rotationDaySlots` (day → slot → meals) alongside `rotationDays`, which is now derived from it so the two cannot disagree. The page prints each meal time once with its dishes grouped under it.

## Related
- Page: [[box-detail]]
- Feature: [[multi-select-dishes]], [[meal-times]]
