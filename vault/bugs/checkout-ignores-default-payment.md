# Checkout ignores the default payment method

Status: fixed
Found: `src/screens/CartScreen.tsx:65`
Summary: Checkout always started on "online" whatever default was chosen under Payments, offered no ZainCash option, and could place a card order with no card on file.

## Details
The cart starts on the stored `@hail/payment-method` default and offers card, ZainCash and cash. `PaymentMethod` (`card` / `zain` / `cash`) in `src/data/menu.ts` is the one type both screens use. Confirming a card payment with no card opens the card sheet instead of placing the order. ZainCash is recorded on the order only; there is no wallet integration.

## Related
- Page: [[cart]], [[profile]]
