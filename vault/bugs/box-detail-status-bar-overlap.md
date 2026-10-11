# Status bar overlaps scrolled box detail

Status: fixed
Found: Box detail screen (seen on the Android emulator)
Summary: Once the box page scrolls, its text passes under the clock and status icons with no backdrop behind them.

## Details
The hero scrolls away ([[scrolling-hero]]) but nothing takes its place behind
the status bar, so content collides with the system icons.

## Fix
A cream cap over the status-bar area (`insets.top` tall, absolute, behind the
back button) fades in as the hero scrolls away, so the sheet's text slides under
a clean backdrop instead of the system icons. Opacity is driven off scroll
position with core `Animated` (native driver, opacity only — no Reanimated, no
driver mix): transparent while the hero fills the top, opaque by the time the
hero's foot reaches the status bar. The hero reports its laid-out height via a
new optional `onLayout` prop forwarded from `Hero`, so the fade point tracks the
real photo height rather than a magic number.

## Related
- Feature: [[scrolling-hero]]
- Page: [[box-detail]]
