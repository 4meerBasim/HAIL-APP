# LayoutAnimation flag warns on the New Architecture

Status: fixed
Found: `src/screens/MenuScreen.tsx`, `src/screens/MealExtrasScreen.tsx` (dev console)
Summary: Both screens called `UIManager.setLayoutAnimationEnabledExperimental(true)` on Android, which is a no-op on the New Architecture and logged a warning each time.

## Details
The call was only needed on the old architecture to let Android run
`LayoutAnimation`; the New Architecture animates layout changes without it.
Removed both calls and their now-unused `Platform`/`UIManager` imports. The
`LayoutAnimation.configureNext` calls are unchanged.

## Related
- Page: [[menu]]
- Feature: [[ingredient-weights-and-macros]]
