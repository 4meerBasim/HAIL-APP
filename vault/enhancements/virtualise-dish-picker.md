# Virtualise the dish picker

Status: planned
Summary: Make the plan builder's dish grid a real virtualised list so it mounts a window rather than everything above the fold plus a deferred tail.

## Notes
[[plan-builder-slow-to-open]] was mitigated by deferring 15 of the 21 cards past the navigation transition. That is a patch, not the fix.

The proper fix is a `FlatList` with `numColumns={2}`, but the picker currently sits inside the screen's outer vertical `ScrollView` — nesting same-orientation virtualised lists breaks windowing and warns. Doing it properly means making the `FlatList` the screen root with everything above it as `ListHeaderComponent`: a real refactor of a ~580-line screen.

Cheaper alternative if that is too much: `MacroRow` is ~18 of each card's ~26 views. Reducing a picker card to a single calorie line roughly halves the tree. That is a design change, so it needs a decision first.

## Related
- Page: [[plan-builder]]
- Bug: [[plan-builder-slow-to-open]]
