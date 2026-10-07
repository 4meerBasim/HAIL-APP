# Order status never advances

Status: fixed
Found: `src/screens/TrackingScreen.tsx:168,209, src/screens/OrdersScreen.tsx:120`
Summary: A just-placed order showed "On the way" immediately and stayed live forever; the Live pill on tracking cycled the status on tap as a demo control.

## Details
Status is derived from the clock: `trackingStatusOf` in `src/data/menu.ts` reads preparing for the first `PREP_MINUTES`, then on the way until the late end of `DELIVERY_MINUTES`, then delivered. `OrdersContext` reads an active order past that point as delivered and schedules one timer for the moment it lands, so the Orders tab, the tab-bar live dot and Tracking agree. Tracking re-reads the clock every 30 s while mounted; Orders every minute. The tap-to-cycle control is gone.

## Related
- Page: [[tracking]], [[orders]]
- Bugs: [[tracking-shows-demo-order]]
