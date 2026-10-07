# Profile addresses subtitle missing

Status: fixed
Found: `src/screens/ProfileScreen.tsx:88`
Summary: The saved-addresses row rendered the raw key `profile.addresses.sub` because the string did not exist.

## Details
Every row reads `profile.<key>.sub`; the other three had strings. Added to `ar` and `en`.

## Related
- Page: [[profile]], [[addresses]]
