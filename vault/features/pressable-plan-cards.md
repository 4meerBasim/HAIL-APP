# Pressable plan cards

Status: shipped
Summary: The whole card opens the builder, not just the pill inside it.

## Details
The «خطط وجبات يومية إلى باب بيتك» hero in `PlansScreen` is wrapped in a `PressScale` calling `openCustom`. The amber CTA stays and stays interactive — it is what names the action, it just no longer has to be hit. Both run the same handler; nested pressables resolve inner-first.

`CustomPlanCard` was written in the same pass — both `PlansScreen` and `BoxesScreen` imported it and the file did not exist, so the app could not build. The whole card is a `PressScale`, dashed outline, puzzle tile, RTL-aware chevron.

## Related
- Page: [[plans]], [[boxes]]
- Bugs: [[missing-custom-plan-card]]
