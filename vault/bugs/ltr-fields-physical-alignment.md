# LTR input fields align to a physical side

Status: fixed
Found: `src/screens/LoginScreen.tsx` (phone, email), `src/screens/AddCardScreen.tsx`, `src/screens/PhoneNumbersScreen.tsx`
Summary: The phone, email and card-number inputs did not stay on the left edge in Arabic on both platforms.

## Details
These fields hold left-to-right runs and should sit on the left in both
languages. `textAlign: 'left'` is mirrored to the right under forceRTL on iOS.
The first fix, `'auto'` with `writingDirection: 'ltr'`, is right on iOS but not
on Android: Android inputs ignore `writingDirection`, so `'auto'` follows the RTL
layout and a digits-only value hugs the right edge. On Android `'left'` is a
physical gravity RTL never mirrors.

Fixed with a shared `ltrField` style in `src/theme.ts`: `'auto'` on iOS, `'left'`
on Android, plus `writingDirection: 'ltr'`. Same class as
[[cart-note-physical-alignment]].

## Related
- Page: [[login]], [[profile]]
- Feature: [[language-switching]]
- Bugs: [[cart-note-physical-alignment]]
