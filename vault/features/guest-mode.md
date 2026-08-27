# Guest mode

Status: shipped
Summary: A signed-out customer can browse subscriptions and meals but cannot build a plan, subscribe, order, or see any history or notifications.

## Details
`AuthContext.status` is `'loading' | 'guest' | 'authed'`. Everything below keys off it.

**A guest inherits nothing from the last account.** All four were real leaks:
- `CartContext` — sign-out empties the cart, and since [[real-customer-data-only]] that is all the effect does: nothing is put into it on sign-in either. A guest who filled a cart and then signs in to order it keeps their own picks, which is the one thing that deliberately survives.
- `OrdersContext` — a guest gets `[]`, not the stored receipts. Emptied in the context so the tab bar's live dot, the tracker and the receipt list all agree. `placeOrder` also refuses for a guest: ids are numbered against a list that is empty for them. For a signed-in customer with no orders yet, `OrdersScreen`'s `orders.empty.*` state is now what shows.
- `PlanContext` — the subscription is stored on the device, not against the account, so it is read back only when authed and dropped from state on sign-out. The record stays on disk and returns on the next sign-in.
- `NotificationsContext` — empty feed, which takes the bell badge to zero without the header needing to know why. Empty for everyone now, not only a guest — see [[real-notification-source]].

The gating is per-status, not per-account: the stored orders, subscription, card and addresses stay on the device through a sign-out, so a *different* account signing in on the same handset does inherit them. That is [[customer-data-survives-sign-out]].

**Gated actions** all use one pattern — `if (status !== 'authed') { navigation.navigate('Login'); return; }` — asked *before* the work, not after:

| Action | Where |
|---|---|
| Build a plan | `PlansScreen`, `BoxesScreen`, `BoxDetailScreen` |
| Subscribe | `SubscribeScreen` |
| Order | `CartScreen` |
| Catering request | `CateringScreen` |

The Orders tab renders a sign-in prompt rather than a generic empty state — "you haven't ordered yet" would be the wrong reason.

## Related
- Page: [[login]], [[plans]], [[boxes]], [[box-detail]], [[subscribe]], [[cart]], [[orders]], [[profile]], [[menu]], [[plan-builder]], [[inbox]]
- Feature: [[logout-confirmation]], [[phone-otp-sign-in]], [[real-customer-data-only]]
- Bugs: [[customer-data-survives-sign-out]], [[guest-orders-login-button-misaligned]]
- Enhancements: [[real-notification-source]]
