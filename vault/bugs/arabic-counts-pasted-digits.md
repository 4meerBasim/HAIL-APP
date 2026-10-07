# Arabic counts paste a digit before a fixed plural

Status: fixed
Found: `src/screens/OrdersScreen.tsx:115,166, src/screens/OrderDetailScreen.tsx:72, src/screens/PastOrdersScreen.tsx:85,120, src/i18n/orderText.ts:46, catering.short`
Summary: Item, order, day and guest counts were a digit in front of one fixed noun ("1 أصناف", "قبل 2 يوم", "ناقص 1 ضيف").

## Details
All go through `count()` with one / two / few / many keys: `count.items`, the new `count.orders`, `orders.when.daysAgo.*` and `catering.short.*`. The flat `orders.items` and `orders.past.count` keys are gone.

## Related
- Page: [[orders]], [[plans]]
