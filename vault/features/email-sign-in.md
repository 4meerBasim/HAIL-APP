# Sign in by email

Status: shipped
Summary: A customer with no WhatsApp can sign in with an email address instead — the same four-digit code, sent to their inbox.

## Details
The login screen defaults to a phone. A link under the button —
"استخدم البريد الإلكتروني" — swaps the `+964` row for an email input and swaps
the heading with it. Phone stays the default because most customers have one;
the other route is one tap away rather than a permanent tab.

Swapping clears both fields. Carrying a half-typed number across and back is how
somebody ends up sending a code to the one they had already abandoned.

**`AuthContext` now takes an identity, not a phone.** `requestOtp` accepts
`{ channel: 'phone' | 'email', value }` and posts `phone` or `email` — never
both, which the API rejects. `pendingIdentity` replaces `pendingPhone`, so the
verify call answers on whichever channel the code went to.

`User` gained `email`, and both identity fields are `''` rather than null when
absent: a customer who signed in with an address has no number yet. Screens
render them as strings, so the blank is invisible rather than a crash — see
[[phone-screen-assumes-a-phone]] for where that still shows.

**The failure reason is `invalid-identity`, not `invalid-phone`.** The screen
knows which field is on show and picks the message; the API deliberately answers
a wrong code, an expired one and an address it has never seen identically, so
there is nothing finer to report.

## Related
- Page: [[login]], [[profile]]
- Feature: [[phone-otp-sign-in]], [[guest-mode]]
- Enhancements: [[phone-screen-assumes-a-phone]], [[resend-code-button]]
