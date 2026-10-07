# Tracking shows a demo delivery

Status: fixed
Found: `src/screens/TrackingScreen.tsx`, data at `src/data/menu.ts:490-519`
Summary: The live-tracking screen always renders order #4821 arriving in eighteen minutes along a fixed Karrada-to-Jadriyah route, whatever the customer actually ordered.

## Details
Fixed: Tracking now shows the real active order from `OrdersContext` — its number and lines — with its step and minutes left read off `placedAt` and `DELIVERY_MINUTES` (see [[order-status-never-advances]]). The fake driver and the fixed 18-minute ETA are gone, as are `trackingOrder`, `trackingSteps`, `trackingHeadlines`, `trackingProgress` and `DEFAULT_TRACKING`. With nothing in flight it shows an empty state. The route is still demo geography until a directions API exists.

The original report follows.

`TrackingScreen` reads `trackingOrder`, `trackingRoute` and `trackingProgress`
out of `src/data/menu.ts`, plus the `track.*` strings. It never takes an
`Order`: the number, the meal, the minutes, both map endpoints, the driver's
name and the driver's role are all sample data, and the progress along the route
is a fixed fraction per status rather than a position.

It is reachable from three real places — the live-order card on
[[orders]], `SubscriptionPanel` on [[plans]], and [[cart]], whose `confirm()`
resets the stack onto `Tracking`. So the screen a customer lands on immediately
after placing a real order is somebody else's delivery.

[[real-customer-data-only]] removed the rest of the fabricated customer state
and deleted the unused `trackingDriver` export, but left this: rebuilding the
screen against a real `Order` is a rewrite plus a driver position and ETA the
API does not serve yet, not a deletion. The demo geography is at least labelled
as demo in `menu.ts`, with `trackingRoute` meant to be swapped for a real
polyline once a directions API exists.

## Related
- Page: [[tracking]], [[orders]], [[cart]], [[plans]], [[inbox]]
- Feature: [[real-customer-data-only]]
