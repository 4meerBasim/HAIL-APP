# "Pinned location" stays in English in Arabic

Status: not-fixed
Found: Plans header address label (seen on the Android emulator)
Summary: The home-screen delivery address reads "Pinned location" under Arabic instead of an Arabic label.

## Details
The label for an address saved from a map pin is stored or rendered as English
text rather than looked up through `t()` at render, so it does not follow the
language.

## Related
- Feature: [[language-switching]]
- Page: [[plans]], [[map]]
- Bugs: [[unnamed-pin-label-inconsistent]]
