# Unknown card brand hardcoded in Arabic

Status: fixed
Found: `src/components/PaymentCard.tsx:34`
Summary: A card with no recognised brand showed هيل in English too, because the mark was a literal.

## Details
Now `t('brand.name')`. The watermark's `right` became `end` and the CVV note's `textAlign: 'right'` became `alignSelf: 'flex-end'`; both sit inside the card's `direction: 'ltr'` stage, so the layout is unchanged.

## Related
- Page: [[profile]], [[cart]]
- Feature: [[hail-rebrand]]
