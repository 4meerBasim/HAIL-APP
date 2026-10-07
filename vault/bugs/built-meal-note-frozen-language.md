# Built meal note frozen in add-time language

Status: fixed
Found: `src/screens/MenuScreen.tsx:167`
Summary: A built meal's cart note was the label written when it was added, so it stayed in that language after a switch.

## Details
`CartRow` and `CartItemCard` draw the note from the build key at render time via `buildLabel` in `src/i18n/orderText.ts`, which shares `ingredientLabel` with the Menu tab. `CartItem.note` is gone; `Build.label` is still stored on the order.

## Related
- Page: [[cart]], [[menu]]
