# Empty primary swapped into backups

Status: fixed
Found: `src/state/AuthContext.tsx:196-205`
Summary: Making a backup primary on an email-only account pushed an empty string into the backup list.

## Details
`makePrimary` always moved the old `user.phone` down. For an account opened with an email that is `''`, which rendered as a blank backup row. It now skips an empty primary.

## Related
- Page: [[profile]]
- Feature: [[phone-screen-assumes-a-phone]], [[email-sign-in]]
