# "Deliver to" sheet dim skips the status bar

Status: not-fixed
Found: Cart, "Deliver to" sheet (seen on the Android emulator)
Summary: The sheet's dim overlay stops below the status bar, so the strip behind the clock stays bright white.

## Details
The modal is not drawn under the status bar on Android (`statusBarTranslucent`
or an equivalent is missing), so the scrim does not reach the top edge.

## Related
- Page: [[cart]]
