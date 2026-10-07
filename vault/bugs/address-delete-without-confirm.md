# Address deleted without confirmation

Status: fixed
Found: `src/screens/AddressesScreen.tsx:89`
Summary: The remove cross deleted a saved address on a single tap, a thumb's width from the favourite star.

## Details
It opens the shared `Dialog` (`addresses.remove.*`) and only removes on confirm.

## Related
- Page: [[addresses]]
