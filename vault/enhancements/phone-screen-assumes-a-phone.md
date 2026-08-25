# The phone numbers screen assumes there is a phone

Status: planned
Summary: A customer who signed in with an email has no number, so the primary row on the phone numbers screen renders blank.

## Notes
`PhoneNumbersScreen.tsx:233` renders `display(user.phone)`, and the whole screen
is built around a primary number plus backups. Since [[email-sign-in]] shipped, a
customer can reach it with `user.phone` empty — the field is `''`, not missing,
so nothing errors and the row is simply blank.

The screen needs to handle "no number yet": an empty state offering to add one,
rather than an empty row that looks like a rendering bug. The API already has
the endpoint for it — `POST /api/auth/identity/request` and `/confirm` — which is
also how a customer links their two accounts, so this is the screen that unlocks
the merge.

Deliberately out of scope for [[email-sign-in]], which was the login screen only.
`ProfileScreen` was fixed in that pass because falling back to the address there
was one line; this is a screen redesign.

## Related
- Page: [[profile]]
- Feature: [[email-sign-in]], [[phone-otp-sign-in]]
