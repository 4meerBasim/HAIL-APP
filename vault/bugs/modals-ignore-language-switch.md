# Modals ignore a language switch

Status: fixed
Found: `src/i18n/LanguageContext.tsx:21-24`
Summary: After switching language, dialogs, the location picker and the splash kept the old layout direction until a restart.

## Details
`forceRTL` only applies after a restart, and a `Modal` is a separate native root that does not inherit the `direction` a `Screen` sets. `Dialog`, `LocationPicker` and `SplashScreen` now set `direction` from `isRTL` on their root. `CalendarSheet`, `SlotSheet` and `ImageViewer` still need the same.

## Related
- Page: [[profile]], [[login]], [[map]]
- Feature: [[language-switching]]
