# Cart note field aligns to a physical side

Status: fixed
Found: `src/screens/CartScreen.tsx:416`
Summary: The note input used `textAlign: isRTL ? 'right' : 'left'`, which forceRTL mirrors back to the wrong edge in Arabic.

## Details
It uses the screen's `readingSide` (`textAlign: 'auto'` plus writing direction). The iOS multiline placeholder concern in the old comment is unverified on device.

## Related
- Page: [[cart]]
