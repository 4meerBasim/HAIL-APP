# Time wheel snapped back on every layout

Status: fixed
Found: `src/components/TimePicker.tsx`
Summary: `onLayout` re-scrolled each column to the time it opened on, every layout pass — raising the keyboard on the name field was enough.

## Details
The scroll was there to place the wheel on the slot's own time at mount, since `contentOffset` is not honoured on every platform. But layout fires repeatedly, and the captured index never changed, so it dragged the column back each time. Reads exactly like a wheel that refuses to move.

Fixed with a `placed` ref — first layout only.

## Related
- Page: [[plan-builder]]
- Feature: [[time-picker]]
- Bug: [[time-wheel-blocked-by-pressable]]
