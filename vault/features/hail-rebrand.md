# Hail rebrand

Status: shipped
Summary: The app is renamed from Jareesh (جريش) to Hail (هيل), with a new cardamom-pod logo.

## Details
Every brand label in `src/i18n/strings.ts` now reads هيل / Hail (brand name, kitchen, driver, team, offers), and the unknown card brand in `PaymentCard` reads هيل. The support screen no longer shows the domain: its site row reads "قائمتنا على الإنترنت" / "Our online menu".

AsyncStorage keys moved from `@jareesh/*` to `@hail/*` (`lang`, `session`, `locations.v2`, `location-selected.v2`, `notifications-read`, `notifications-cleared`, `subscription`, `card`, `payment-method`, `drop`, `notifications`), and orders from `jareesh.orders.v2` to `hail.orders.v2`. Existing installs start fresh because the old keys are no longer read.

`app.json`: name `Hail`, slug `HAIL-APP`, iOS `com.ameerbasim.HAIL-APP`, Android `com.ameerbasim.HAILAPP`; the EAS projectId is unchanged. `package.json` name is `hail`.

Kept on purpose: `SUPPORT_SITE` still points at `https://menu.jareesh.com`, the only live domain; the dish name شوربة جريش / Jareesh soup is a food, not the brand; the GitHub repo, `main-jaresh` branch and `JAREESH-API` backend keep their names. New logo assets replace the old ones on the splash, login and plans screens.

## Related
- Page: [[login]], [[plans]]
