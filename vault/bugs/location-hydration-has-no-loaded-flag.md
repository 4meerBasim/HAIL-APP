# Location hydration has no loaded flag

Status: fixed
Found: `src/state/LocationContext.tsx:30-31`, effect at `src/state/LocationContext.tsx:33-50`
Summary: `locations` is `[]` and `selected` is `null` until AsyncStorage answers, and nothing tells the screens the difference between "still loading" and "no address" — so four of them render the empty state first and a customer with a saved address can be bounced to the map.

## Details
Fixed: `LocationContext` now exposes `hydrated`; Cart, Plans, Addresses and the picker wait on it.

The original report follows.

The provider starts empty and fills in from an effect:

```ts
const [locations, setLocations] = useState<SavedLocation[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);
```

`LocationContextValue` exposes no `hydrated`, so every consumer reads the first
frame as fact:

| Site | First frame shows |
|---|---|
| `src/screens/PlansScreen.tsx:126` | `t('location.add')` — the add-address prompt, in the header of a customer who has one |
| `src/screens/AddressesScreen.tsx:41` | the full empty state — icon, title, sub, add button |
| `src/components/LocationPicker.tsx:38` | `addresses.empty.title` instead of the list |
| `src/screens/CartScreen.tsx:202-206` | the prompt and `location.openMap.sub` in place of the address |

The first three are a flash. The fourth is not: `confirm()` at
`src/screens/CartScreen.tsx:107-110` returns early on `!selected` and navigates to
`Map`. A customer who opens the cart and taps confirm before storage resolves is
sent to pick an address they already have, and the order is not placed. It is a
race, so it fires on a cold start, on a slow device, or on the fast tap — not
reproducibly, which is what makes it worth fixing rather than watching.

The pattern is already in the codebase. `PlanContext` carries `hydrated`
(`src/state/PlanContext.tsx:51,91`) and [[plans]] consumes it at
`src/screens/PlansScreen.tsx:184` to hold a skeleton rather than guess between two
cards that say opposite things. The same reasoning applies here exactly: "no
address" and "not yet known" are opposite messages, and one of them is currently
being shown for both.

Note that fixing this does not make the empty states wrong — it makes them
truthful. The empty states are the point of [[real-customer-data-only]]; showing
one before the answer is known is what undermines them.

## Related
- Page: [[cart]], [[plans]], [[addresses]], [[map]]
- Feature: [[real-customer-data-only]]
- Bugs: [[seeded-addresses-survive-upgrade]], [[unnamed-pin-label-inconsistent]], [[cart-map-preview-without-an-address]], [[dish-page-build-flash]], [[location-storage-error-never-hydrates]]
