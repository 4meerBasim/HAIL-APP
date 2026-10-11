# Box nutrition differs between card and detail

Status: not-fixed
Found: Plans "For you" card vs Box detail (seen on the Android emulator)
Summary: The Balanced Box card shows 50/247/90 g and 1800 kcal for the day, while its detail screen shows 34/127/41 g and 998 kcal; Lean Box shows 1300 vs 888 kcal.

## Details
The card and the detail screen compute or read a box's daily nutrition from
different sources. Suspect is the card's figure or the detail's rotation-based
total. Needs one source of truth so both screens agree.

## Related
- Feature: [[subscription-pricing]], [[full-day-macros]]
- Page: [[plans]], [[box-detail]]
