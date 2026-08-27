# Grams stepper collapsed in card

Status: fixed
Found: reported by user — `src/screens/MenuScreen.tsx`, `src/components/Stepper.tsx`
Summary: The grams control under an ingredient card overflowed its column, so its lead icon was crushed underneath the -/+ buttons.

## Details

`Stepper`'s standard row needs roughly 158pt for its controls alone — two 38pt
buttons, a 66pt minimum readout and two 8pt gaps — before the lead icon asks for
another 30. The ingredient cards on [[menu]] are a two-up grid at 47.5% width:
about 166pt on a 390pt screen, or ~146pt inside the control's own padding. The
controls could not fit, so the icon ended up sitting under the buttons.

Fix, in `Stepper`:
- `icon` is now optional. A stepper under a card that already names and pictures
  its ingredient says nothing extra with a glyph, and the space it costs is the
  space the buttons need.
- With neither icon nor label, the lead is not rendered at all and the controls
  take the row (`controlsAlone`): minus on one edge, plus on the other, the
  figure centred. An empty lead would have parked the group at the end instead.
- A `compact` variant shrinks the buttons to 30pt, drops the readout's minimum
  width, and steps the type down — about 97pt in total, which fits with room.

[[menu]] passes `compact` and no icon.

## Related
- Feature: [[ingredient-weights-and-macros]]
- Page: [[menu]]
- Bugs: [[menu-double-bottom-inset]]
