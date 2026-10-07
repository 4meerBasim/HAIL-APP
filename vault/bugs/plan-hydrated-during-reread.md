# Plan reported hydrated while re-reading

Status: fixed
Found: `src/state/PlanContext.tsx`
Summary: Signing in after a guest session re-read storage while `hydrated` stayed true, so screens painted "no plan" before the subscription arrived.

## Details
`hydrated` is set false before the read starts.

## Related
- Page: [[plans]]
- Feature: [[guest-mode]]
