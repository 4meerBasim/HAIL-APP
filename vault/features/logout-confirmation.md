# Logout confirmation

Status: shipped
Summary: Signing out asks first.

## Details
`ProfileScreen` opens the app's own `Dialog` — «تسجيل الخروج» / «متأكد تريد تسجيل الخروج؟» — rather than firing on the tap. Not a platform `Alert`: `Dialog` is what the rest of the app asks with, and `PlanBuilderScreen` already uses it.

Worth asking because sign-out does more than end a session — it clears the cart and drops the subscription from state. See [[guest-mode]].

## Related
- Page: [[profile]]
- Feature: [[guest-mode]], [[confirm-before-deleting-meal-time]], [[phone-otp-sign-in]]
- Enhancements: [[revoke-token-on-sign-out]]
