# Plan progress went stale while the app stayed open

Status: fixed
Found: `src/components/SubscriptionPanel.tsx`, `src/components/UpcomingDays.tsx`
Summary: Progress was computed once against the time it was first rendered, so an app left open overnight kept showing yesterday.

## Details
`PlanContext` exposes `now`, refreshed whenever the app returns to the foreground, and both components measure progress against it.

## Related
- Page: [[plans]], [[upcoming]]
