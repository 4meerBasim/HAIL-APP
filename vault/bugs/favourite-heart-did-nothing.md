# Favourite heart did nothing

Status: fixed
Found: `src/screens/DishDetailScreen.tsx`
Summary: The heart on the dish page toggled local state only; there is no favourites store, so the choice vanished on leaving the page.

## Details
Removed, with its style and the `detail.favorite` string.

## Related
- Page: [[dish-detail]]
