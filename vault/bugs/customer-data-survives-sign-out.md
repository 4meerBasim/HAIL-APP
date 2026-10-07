# Customer data survives sign out

Status: fixed
Found: `src/state/AuthContext.tsx:267-271`
Summary: Sign-out removes only the session key, so the next customer to sign in on the same handset inherits the last one's orders, subscription, card and addresses.

## Details
Fixed by clearing on sign-out rather than scoping per account.
`AuthContext.signOut` now `multiRemove`s the session plus every key no other
context clears for itself — `@hail/card`, `@hail/payment-method`, `@hail/drop`,
`@hail/notifications-read`, `@hail/notifications-cleared`,
`@hail/notifications`, `@hail/locations.v2`, `@hail/location-selected.v2`.
Orders and the subscription are cleared by `OrdersContext` and `PlanContext`,
which own those keys and watch for `status === 'guest'`. The in-memory copies go
too: `LocationContext` and `NotificationsContext` reset on the authed → guest
edge, and `useStoredState`'s `reload` falls back to the initial value when a key
is gone, so the payments list stops showing the old card on focus.

What follows is the original report.

`signOut` drops the session from state and calls
`AsyncStorage.removeItem(SESSION_KEY)`. Everything else the app has written is
device-scoped and stays on disk:

| Key | Written by | What it holds |
|---|---|---|
| `hail.orders.v2` | `OrdersContext` | every receipt |
| `@hail/subscription` | `PlanContext` | the running plan |
| `@hail/card` | `AddCardScreen` | the saved card |
| `@hail/payment-method` | `PaymentsScreen` | cash or card |
| `@hail/locations`, `@hail/location-selected` | `LocationContext` | the saved addresses and which is chosen |
| `@hail/notifications-read`, `@hail/notifications-cleared` | `NotificationsContext` | read and cleared ids |
| `@hail/drop` | `CartScreen` | hand-over preference |

[[guest-mode]] reads these back only when `status === 'authed'`, which hides
them from a signed-out browser — but not from the *next account*. Customer B
signing in on a phone customer A used sees A's order history, A's subscription,
A's card and A's addresses. On a shared, sold or repaired handset that is a real
privacy leak, not a cosmetic one.

It is also the reason a first sign-in can still show a subscription now that
[[real-customer-data-only]] has stopped anything fabricating one: nothing made
it up — it was simply left behind.

The fix is to scope this storage per account, keying it on the user id, or to
clear every key in `signOut`. Not more `authed` checks: the gating already
works, it is the wrong axis. Out of scope for the sign-in wiring pass, where the
account id has only just become real.

## Related
- Page: [[login]], [[profile]], [[orders]], [[cart]], [[addresses]]
- Feature: [[real-customer-data-only]], [[guest-mode]], [[logout-confirmation]], [[phone-otp-sign-in]]
- Bugs: [[seeded-addresses-survive-upgrade]], [[clear-all-drops-older-cleared-ids]]
- Enhancements: [[revoke-token-on-sign-out]], [[real-notification-source]]
