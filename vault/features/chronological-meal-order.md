# Chronological meal order

Status: shipped
Summary: Meal times sort themselves by delivery time; rearranging the day means changing when a meal arrives.

## Details
`sortSlotsByTime` in `src/data/plan.ts`, applied on every add and every edit. It moves each day's grid cells with the slots, which the hand reorder it replaced did not — see [[slot-reorder-rehomed-dishes]].

Stable on equal times, so two meals set to the same hour keep the order they were added in rather than swapping on every edit.

This replaced hold-and-drag entirely. Once a slot carries a time there is only one order that can be right, and dragging could put dinner at 20:00 ahead of breakfast at 08:00.

## Related
- Page: [[plan-builder]]
- Feature: [[meal-times]]
- Bugs: [[drag-reorder-unreliable]], [[slot-reorder-rehomed-dishes]]
