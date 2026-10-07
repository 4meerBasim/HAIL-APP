# The cart maps an address the customer has not set

Status: fixed
Found: `src/screens/CartScreen.tsx:189-196`
Summary: `MapPreview` renders unconditionally at the top of the delivery card, so a customer with no saved address sees a map with a pin dropped on it directly above the line asking them to add one.

## Details
Fixed: `MapPreview` only renders when an address is selected.

The original report follows.

The card draws the picture first and asks the question second:

```tsx
<Card padding={0} style={styles.mapCard}>
  <PressScale onPress={() => navigation.navigate('Map')} …>
    <MapPreview />
  </PressScale>
  …
    {selected ? (selected.label ?? '') : t('location.add')}
```

`MapPreview` takes no location — it is a drawn map, and the pin is hardcoded at
`src/components/MapPreview.tsx:42-48` with the comment "the pin sits where the eye
lands, not where the data says". With an address selected that is fine: the
picture is decoration and the text underneath carries the truth. With nothing
selected it is the same fabrication [[real-customer-data-only]] set out to
remove — a rendered location for a customer who has none — and it contradicts the
prompt one line below it.

It also reads as broken rather than empty. The other empty states added in that
change say plainly that there is nothing yet; this one shows a map, a pin, and
«أضف عنوان التوصيل» in the same card, which looks like the address failed to load.
[[location-hydration-has-no-loaded-flag]] makes that reading briefly correct even
for customers who do have an address.

The review left the call to judgement and the current code takes neither option:
hide the preview when `selected` is null and let the prompt stand on its own, or
keep it and drop the pin, so the card reads as a map with nowhere marked. Hiding
it is the smaller change and matches how the rest of the screen handles empty.
Either way the whole card stays tappable into [[map]] — that route is the
customer's way out.

## Related
- Page: [[cart]], [[map]]
- Feature: [[real-customer-data-only]]
- Bugs: [[location-hydration-has-no-loaded-flag]], [[unnamed-pin-label-inconsistent]]
