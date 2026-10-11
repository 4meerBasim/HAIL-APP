# English stays RTL on an RTL-locale phone

Status: fixed
Found: `src/i18n/LanguageContext.tsx` `applyRTL` (code review)
Summary: On a phone whose system language is Arabic, English still laid out right-to-left and the app restarted on every cold launch.

## Details
`applyRTL` called `allowRTL(true)` for both languages. Android resolves RTL as
forced OR (allowed AND device locale RTL), and iOS also follows the app's
preferred language when allowed, so `forceRTL(false)` alone left `isRTL` true.
The launch check then saw a mismatch on every cold start and restarted once (the
`@hail/rtl-reload` guard stopped it looping). Fixed by `allowRTL(lang === 'ar')`.

## Related
- Feature: [[language-switching]]
- Page: [[login]], [[profile]]
- Bugs: [[language-switch-no-reload-in-expo-go]]
