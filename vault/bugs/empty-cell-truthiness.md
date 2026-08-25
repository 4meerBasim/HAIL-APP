# Empty grid cells read as filled

Status: fixed
Found: `src/screens/PlanBuilderScreen.tsx`
Summary: Grid cells became `string[]`, and an empty array is truthy — three checks that tested the cell itself silently stopped working.

## Details
- `unfinished` used `!cell`, so every day read as complete and the "finish your rotation" prompt could never fire.
- `filled` on the meal pills used `Boolean(grid[day][i])`, so every meal time showed its checkmark immediately.
- The day chips counted `row.filter(Boolean).length` — always the full count.

None of it is a type error, so `tsc` passed throughout. All three now test `.length`.

## Related
- Page: [[plan-builder]]
- Feature: [[multi-select-dishes]]
