# Add card accepts anything

Status: fixed
Found: `src/screens/AddCardScreen.tsx:48`
Summary: One digit was enough to save a card — no length, expiry or CVV check.

## Details
`complete` was `number.length > 0`. Now it needs the brand's full length, a passing Luhn check, an `MM/YY` with a real month that is not past, and a CVV of the brand's length (4 for Amex). Leaving Amex trims a fourth CVV digit. The `MM/YY` placeholder moved to `card.expiryPlaceholder`.

## Related
- Page: [[profile]], [[cart]]
