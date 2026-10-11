# Modals ignore a language switch

Status: fixed
Found: `src/i18n/LanguageContext.tsx:21-24`
Summary: After switching language, dialogs, the location picker and the splash kept the old layout direction until a restart.

## Details
A `Modal` (and any overlay with its own native root) does not inherit the `direction` a `Screen` sets, and `forceRTL` only lays out correctly after a restart. Every modal and sheet now sets `direction` from `isRTL` on its own root: `Dialog`, `LocationPicker`, `SplashScreen`, `CalendarSheet`, `SlotSheet` and `ImageViewer`. Nothing is left — the sheets that this note previously flagged as still needing it (`CalendarSheet`, `SlotSheet`, `ImageViewer`) now do. Since the language switch restarts the app on a direction change (see [[language-switching]]), native direction always matches the language at runtime, so these `direction` roots simply agree with native and stay harmless.

## Related
- Page: [[profile]], [[login]], [[map]]
- Feature: [[language-switching]]
