# Order lines share React keys

Status: fixed
Found: `src/screens/OrderDetailScreen.tsx:89, src/screens/PastOrdersScreen.tsx:154`
Summary: Order lines were keyed by `dishId`, which repeats when the same dish is built two ways, giving duplicate React keys.

## Details
Both lists key by index — order lines are never reordered in place.

## Related
- Page: [[orders]]
