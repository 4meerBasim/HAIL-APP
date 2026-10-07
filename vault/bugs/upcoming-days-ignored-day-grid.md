# Upcoming days ignored the built day grid

Status: fixed
Found: `src/components/UpcomingDays.tsx` `mealsForSlot`
Summary: Each upcoming day chunked the flat meal list by slot count and counted from today rather than from the plan start, so days listed meals that were not built for them.

## Details
Rows now read `rotationDays(...)[nth % length]`, where `nth` is the delivery's place in the whole run.

## Related
- Page: [[upcoming]], [[plans]]
- Feature: [[multi-select-dishes]]
