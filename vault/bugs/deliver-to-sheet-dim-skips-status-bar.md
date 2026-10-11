# "Deliver to" sheet dim skips the status bar

Status: fixed
Found: Cart, "Deliver to" sheet (seen on the Android emulator)
Summary: The sheet's dim overlay stops below the status bar, so the strip behind the clock stays bright white.

## Details
The modal is not drawn under the status bar on Android (`statusBarTranslucent`
or an equivalent is missing), so the scrim does not reach the top edge.

## Fix
The "Deliver to" sheet is `LocationPicker`; its `Modal` now sets
`statusBarTranslucent`, so on Android the full-screen scrim is drawn under the
status bar and the dim reaches the top edge. The other transparent-scrim modals
that shared the same gap — `SlotSheet`, `CalendarSheet`, `Dialog` — get the same
prop for consistency. `ImageViewer` already had it.

## Related
- Page: [[cart]]
