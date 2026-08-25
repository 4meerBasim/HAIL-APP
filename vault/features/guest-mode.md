# Guest mode

Status: shipped
Summary: A signed-out customer can browse subscriptions and meals but cannot build a plan, subscribe, order, or see any history or notifications.

## Details
`AuthContext.status` is `'loading' | 'guest' | 'authed'`. Everything below keys off it.

**Nothing is inherited from the last account.** All three were real leaks:
- `CartContext` — the three demo lines are seeded in an effect gated on `authed`, and only into an empty cart, so a guest who filled one and signed in keeps their own picks. Sign-out clears it.
- `OrdersContext` — a guest gets `[]`, not just the demo receipts but the stored ones too. Emptied in the context so the tab bar's live dot, the tracker and the receipt list all agree. `placeOrder` also refuses for a guest: ids are numbered against a list that is empty for them.
- `PlanContext` — the subscription is stored on the device, not against the account, so it is read back only when authed and dropped from state on sign-out. The record stays on disk and returns on the next sign-in.
- `NotificationsContext` — empty feed, which takes the bell badge to zero without the header needing to know why.

**Gated actions** all use one pattern — `if (status !== 'authed') { navigation.navigate('Login'); return; }` — asked *before* the work, not after:

| Action | Where |
|---|---|
| Build a plan | `PlansScreen`, `BoxesScreen`, `BoxDetailScreen` |
| Subscribe | `SubscribeScreen` |
| Order | `CartScreen` |
| Catering request | `CateringScreen` |

The Orders tab renders a sign-in prompt rather than a generic empty state — "you haven't ordered yet" would be the wrong reason.

## Related
- Page: [[login]], [[plans]], [[boxes]], [[box-detail]], [[subscribe]], [[cart]], [[orders]], [[profile]], [[menu]], [[plan-builder]]
- Feature: [[logout-confirmation]], [[phone-otp-sign-in]]
