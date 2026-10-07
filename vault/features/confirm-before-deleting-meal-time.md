# Confirm before deleting a meal time

Status: shipped
Summary: Deleting a meal time asks first, naming the meal and saying where its dishes go.

## Details
Both delete controls ask through the app's own `Dialog` — «حذف {slot}؟», with Cancel as the primary button and «احذف {slot}» as the confirm:
- The labelled chip on the slot header (`PlanBuilderScreen`) opens a screen-level `Dialog`.
- The link in the meal's sheet (`SlotSheet`) opens a `Dialog` rendered inside the sheet's own modal, since a second modal presented beside the first does not reliably appear on iOS.

Dishes are still rehomed onto the neighbouring meal rather than lost (see [[slot-delete-dropped-wrong-column]]). Copy: `slot.delete.title`, `slot.delete.message` in `src/i18n/strings.ts`.

Still open: there are two delete controls for one action; whether one is redundant has not been decided.

## Related
- Page: [[plan-builder]]
- Feature: [[meal-times]], [[logout-confirmation]]
- Bugs: [[delete-meal-time-unclear]], [[slot-delete-dropped-wrong-column]]
