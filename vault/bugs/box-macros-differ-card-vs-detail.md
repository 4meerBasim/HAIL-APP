# Box nutrition differs between card and detail

Status: fixed
Found: Plans "For you" card vs Box detail (seen on the Android emulator)
Summary: The Balanced Box card shows 50/247/90 g and 1800 kcal for the day, while its detail screen shows 34/127/41 g and 998 kcal; Lean Box shows 1300 vs 888 kcal.

## Details
The card and the detail screen compute or read a box's daily nutrition from
different sources. Suspect is the card's figure or the detail's rotation-based
total. Needs one source of truth so both screens agree.

## Fix
Both screens now read `boxDaily(box)` — the box's advertised daily macros — as
the single source of truth. `BoxCard` (the Plans card) already used it; the
`BoxDetailScreen` "full day" card was the outlier, reading the seeded plan's
`dailyMacros` whenever the plan was seeded from this box.

`boxDaily` is the correct source. A box advertises its macros for a full,
three-meal day (`DietBox.kcal` etc. in `src/data/menu.ts`, e.g. Balanced 1800).
`dailyMacrosOf` instead averages the live plan, and `planFromBox` seeds a plan
with a single default meal time, so the detail was showing the macros of a
one-meal-a-day plan (sum of all dishes averaged over one meal ≈ 998 kcal for
Balanced) under a card labelled "full day". The box headline is what defines the
box, so the card and the detail now both show it. `dailyMacros` is no longer
destructured in `BoxDetailScreen`; price still uses the seeded/fallback split,
which is unaffected because both evaluate the same `planFromBox`.

## Related
- Feature: [[subscription-pricing]], [[full-day-macros]]
- Page: [[plans]], [[box-detail]]
