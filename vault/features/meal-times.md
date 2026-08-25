# Meal times

Status: shipped
Summary: Every meal slot carries a name and a delivery time, editable together, and a plan starts with one — فطور at 8:00.

## Details
`MealSlot` gained `time`, minutes from midnight — a number so slots sort by it and the picker steps it without parsing. `formatTime` builds the 12-hour face back at render (`8:00 ص`), Western digits in both languages.

`defaultSlots()` returns **one** slot. A second delivery a day is a real cost, so it is chosen rather than assumed. Consequence: a plan opened from a box delivers less than the box's advertised daily macros until the other meal times are added back.

Editing is one sheet (`SlotSheet`) for both adding and correcting, so the two cannot drift. Reached by tapping the meal's pill when it is already selected, or its title in the builder. The draft is local until Save — spinning the wheels would otherwise re-price the plan on every tick.

Stored plans written before times existed are migrated on hydrate: a built-in takes its own hour back, a custom slot gets midday.

## Related
- Page: [[plan-builder]], [[box-detail]], [[upcoming]]
- Feature: [[time-picker]], [[chronological-meal-order]], [[multi-select-dishes]]
- Bugs: [[drag-reorder-unreliable]], [[delete-meal-time-unclear]], [[slot-labels-wrong-under-multi-select]]
- Enhancement: [[confirm-before-deleting-meal-time]]
