# The +964 chip was never sent with the number

Status: fixed
Found: reported by user — four spellings of one number made three accounts
Summary: The dial code beside the phone field was decorative, so a number typed without it went to the API as an international number and resolved to Russia.

## Details
`LoginScreen` renders `DIAL_CODE = '+964'` in a chip next to the input. It was
never added to the value sent. A customer reads the chip, types `7817768081`,
and the app posts exactly that. The API reads a bare number with no `+` as
already international, so `7817768081` became `+7 817 776 8081` — a Russian
number.

The customer waits for a code that was delivered to a stranger's handset. In
production that is a real message to a real person, paid for, containing a live
login for an account that is not theirs.

Confirmed from the data: one number entered four ways produced three accounts.

```
7817768081      -> +7817768081      wrong country
07817768081     -> +9647817768081   correct
9647817768081   -> +9647817768081   correct
+9647817768081  -> +9647817768081   correct
                -> +96407817768081  trunk zero kept
```

**Fixed on both sides**, because either alone leaves the other exposed:

- **App** — `LoginScreen` composes the E.164 before sending, stripping a trunk
  zero and a repeated country code, so the chip and the request agree.
- **API** — `PhoneNumber::normalize` now treats a number as international only
  when the customer says so with `+` or `00`; anything else is national and gets
  the country code. It also drops a trunk zero left after the country code.

Same root cause as the "reject, don't strip" rule already in that normaliser:
quietly reinterpreting what someone typed produces a different, entirely valid
number, and nothing downstream can tell that it is the wrong one.

## Related
- Page: [[login]]
- Feature: [[phone-otp-sign-in]]
- Bugs: [[phone-validation-too-loose]]
