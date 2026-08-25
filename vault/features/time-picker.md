# Time picker

Status: shipped
Summary: A 12-hour wheel shaped after UIDatePicker, built in JS because Expo Go carries no native picker.

## Details
`src/components/TimePicker.tsx`. Three snap-scrolling columns — hour, five-minute steps, ص/م — five rows deep with a true centre.

Each row's opacity (1 → 0.5 → 0.22) and scale (1 → 0.92 → 0.84) interpolate off the live scroll offset, so neighbours fall away under the finger frame by frame rather than stepping when a row commits. Native-driven. A rounded selection band sits behind, and gradient masks at both ends make the column read as a cylinder rather than a list.

Haptics fire from the scroll listener — one `Haptics.selectionAsync()` per row crossed, under the finger rather than after it stops, guarded on the row index changing. `.catch()`ed, since a device with system haptics off rejects.

The row is pinned LTR: a clock reads hour-then-minute in Arabic too.

Both native pickers were tried and reverted — see [[picker-native-module-missing]].

## Related
- Page: [[plan-builder]]
- Feature: [[meal-times]]
- Bugs: [[picker-native-module-missing]], [[time-wheel-blocked-by-pressable]], [[time-wheel-layout-snapback]]
