# Hail rebrand

Status: shipped
Summary: The app is renamed from Jareesh (جريش) to Hail (هيل), with a new cardamom-pod logo.

## Details
Every brand label in `src/i18n/strings.ts` now reads هيل / Hail (brand name, kitchen, driver, team, offers), and the unknown card brand in `PaymentCard` reads `t('brand.name')`. The support screen's website row is removed.

AsyncStorage keys moved from `@jareesh/*` to `@hail/*` (`lang`, `session`, `locations.v2`, `location-selected.v2`, `notifications-read`, `notifications-cleared`, `subscription`, `card`, `payment-method`, `drop`, `notifications`), and orders from `jareesh.orders.v2` to `hail.orders.v2`. Existing installs start fresh because the old keys are no longer read.

`app.json`: name `Hail`, slug `HAIL-APP`, iOS `com.ameerbasim.HAIL-APP`, Android `com.ameerbasim.HAILAPP`; the EAS projectId is unchanged. `package.json` name is `hail`.

Kept on purpose: the support screen has no website row until a Hail domain exists — the only live site is still `menu.jareesh.com`, so `SUPPORT_SITE` is gone rather than pointing customers at the old brand; the support phone and WhatsApp numbers are still placeholders; the dish name شوربة جريش / Jareesh soup is a food, not the brand; the `JAREESH-API` backend keeps its name. New logo assets replace the old ones on the splash, login and plans screens.

The GitHub repo is renamed from `jareesh-app` to `HAIL-APP`, and its default branch from `main-jaresh` to `main`; `docs/` follows.

## Related
- Page: [[login]], [[plans]]
- Bugs: [[unknown-card-brand-hardcoded]]
