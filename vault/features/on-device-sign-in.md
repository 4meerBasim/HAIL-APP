# On-device sign-in

Status: shipped
Summary: The app talks to no API — entering a phone number or an email address signs the customer in on the spot, and the account is that identity, stored on the device.

## Details

Temporary, at the user's request: the Laravel backend is disconnected so the app
runs with nothing behind it. [[phone-otp-sign-in]] is kept as `deprecated`
because it describes what the API still implements and what this will talk to
again.

**What went.** `AuthContext` lost `API_URL`, the `post` helper and both `fetch`
calls. `requestOtp` and `verifyOtp` are replaced by one synchronous
`signIn(identity)` — there is no round trip, so nothing to await and no `pending`
state on the button. `pendingIdentity`, `OtpFailure` and `OtpResult` went with
them; the only failure left is `invalid-identity`, so `SignInResult` carries just
that.

**The token went too.** It existed only to authenticate API calls and nothing
outside `AuthContext` ever read it, so `Session` is now `{ user }` alone. A
session written by the API build still restores — the stored token is ignored
rather than rejected, so nobody who was signed in gets logged out by this.

**No code step.** `LoginScreen`'s `sent` branch is gone: the phone/email screen's
button signs in directly. Removed with it — `code`/`sent`/`pending` state,
`onVerify`, `onChangeNumber`, `CODE_LENGTH`, the `codeInput` style, the `count`
import, and the strings `login.codeError`, `login.changeNumber`,
`login.errorThrottled`, `login.errorNetwork`, `login.sending`,
`login.verifying`, plus the whole `count.seconds.*` plural set, which only
`errorThrottled` used.

`login.codeSent` and `login.codeHint` stay: [[phone-numbers]] has its own code
step for adding a backup number, and that one never touched the API.

**It still invents nothing.** `signIn` fills only the field the customer typed
and leaves `name`, the other identity, and `secondary` empty — so every empty
state is the one a genuinely new customer sees. [[real-customer-data-only]]
holds.

**`.env.example`** no longer sets `EXPO_PUBLIC_API_URL`; nothing reads it. The
LAN-address note is kept in that file, because it is the thing worth remembering
when the API comes back.

**The map is untouched, deliberately.** [[map]] still calls Nominatim for address
search and the reverse-geocoded pin label. That is a public third-party service,
not this project's backend, and cutting it would buy no offline capability: the
screen loads every tile from `basemaps.cartocdn.com` (Leaflet itself is now
bundled, see [[bundled-leaflet]]), so with no network it does not render at all. Removing
the two `fetch` calls would delete address search and leave the screen just as
network-bound.

## Related
- Page: [[login]], [[profile]], [[map]]
- Features: [[phone-otp-sign-in]], [[email-sign-in]], [[guest-mode]], [[real-customer-data-only]]
