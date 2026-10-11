# Dial code reads "964+" in Arabic

Status: fixed
Found: `src/screens/LoginScreen.tsx` dial-code chip (seen on the Android emulator)
Summary: On the Arabic login screen the country code renders as "964+" instead of "+964".

## Details
The `+964` text inherits the RTL writing direction, so the bidi algorithm moves
the leading "+" to the end. The chip needs an LTR writing direction (or an LTR
mark) the way the number field already has. Check the same chip on the phone
numbers screen.

## Fix
The chip text on both `LoginScreen` and `PhoneNumbersScreen` is now prefixed with
a Left-to-Right Mark (`‎`), so the "+" keeps its place and the chip reads
"+964" in Arabic. The `prefixText` style already carried `writingDirection: 'ltr'`
but that does not hold on Android, which is why the bidi algorithm still moved the
"+" to the end; the LRM is the same technique `PhoneNumbersScreen.display` already
uses for the formatted number. `DIAL_CODE` itself is unchanged, so the value sent
to the backend (`${DIAL_CODE}${normalizePhone(phone)}`) is unaffected.

## Related
- Page: [[login]], [[profile]]
- Feature: [[language-switching]]
- Bugs: [[dial-code-chip-not-sent]]
