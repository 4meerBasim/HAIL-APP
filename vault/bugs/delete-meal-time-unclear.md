# Deleting a meal time was unclear and misaligned

Status: fixed
Found: `src/screens/PlanBuilderScreen.tsx`
Summary: The delete control was a bare muted `×` that did not read as delete, and it sat off the title's line.

## Details
Two separate faults:
- **Misaligned.** The header was one row holding a two-line title block beside the controls, so the control could only ever be centred against — never *on* — the title's line. No `alignItems` value fixes that. Restructured so the title and the delete chip are siblings in one row.
- **Unclear.** A bare cross says "close" as loudly as "delete", and a trash glyph alone could mean "clear the dishes I picked" or "drop this day". It is now a labelled coral chip reading «احذف فطور», interpolating the meal's own name.

## Related
- Page: [[plan-builder]]
- Feature: [[meal-times]]
- Enhancement: [[confirm-before-deleting-meal-time]]
