# Revoke the token on sign out

Status: planned
Summary: Signing out only forgets the token on the device; the API still accepts it, and Sanctum tokens in this project never expire.

## Notes
`AuthContext.signOut` clears state and `AsyncStorage`. It does not tell the API,
and `config/sanctum.php` in the API repo sets `'expiration' => null`, so every
token ever issued stays valid forever. A token read off a device that was sold,
lost, or restored from a backup is a working login for that account.

Needs both halves:
- API: a `POST /api/auth/logout` behind `auth:sanctum` calling
  `$request->user()->currentAccessToken()->delete()`.
- App: call it from `signOut` before clearing local state, and clear locally
  regardless of whether the call succeeds — a customer who taps sign out with no
  signal must still be signed out on the handset.

Found while wiring [[phone-otp-sign-in]]; not in scope for that pass because the
API has no revoke endpoint yet.

## Related
- Page: [[login]], [[profile]]
- Feature: [[phone-otp-sign-in]], [[logout-confirmation]]
- Bugs: [[customer-data-survives-sign-out]]
