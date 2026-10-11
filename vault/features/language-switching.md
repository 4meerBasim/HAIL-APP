# Language switching

Status: shipped
Summary: The app supports Arabic and English, defaults to English, and the customer can switch between them from the Profile settings or before signing in — a direction change restarts the app so the whole tree lays out natively in the new direction.

## Details
`src/i18n/LanguageContext.tsx` reads the stored language (`@hail/lang`, now default
**`en`** — Arabic is the alternative), applies it with `applyRTL`
(`I18nManager.allowRTL(lang === 'ar')` + `forceRTL(lang === 'ar')` — English must disallow RTL, not just stop forcing it, or an RTL-locale phone keeps RTL; see [[english-stays-rtl-on-rtl-locale]]), and `setLang` persists
the choice before switching.

The switch **restarts the app on a direction change**, it is no longer live. When
the chosen language's direction differs from the running native direction, `setLang`
calls `reloadAppAsync('Language direction changed')` from `expo` — no new dependency,
`reloadAppAsync` ships with the Expo runtime. On the next launch the provider also
compares the saved language against native `I18nManager.isRTL` and restarts once if
they disagree (a fresh install whose system direction differs from the saved
language). A `@hail/rtl-reload` flag written before the reload and cleared on the
next launch is the loop guard: if native direction still did not follow after one
restart, it does not restart again.

The upshot is that at runtime native `I18nManager.isRTL` **always** equals the
context's `isRTL` (Arabic = RTL, English = LTR); the old "live switch without a
reload" state no longer exists. So native RTL handles the geometry — `row`,
`start`/`end`, and (with `doLeftAndRightSwapInRTL` on) `left`/`right`/`marginLeft`
etc. are all flipped by the platform. `Screen`, the modals and the sheets still set
`direction: rtl|ltr` on their own roots from `isRTL`; that now simply agrees with
native and stays harmless, and it still matters for the modals/sheets that are
separate native roots (see [[modals-ignore-language-switch]]). `AppText` keeps
`textAlign: 'auto'` + `writingDirection` from `isRTL`, directional SVG icons
(chevrons, arrows, skip) are still selected by `isRTL` because react-native-svg does
not mirror with RTL, and the phone rows stay `row-reverse` under RTL on purpose to
keep the `+964` dial code and its number as one left-to-right run.

Fallbacks: on web there is no native direction to fix, and where no native reload is
available the switch falls back to the context-driven live behaviour (`canRestart`
gates this on `Platform.OS !== 'web'` and `reloadAppAsync` being present). The switch
still happens even when it cannot be persisted — only the next launch falls back to
the default.

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
- Features: [[bilingual-fonts]], [[hail-rebrand]]
- Bugs: [[english-stays-rtl-on-rtl-locale]], [[modals-ignore-language-switch]], [[language-load-blanks-app]], [[ltr-fields-physical-alignment]], [[pinned-location-label-untranslated]]
