# Dial code reads "964+" in Arabic

Status: not-fixed
Found: `src/screens/LoginScreen.tsx` dial-code chip (seen on the Android emulator)
Summary: On the Arabic login screen the country code renders as "964+" instead of "+964".

## Details
The `+964` text inherits the RTL writing direction, so the bidi algorithm moves
the leading "+" to the end. The chip needs an LTR writing direction (or an LTR
mark) the way the number field already has. Check the same chip on the phone
numbers screen.

## Related
- Page: [[login]], [[profile]]
- Feature: [[language-switching]]
- Bugs: [[dial-code-chip-not-sent]]
