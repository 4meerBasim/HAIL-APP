# Receipt omits checkout charges

Status: fixed
Found: `src/screens/OrderDetailScreen.tsx:105-124`
Summary: The order receipt listed subtotal and delivery only, so it never added up to the total it printed: the service fee and any subscriber discount were missing, and every line was priced at today's menu price rather than what was charged.

## Details
Checkout now records `unit` per line and `charges` (discount, delivery, service) and `payment` on the `Order` (`src/data/menu.ts`). `orderCharges(order)` falls back to the flat fees for orders saved before charges were recorded. The receipt draws discount (when above zero), delivery and service from it, reusing `cart.discount`, `cart.delivery` and `cart.service`, so the lines sum to `orderGrandTotal`.

## Related
- Page: [[orders]], [[cart]]
