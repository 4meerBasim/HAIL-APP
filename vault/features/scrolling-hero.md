# Scrolling hero

Status: shipped
Summary: The box page's photo scrolls away as you read, matching the meal page.

## Details
`<Hero>` moved inside the ScrollView. The box name and tag sit on the photo and travel with it; the back button moved out to page level so it stays put, and the price footer moved out of the sheet so it stays pinned.

`sheet` lost `flex: 1` and absorbed the content padding — it is content inside a scroller now, not a flex container. `scrollBody` and `sheet` both take `flexGrow: 1` so a short box still fills the page instead of showing the screen texture above the footer.

## Related
- Page: [[box-detail]], [[dish-detail]]
- Bugs: [[box-hero-pinned-while-scrolling]], [[box-detail-status-bar-overlap]]
