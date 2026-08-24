# Confirm before deleting a meal time

Status: planned
Summary: Deleting a meal time takes the slot and its schedule with it and asks nothing first.

## Notes
Dishes are rehomed onto the neighbouring meal rather than lost, so it is not destructive in the worst sense — but the meal time, its delivery hour and its place in the rotation all go on one tap.

`Dialog` is already wired into `PlanBuilderScreen` for the prune and incomplete prompts, and `ProfileScreen` now uses it for sign-out ([[logout-confirmation]]), so this is a small addition following an established pattern.

Open question raised with the user and not yet answered: there are currently **two** delete controls for one action — the labelled chip on the slot header and the link in the meal's sheet. One may be redundant.

## Related
- Page: [[plan-builder]]
- Feature: [[meal-times]], [[logout-confirmation]]
- Bug: [[delete-meal-time-unclear]]
