# Login

Route: `Login` (`src/screens/LoginScreen.tsx`)
Summary: Phone plus a four-digit code sent by the API, or "browse without signing in". A correct code returns the token the app uses from then on.

## Related
- Connects to: [[profile]], [[plans]], [[cart]], [[subscribe]], [[plan-builder]], [[orders]], [[box-detail]], [[boxes]]
- Features: [[guest-mode]], [[phone-otp-sign-in]], [[email-sign-in]], [[real-customer-data-only]]
- Bugs: [[dial-code-chip-not-sent]], [[customer-data-survives-sign-out]]
- Enhancements: [[resend-code-button]], [[revoke-token-on-sign-out]]
