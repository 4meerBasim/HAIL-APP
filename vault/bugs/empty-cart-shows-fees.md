# Empty cart shows fees and a total

Status: fixed
Found: `src/screens/CartScreen.tsx`
Summary: With nothing in the basket the cart still priced delivery and service and showed a 2,500 total in the sheet.

## Details
The price card and the whole bottom sheet only render when the cart has items.

## Related
- Page: [[cart]]
