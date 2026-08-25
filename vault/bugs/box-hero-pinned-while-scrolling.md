# Box photo stayed pinned while the page scrolled

Status: fixed
Found: `src/screens/BoxDetailScreen.tsx`
Summary: `<Hero>` sat outside the ScrollView, so the photo held the top of the screen while only the sheet moved — unlike the meal page, where it scrolls away.

## Details
Fixed by moving the hero inside the scroller and lifting the back button and the price footer out to page level so they stay put.

## Related
- Page: [[box-detail]]
- Feature: [[scrolling-hero]]
