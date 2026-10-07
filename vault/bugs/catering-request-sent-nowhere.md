# Catering request is sent nowhere

Status: fixed
Found: `src/screens/CateringScreen.tsx:72-79`
Summary: Requesting a catering quote only flipped a local flag and told the customer the events team would call, though nothing was sent.

## Details
The request now opens WhatsApp to `SUPPORT_WHATSAPP` with a localized summary (`catering.message`: occasion, guests, trays, estimate). The "received" confirmation only shows once `Linking.openURL` succeeds; on failure nothing changes and the button stays. There is no date field on the screen, so none is sent. The support number is still a placeholder.

## Related
- Page: [[plans]]
