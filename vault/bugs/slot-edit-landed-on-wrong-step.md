# Adding or re-timing a meal time selected the wrong step

Status: fixed
Found: `src/screens/PlanBuilderScreen.tsx` `commitSlot`
Summary: Slots re-sort by time after an add or edit, but the step was set by index (`steps.length`, or left alone), so it pointed at a different meal time.

## Details
The screen now follows the slot by id after the re-sort: the edited id, or whichever id is new after an add.

## Related
- Page: [[plan-builder]]
- Feature: [[chronological-meal-order]], [[meal-times]]
