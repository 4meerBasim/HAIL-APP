# Plan builder felt slow to open

Status: fixed
Found: `src/screens/PlanBuilderScreen.tsx`
Summary: Tapping into the builder appeared to do nothing, then the screen arrived late.

## Details
The press was instant — the destination was slow. The dish picker mounted all 21 cards synchronously in a plain `ScrollView`, each with a photo, a `LinearGradient` scrim, a badge and a full `MacroRow`: roughly 26 views a card, ~550 views, plus 21 image decodes, all on the JS thread before the new screen could paint.

Mitigated: 6 cards mount immediately (three rows, enough for the fold) and the rest arrive via `InteractionManager.runAfterInteractions`. ~550 views on the tap becomes ~160.

Not fully solved — see [[virtualise-dish-picker]].

## Related
- Page: [[plan-builder]], [[plans]]
- Enhancement: [[virtualise-dish-picker]]
