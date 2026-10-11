# Bilingual fonts

Status: shipped
Summary: English text is set in Plus Jakarta Sans and Arabic text in IBM Plex Sans Arabic, each chosen by the active language.

## Details
`src/theme.ts` `fonts` names the Plus Jakarta Sans families (400–800), so every
`StyleSheet` keeps naming one token. `localFont(family, lang)` swaps each for its
IBM Plex Sans Arabic equivalent in Arabic; Plex Arabic stops at 700, so `heavy`
maps to bold there. The swap happens at render in `AppText`, the new
`AppTextInput` (used by every input) and the `Badge` SVG digit, so no screen
picks a family by language. Text with no family falls back to `fonts.regular`.

The type scale was sized against Cairo, and Jakarta sets the same English line
about 11% wider (measured from the font files), which crowded cards. `localSize`
in `src/theme.ts` runs English at 90% of each style's size, back to Cairo's
measure; line heights are untouched so card heights hold. Arabic is unscaled.
The Playfair Display wordmark is unchanged.

IBM Plex Sans Arabic is the face named in `design-reference/BUILD-SPEC.md`; the
code had drifted to Cairo, which is removed along with `@expo-google-fonts/cairo`.
Both new packages are font files only, nothing native. `App.tsx` loads both
families up front.

`Badge` centres its digit from each face's own cap height (Jakarta 0.745em, Plex
Arabic 0.698em) and widest digit advance, read from the font files.

Unverified on a device: Cairo's line box was 1.87em, against 1.26em for Jakarta
and 1.5em for Plex Arabic. The type scale sets explicit line heights so most text
holds, but any spot hand-tuned around Cairo's tall box may sit differently.

## Related
- Page: [[login]], [[profile]], [[menu]]
- Features: [[language-switching]], [[hail-rebrand]]
