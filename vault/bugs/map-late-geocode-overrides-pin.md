# A late street name overrides the newest pin

Status: fixed
Found: `src/screens/MapScreen.tsx:152-158`
Summary: The reverse lookup for an earlier tap could land after a later one and replace the latest pin's address with the earlier spot's.

## Details
The injected map script drops a lookup result unless the pin is still at the coordinates it was asked for.

## Related
- Page: [[map]]
