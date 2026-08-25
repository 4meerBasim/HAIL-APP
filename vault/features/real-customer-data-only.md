# Real customer data only

Status: shipped
Summary: Nothing in the app invents a customer's history any more — the cart, the receipts, the notification feed, the saved addresses and the name in the greeting are real or empty.

## Details
Sign-in used to be a mock, so the app seeded demo data the moment
`AuthContext.status` became `'authed'` — otherwise there was nothing to show.
[[phone-otp-sign-in]] made sign-in real, and that same seeding then fabricated
history for real customers: receipts they never placed, addresses they never
saved, a name that was not theirs.

Removed, context by context:

| Context | Was | Now |
|---|---|---|
| `CartContext` | three demo lines (`SEED` / `INITIAL_ITEMS`) seeded into an empty authed cart, guarded by a `seeded` ref | the effect only clears the cart on sign-out. A guest who filled a cart still keeps their own picks through signing in |
| `OrdersContext` | `DEMO_ORDERS` — six delivered receipts, #4815–#4820 — merged ahead of the stored ones | the stored orders alone. Guest-gating and `placeOrder`'s refusal for a guest are unchanged |
| `NotificationsContext` | five seeded events | empty. `clearAll` sweeps the live list rather than writing the seed ids, and the `Notification` interface moved into the file |
| `LocationContext` | a Karrada "home" and an Al-Mansour "work" | the list starts `[]`, `selected` is nullable, and `SavedLocation.labelKey` went with the seed |
| `PlansScreen` | the greeting hardcoded «سارة» / "Sara" | `home.greeting` interpolates the real API name, with `home.greeting.plain` for a phone-only sign-in that has none |

`src/data/demoOrders.ts` and `src/data/notifications.ts` are deleted, and the
unused `trackingDriver` export («كرار محمد») went out of `src/data/menu.ts` with
them.

**The empty states are the point.** `OrdersScreen`'s authed-but-empty branch
(`orders.empty.*`) was unreachable while six receipts were always present, so it
had never actually been seen; it is now the first thing a new customer gets.
`AddressesScreen` gained a matching one — icon, title, sub, and an add button
into [[map]] — and `LocationPicker` an empty line. `CartScreen` no longer falls
back to a fake Baghdad address: with nothing selected it prompts for one, and
`confirm()` routes to [[map]] rather than placing an order with nowhere to go.
`removeLocation` no longer refuses to empty the list, so a customer can delete
their last address.

i18n: added `common.add`, `location.add`, `addresses.empty.title`,
`addresses.empty.sub`, `home.greeting.plain`; removed the seeded `notif.*`
events, `cart.address`, `location.home` and `location.work`; `home.greeting`
now takes `{name}`. `npx tsc --noEmit` passes.

Nothing fabricates a subscription — but a first sign-in can still show one,
because sign-out leaves the last account's data on the device. That is
[[customer-data-survives-sign-out]], and it is a separate problem.

## Related
- Page: [[plans]], [[cart]], [[orders]], [[addresses]], [[map]], [[inbox]], [[profile]], [[login]]
- Feature: [[guest-mode]], [[phone-otp-sign-in]], [[logout-confirmation]]
- Bugs: [[customer-data-survives-sign-out]], [[tracking-shows-demo-order]], [[greeting-always-says-good-evening]], [[seeded-addresses-survive-upgrade]], [[location-hydration-has-no-loaded-flag]], [[unnamed-pin-label-inconsistent]], [[cart-map-preview-without-an-address]], [[clear-all-drops-older-cleared-ids]]
- Enhancements: [[real-notification-source]]
