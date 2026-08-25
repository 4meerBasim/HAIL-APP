# A real notification source

Status: planned
Summary: The inbox is permanently empty — nothing in the app or the API produces a notification for it to show.

## Notes
[[real-customer-data-only]] deleted `src/data/notifications.ts` and the five
seeded events that were the feed's only content. What is left is the machinery
without a source: `NotificationsContext` still derives `items`, counts unread
for the bell badge, persists read and cleared ids under
`@jareesh/notifications-read` / `-cleared`, and exposes `markRead` and
`clearAll` — all over an array that is always empty. `InboxScreen` therefore
always renders its empty state, and the badge is always zero.

That was the right trade for the sign-in pass: an empty feed is honest, five
invented deliveries were not. But an order-tracking app with a bell that can
never ring is a hole, not a finished state.

Wiring it needs both halves:
- API: notifications for the events the app already models — order placed,
  out for delivery, delivered, a subscription delivery tomorrow, a skipped or
  postponed day.
- App: fetch them into `NotificationsContext` alongside the read/cleared ids it
  already keeps, and give each one a destination the way the seed items did
  (`Tracking`, `PastOrders`, or a tab).

Two things to settle first: the ids must be stable, or the read and cleared
lists point at nothing after a refetch; and they must be scoped per account, or
they inherit the problem in [[customer-data-survives-sign-out]].

## Related
- Page: [[inbox]], [[plans]], [[profile]]
- Feature: [[real-customer-data-only]], [[guest-mode]]
- Bugs: [[customer-data-survives-sign-out]], [[clear-all-drops-older-cleared-ids]]
