# Sign in by email

Status: shipped
Summary: A customer with no WhatsApp can sign in with an email address instead — entering it signs them in on the spot, the same as a phone (see [[on-device-sign-in]]).

## Details
The login screen defaults to a phone. A link under the button —
"استخدم البريد الإلكتروني" — swaps the `+964` row for an email input and swaps
the heading with it. Phone stays the default because most customers have one;
the other route is one tap away rather than a permanent tab.

Swapping clears both fields. Carrying a half-typed number across and back is how
somebody ends up signing in with the one they had already abandoned.

**`AuthContext` takes an identity, not a phone.** `signIn` accepts
`{ channel: 'phone' | 'email', value }` and fills only that field. There is no
code step: when this shipped it sent a four-digit code through the API, and
[[on-device-sign-in]] removed that along with the API.

`User` gained `email`, and both identity fields are `''` rather than null when
absent: a customer who signed in with an address has no number yet. Screens
render them as strings; the phone numbers screen has its own "no number yet"
state — see [[phone-screen-assumes-a-phone]].

**The failure reason is `invalid-identity`, not `invalid-phone`.** The screen
knows which field is on show and picks the message.

## Related
- Page: [[login]], [[profile]]
- Feature: [[on-device-sign-in]], [[phone-otp-sign-in]], [[guest-mode]], [[phone-screen-assumes-a-phone]]
- Enhancements: [[resend-code-button]]
