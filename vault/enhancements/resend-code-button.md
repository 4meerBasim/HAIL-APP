# Resend the code

Status: planned
Summary: The code step offers no way to ask for another code — the only route is "change number", back, and continue, which trips the API's resend cooldown.

## Notes
A code that never arrives is the common failure in any OTP flow, and the screen
has no answer for it. Today the customer taps [[login]]'s "change number", comes
back, and presses continue — which is a fresh request, so within sixty seconds the
API returns 429 and they are told to wait for a code they never got.

What it needs: a "resend" link on the code step, disabled with a countdown seeded
from `resend_after` in the request response (300s expiry, 60s cooldown at the API's
current settings). The `count.seconds.*` strings already exist for the label.

Deliberately left out of [[phone-otp-sign-in]], which was a wiring pass — adding
the control is a change to the screen's design, not to what it talks to.

## Related
- Page: [[login]]
- Feature: [[phone-otp-sign-in]]
