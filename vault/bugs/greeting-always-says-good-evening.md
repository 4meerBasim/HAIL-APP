# The home greeting always says good evening

Status: not-fixed
Found: `src/screens/PlansScreen.tsx:61-62`, strings at `src/i18n/strings.ts:74-75`
Summary: `home.greeting` and `home.greeting.plain` are «مساء الخير» / "Good evening" at every hour, so a customer opening the app at breakfast is greeted with an evening greeting.

## Details
The greeting is picked on name, not on time:

```ts
const name = user?.name.trim();
const greeting = name ? t('home.greeting').replace('{name}', name) : t('home.greeting.plain');
```

Both keys are a fixed evening greeting in `ar` and `en`. Arabic marks the
distinction more strongly than English does — «صباح الخير» before noon is what a
customer expects, and «مساء الخير» at 8am reads as the app not knowing what time
it is.

Found while removing the hardcoded «سارة» from the greeting in
[[real-customer-data-only]]; interpolating the real name was the scope of that
change, so the hour was left alone. The fix is a third pair of keys and a bucket
on the local hour, with the boundaries checked against Iraqi usage rather than
copied from the English ones.

## Related
- Page: [[plans]]
- Feature: [[real-customer-data-only]], [[phone-otp-sign-in]]
