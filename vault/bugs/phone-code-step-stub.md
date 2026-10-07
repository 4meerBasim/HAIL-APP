# Phone numbers code step was a stub

Status: fixed
Found: `src/screens/PhoneNumbersScreen.tsx:71-89`
Summary: Adding or changing a number showed "we sent you a code", sent nothing, and accepted any four digits.

## Details
Left over from the API build. With no API there is no code to send, so the step verified nothing while claiming to. Removed: Continue saves the number, the same as [[on-device-sign-in]]. `login.codeSent` and `login.codeHint` went with it.

## Related
- Page: [[profile]]
- Feature: [[on-device-sign-in]], [[phone-screen-assumes-a-phone]]
