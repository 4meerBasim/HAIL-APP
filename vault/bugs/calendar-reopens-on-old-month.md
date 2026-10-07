# Calendar reopened on the wrong month

Status: fixed
Found: `src/components/CalendarSheet.tsx`
Summary: The sheet stays mounted, so it reopened on whatever month it was left on rather than the month of the selected delivery.

## Details
Month and year are reset from the selection each time it opens.

## Related
- Page: [[subscribe]]
