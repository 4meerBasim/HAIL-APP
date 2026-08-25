# Phone OTP sign-in

Status: shipped
Summary: Signing in sends a real four-digit code to the customer's phone and exchanges it for an API token, replacing the mock that accepted any four digits.

## Details
The backend is the Laravel API in the separate `JAREESH-API` repo. It generates the
code, hashes it, expires it and verifies it — the messaging provider is only ever a
transport, which is what keeps the four-digit code the app already expected.

**Where the API lives.** `EXPO_PUBLIC_API_URL`, set in `.env.local` (gitignored);
`.env.example` is committed as the template. On a device this has to be the Mac's
LAN address — `localhost` is the phone itself, so the request never leaves the
handset and reads as the server being down.

**`src/state/AuthContext.tsx`** holds all of it. Both calls are async and return a
result rather than a boolean, because the screen has four different things to say:

| Result | Cause |
|---|---|
| `invalid-phone` | 422 from the request endpoint |
| `throttled` | 429, carries `retryAfter` seconds |
| `wrong-code` | 422 from verify |
| `network` | fetch threw, or any other non-2xx |

`wrong-code` is deliberately the only verification failure. The API answers a wrong
code, an expired one, one guessed at too many times, and a number it has never seen
with the same 422 — distinguishing them would reveal which numbers have accounts —
so there is nothing finer for the app to report.

**The token is the session.** `AsyncStorage` now holds `{ user, token }`. A session
saved by the mock build has no token and cannot authenticate, so it is dropped on
boot and that customer signs in once more. `pendingPhone` is only set after the API
confirms a code went out, so the code-entry step can never appear for a request
that failed.

**The number comes back from the API**, not from what was typed: it stores E.164,
so an account keyed on `+9647701234567` is the same customer whether they typed
`07701234567` or `+964 770 123 4567`. A fresh customer has no name yet and the API
returns null, which becomes `''` because the rest of the app renders `User.name`
as a string.

**`src/screens/LoginScreen.tsx`** disables the button and swaps its label while a
call is in flight — a second tap would otherwise spend the customer's resend
allowance on a code already on its way.

## Related
- Page: [[login]]
- Feature: [[guest-mode]], [[logout-confirmation]]
- Enhancements: [[revoke-token-on-sign-out]], [[resend-code-button]]
