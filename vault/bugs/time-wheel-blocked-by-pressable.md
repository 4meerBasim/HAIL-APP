# Time wheels would not scroll

Status: fixed
Found: `src/components/SlotSheet.tsx`
Summary: The sheet's card was wrapped in a no-op `Pressable`, which claims the touch on press-in and never hands it back, so the ScrollView wheels never received the gesture.

## Details
The wrapper existed to stop taps reaching the dismiss backdrop. Fixed by making the backdrop a `StyleSheet.absoluteFill` `Pressable` **behind** the card instead of its parent — the card is a plain `View` now and outside taps still close the sheet.

Haptics appeared to be broken at the same time, but were wired to a scroll handler that was never running — one cause, two symptoms.

## Related
- Page: [[plan-builder]]
- Feature: [[time-picker]]
- Bug: [[time-wheel-layout-snapback]]
