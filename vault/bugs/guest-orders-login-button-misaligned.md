# Guest orders login button misaligned

Status: fixed
Found: reported by user — `src/screens/OrdersScreen.tsx:75`
Summary: On the guest Orders screen the sign-in button sat flush against the start edge instead of centred with the rest of the empty state.

## Details
`styles.empty` centres its children with `alignItems: 'center'`, but `Button`
without `full` sets `alignSelf: 'flex-start'` on itself, and `alignSelf` beats the
parent's `alignItems`. So the icon, title and subtitle were centred while the
button alone hugged the start edge (the right, under RTL) — reading as misplaced
rather than as the block's call to action.

A second, smaller cause: `guestBtn` added `marginTop: spacing.md` on top of the
container's own `gap: spacing.lg`, so the gap under the subtitle was 18pt — not a
token step, and larger than every other gap in the block.

Fix: pass `full` so the button stretches the block width, delete the `guestBtn`
margin, and raise the container gap to `spacing.xl` so one token governs all the
spacing in the block.

## Related
- Feature: [[guest-mode]]
- Page: [[orders]], [[login]]
