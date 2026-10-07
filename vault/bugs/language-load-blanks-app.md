# Language load error blanks the app

Status: fixed
Found: `src/i18n/LanguageContext.tsx:30-42`
Summary: A storage error while reading the saved language left `ready` false, and the app rendered nothing forever.

## Details
Nothing renders until `ready`. The read and the default write now sit in a `try`; on failure the app starts in Arabic. `setLang` also switches on screen if saving fails.

## Related
- Page: [[login]], [[profile]]
- Feature: [[language-switching]]
