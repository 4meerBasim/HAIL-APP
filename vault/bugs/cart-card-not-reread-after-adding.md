# Cart card not re-read after adding

Status: fixed
Found: `src/screens/CartScreen.tsx` (code review of the full-app fix pass)
Summary: Adding a card from the cart's card sheet left the cart still seeing no card, so confirming kept reopening the sheet.

## Details
The cart read `@hail/card` once on mount. AddCard pops back to a cart that stayed mounted, so the new card-required gate at confirm looped. The cart now re-reads the card on focus, as PaymentsScreen does.

## Related
- Page: [[cart]]
- Bugs: [[checkout-ignores-default-payment]]
