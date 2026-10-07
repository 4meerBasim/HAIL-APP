# Tracking call and chat buttons do nothing

Status: fixed
Found: `src/screens/TrackingScreen.tsx:376-391`
Summary: The Call and Chat buttons on the tracking sheet had no `onPress`.

## Details
Call opens `tel:SUPPORT_PHONE`, Chat opens `https://wa.me/SUPPORT_WHATSAPP`. The card is labelled as support contact rather than a named driver, since there is no driver feed. Both numbers are placeholders until the real line is set in `src/data/menu.ts`.

## Related
- Page: [[tracking]]
