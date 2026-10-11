# Status bar overlaps scrolled box detail

Status: not-fixed
Found: Box detail screen (seen on the Android emulator)
Summary: Once the box page scrolls, its text passes under the clock and status icons with no backdrop behind them.

## Details
The hero scrolls away ([[scrolling-hero]]) but nothing takes its place behind
the status bar, so content collides with the system icons.

## Related
- Feature: [[scrolling-hero]]
- Page: [[box-detail]]
