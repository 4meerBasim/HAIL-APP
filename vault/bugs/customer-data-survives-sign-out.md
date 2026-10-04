# Customer data survives sign out

Status: not-fixed
Found: `src/state/AuthContext.tsx:267-271`
Summary: Sign-out removes only the session key, so the next customer to sign in on the same handset inherits the last one's orders, subscription, card and addresses.

## Details
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
