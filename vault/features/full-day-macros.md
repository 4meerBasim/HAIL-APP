# Full-day macros

Status: shipped
Summary: Macro blocks that cover a whole day say so, on the number rather than in a heading above it.

## Details
`MacroRow` gained `fullDay`. When set, the calorie band reads «سعرة حرارية لليوم الكامل» instead of «سعرة حرارية». Inline, so it costs no height on a card.

On: the box card (which carried no heading at all over its figures), the box page, and Subscribe. Off: dish detail, meal rows, and both plan-builder rows — those macros really are one meal's.

Removed `planMacros.perDay` ("باليوم" / "Per day"), which was the vague string in both places.

## Related
- Page: [[box-detail]], [[boxes]], [[plans]], [[subscribe]]
- Feature: [[subscription-pricing]]
