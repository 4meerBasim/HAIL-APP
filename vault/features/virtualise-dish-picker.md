# Virtualise the dish picker

Status: shipped
Summary: The plan builder's dish grid is a real virtualised two-column list, so it mounts only a window of cards instead of every card on the screen.

## Details
The picker is now a `FlatList` with `numColumns={2}` and is the screen's single
vertical scroller (`src/screens/PlanBuilderScreen.tsx`). Everything that used to
sit above it in the outer `ScrollView` — the day rail, the meal-time `SlotBar`,
the slot summary and the filter chips — rides in `ListHeaderComponent`; the
rotation preview rides in `ListFooterComponent`. That removes the
same-orientation virtualised-list-inside-a-`ScrollView` nesting that previously
broke windowing and warned.

Row rendering is memoised: each card is a `React.memo` `PickCard`, the press
handler and selected/badge styles are stable references, and `renderItem` /
`keyExtractor` are `useCallback`s keyed on `dish.id`. `extraData={plan}` busts
the cell memo when selection changes. The header is passed as a stable element,
so typing or selection re-renders it in place without remounting the horizontal
day/filter rails or losing their scroll offset.

Spacing is preserved exactly: the content container's `gap` spaces grid rows by
`xl`, `columnWrapperStyle` keeps the inter-column gap, the header carries the
larger `giant` rhythm between its blocks, and the footer takes the extra
`giant - xl` back as a top margin. Selection, multi-select, scroll-to-top on
step change (`scrollToOffset`), the keyboard/sticky header/footer, safe-area
insets and RTL/LTR row direction all behave as before.

This replaces the earlier deferred-tail mitigation (6 cards immediately, the
rest via `InteractionManager`), which has been removed — the window does the
same job properly.

## Related
- Page: [[plan-builder]]
- Bug: [[plan-builder-slow-to-open]], [[plan-builder-selected-card-narrow]]
