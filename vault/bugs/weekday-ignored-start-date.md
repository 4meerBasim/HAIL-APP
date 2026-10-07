# Weekdays counted from Sunday, not the start date

Status: fixed
Found: `src/data/plan.ts` `isScheduled`/`deliveryDays`, `src/components/UpcomingDays.tsx`
Summary: Day offsets were read as weekdays with `dayIndex % 7`, so a plan started on any day but Sunday delivered on the wrong weekdays and labelled rows wrongly.

## Details
One helper, `weekdayOf(plan, dayIndex)` = start date's weekday + offset, now drives scheduling, pricing and the upcoming row labels. A plan still being built counts from today, the day it would start.

## Related
- Page: [[upcoming]], [[plans]], [[subscribe]]
- Feature: [[subscription-pricing]], [[day-actions-labelled]]
