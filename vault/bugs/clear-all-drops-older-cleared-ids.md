# Clearing the inbox forgets what was already cleared

Status: not-fixed
Found: `src/state/NotificationsContext.tsx:70-72`
Summary: `clearAll` overwrites the cleared set with the ids currently visible, but `items` has already had the cleared ones filtered out — so every sweep discards the previous one, and a cleared notification comes back the moment a real feed exists.

## Details
```ts
const clearAll = useCallback(() => {
  setCleared(items.map((n) => n.id));
}, [items, setCleared]);
```

`items` is built at `src/state/NotificationsContext.tsx:49-57` as
`FEED.filter((n) => !cleared.includes(n.id))`. The one thing that is guaranteed
absent from `items` is everything already in `cleared`. Assigning
`items.map(...)` therefore does not add to the set — it replaces it with its
complement.

Clear the inbox, receive two more notifications, clear again: the second sweep
writes only those two ids, the first batch is no longer in `@jareesh/notifications-cleared`,
and it reappears on the next render. The customer clears their inbox and it
refills with things they already dismissed.

It cannot be observed right now. `FEED` is `[]` (`src/state/NotificationsContext.tsx:39`)
since [[real-customer-data-only]] deleted the seeded events, so `items` is always
empty, `clearAll` always writes `[]`, and `[]` over `[]` is a no-op. The defect is
latent, waiting on [[real-notification-source]] — which is precisely the reason to
fix it now rather than discover it as a mystery regression the week the feed goes
live.

The fix is a union rather than a replacement, e.g.
`setCleared([...new Set([...cleared, ...items.map((n) => n.id)])])`, with
`cleared` added to the callback's deps. Bounding that list is a separate question
for whoever wires the real feed — a cleared set that only ever grows needs the ids
to be stable, which [[real-notification-source]] already flags.

## Related
- Page: [[inbox]], [[plans]]
- Feature: [[real-customer-data-only]]
- Bugs: [[customer-data-survives-sign-out]]
- Enhancements: [[real-notification-source]]
