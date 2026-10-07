# Phone validation too loose

Status: fixed
Found: `src/screens/LoginScreen.tsx:153`, `src/screens/PhoneNumbersScreen.tsx:69`
Summary: Any ten or more digits passed as a phone number, so a landline, a foreign number or a typo signed in or saved.

## Details
Both screens counted digits. Now both use `phoneValid` from `src/data/phone.ts` (ported from `feat/manage-phone-numbers`): the national part after `+964`/`964`/`0` must match `7` plus nine digits. Numbers are stored as `+964` + that part and shown as `0770 123 4567` via `formatPhone`, on the phone screen and the profile hero. `AuthContext` compares numbers with `samePhone` from the same file.

## Related
- Page: [[login]], [[profile]]
- Feature: [[phone-screen-assumes-a-phone]]
- Bugs: [[dial-code-chip-not-sent]]
