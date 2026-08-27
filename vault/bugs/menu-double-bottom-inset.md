# Menu double bottom inset

Status: fixed
Found: reported by user — `src/screens/MenuScreen.tsx`
Summary: اصنع وجبتك inset the bottom safe area even though the tab bar under it already does, leaving a band of dead cream below the step buttons.

## Details

`Screen` defaults to `edges = ['top', 'bottom', 'left', 'right']`, so its
`SafeAreaView` pads past the home indicator. `TabBar` already does the same for
itself — `paddingBottom: Math.max(insets.bottom, 10) + 10` — so on a phone with
a home indicator the inset was applied twice and about 34pt of empty cream sat
between the prev/next bar and the tab bar.

It read as too much padding on the buttons, but reducing their padding could
never have reached it: the gap was outside the bar entirely.

[[menu]] now passes `edges={['top', 'left', 'right']}`, the same shape
[[plans]] already uses for the same reason. The top edge stays — the teal box
sits at the very top of the screen and has to clear the notch. The bar's own
`paddingBottom` also came down to match its `paddingTop`, since the tab bar
below now provides the separation.

## Related
- Page: [[menu]]
- Bugs: [[grams-stepper-collapsed-in-card]]
