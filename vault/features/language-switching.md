# Language switching

Status: shipped
Summary: The app supports Arabic and English again, and the customer can switch between them live — from the Profile settings or before signing in.

## Details
`src/i18n/LanguageContext.tsx` reads the stored language (`@hail/lang`, default
`ar`), applies it, and `setLang` now persists the choice, calls `applyRTL`, and
updates state — the earlier Arabic-only lock is gone.

The switch is **live, no reload**: direction is driven entirely by context, not by
native RTL. `Screen` sets `direction: rtl|ltr` on its root from `isRTL`, `AppText`
sets `writingDirection`/`textAlign: auto` from `isRTL`, and the few `row-reverse`
and `direction` sites derive from `isRTL` too. `I18nManager.forceRTL` is still
called for native consistency, but its effect is deferred to the next reload and
does not drive layout, so flipping context re-renders the whole tree correctly on
the spot. `expo-updates` is not installed and `DevSettings.reload` is dev-only, so
no reload path was added — none is needed, and no native module was introduced.

Toggles:
- Profile settings card — a globe `SettingRow` with an عربي / EN chip segment
  (`src/screens/ProfileScreen.tsx`).
- Login, top reading-end corner inside the safe area — a pill showing the other
  language's endonym ("English" / "العربية"), `accessibilityRole="button"` and a
  `login.switchLanguage` label (`src/screens/LoginScreen.tsx`).

Copy lives in `src/i18n/strings.ts` in both `ar` and `en`: `lang.ar`/`lang.en`,
`lang.ar.native`/`lang.en.native`, `profile.language`, `login.switchLanguage`.

## Related
- Page: [[profile]], [[login]]
- Features: [[hail-rebrand]]
