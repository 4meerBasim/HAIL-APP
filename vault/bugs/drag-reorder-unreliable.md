# Hold-and-drag reorder was unreliable

Status: fixed
Found: `src/components/SlotBar.tsx`
Summary: Reordering meal times by holding and dragging a pill misbehaved in several ways; rebuilt twice and still wrong, then removed entirely.

## Details
Four faults, each enough on its own:
1. A `PanResponder` per pill, rebuilt whenever `slots` changed — which a reorder does — so the handler could be swapped out underneath a gesture in flight.
2. Scrolling was only disabled once a drag was running, so the horizontal `ScrollView` could claim the touch first — "hold does nothing, the row just scrolls".
3. Per-pill offsets keyed by array index, which a reorder invalidates — stale offsets stuck to the wrong pills.
4. `setValue(0)` on values with springs still running; the next frame painted over the reset and left the row parted.

Plus an arm timer that silently expired after 1.8s, and a pill clamped to 12px of vertical travel against a 64px delete threshold.

Resolved not by a third attempt but by removing the gesture — order now follows the clock ([[chronological-meal-order]]) and delete moved into the sheet and onto a labelled chip.

## Related
- Page: [[plan-builder]]
- Feature: [[chronological-meal-order]], [[meal-times]]
- Bug: [[slot-reorder-rehomed-dishes]]
