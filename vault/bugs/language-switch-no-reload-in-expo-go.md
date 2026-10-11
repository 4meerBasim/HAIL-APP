# Language switch does nothing in Expo Go

Status: fixed
Found: `src/i18n/LanguageContext.tsx` `restart` (seen on the Android emulator)
Summary: Tapping عربي in Profile saved the language but nothing changed on screen until a manual reload, because `reloadAppAsync` resolves without reloading inside Expo Go.

## Details
`restart` returned true whenever `reloadAppAsync` did not throw, and `setLang`
then returned early without switching the language in place. In Expo Go the
call resolves but never reloads, so the screen stayed in the old language. The
launch path had the same shape: a no-op reload there would have left the
provider unready and the app blank.

Fix: development builds (Expo Go included) reload through
`DevSettings.reload`, release builds keep `reloadAppAsync`, and both callers
switch the language in place after the attempt, so a reload that does not
happen degrades to the live context-driven switch instead of a stuck or blank
screen.

## Related
- Feature: [[language-switching]]
- Page: [[profile]], [[login]]
- Bugs: [[english-stays-rtl-on-rtl-locale]]

Verified on the Android emulator in Expo Go: switching from Profile and from the
login pill reloads once in each direction, relaunch keeps the language with no
reload loop or blank screen.
