# The phone numbers screen handles an account with no phone

Status: shipped
Summary: A customer who signed in with an email sees "no number yet" on the phone numbers screen, with an Add chip that sets their first primary number.

## Details
Was an enhancement: since [[email-sign-in]], `user.phone` can be `''`, and the
primary panel rendered `display('')` — a bare `+964` that looked like a
rendering bug.

`PhoneNumbersScreen` now branches on `hasPrimary`. Without one, the panel shows
`phones.primary.none` / `phones.primary.noneSub`, the chip reads `common.add`,
and the step it opens is titled `phones.addPrimaryTitle`; saving goes through
`changePrimary`, which simply replaces the empty string. `AuthContext.makePrimary`
no longer swaps an empty primary down into the backups — see
[[empty-primary-swapped-into-backups]].

No API is involved: numbers save on Continue, the same as [[on-device-sign-in]]
— see [[phone-code-step-stub]].

## Related
- Page: [[profile]]
- Feature: [[email-sign-in]], [[phone-otp-sign-in]], [[on-device-sign-in]]
- Bugs: [[empty-primary-swapped-into-backups]], [[phone-code-step-stub]], [[phone-validation-too-loose]]
