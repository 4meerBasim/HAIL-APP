# Reorder drops the built meal

Status: fixed
Found: `src/screens/OrderDetailScreen.tsx:52, src/screens/PastOrdersScreen.tsx:65`
Summary: Reordering called `addItem(dishId, qty)` with no build, so a built meal came back as the free, empty "meal of your choice" placeholder.

## Details
Order lines now carry the `build` they were made from, and `CartContext.addLines` re-adds each line with it. Lines for the built meal saved before builds were recorded have nothing to rebuild from and are skipped.

## Related
- Page: [[orders]], [[cart]], [[menu]]
