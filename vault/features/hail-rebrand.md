# Hail rebrand

Status: shipped
Summary: The app is renamed from Jareesh (جريش) to Hail (هيل), with a new cardamom-pod logo.

## Details
Every brand label in `src/i18n/strings.ts` now reads هيل / Hail (brand name, kitchen, driver, team, offers), and the unknown card brand in `PaymentCard` reads هيل. The support screen's website row (and `SUPPORT_SITE`, which opened `https://menu.jareesh.com`) is removed until Hail has its own site; only Call and WhatsApp remain.

AsyncStorage keys moved from `@jareesh/*` to `@hail/*` (`lang`, `session`, `locations.v2`, `location-selected.v2`, `notifications-read`, `notifications-cleared`, `subscription`, `card`, `payment-method`, `drop`, `notifications`), and orders from `jareesh.orders.v2` to `hail.orders.v2`. Existing installs start fresh because the old keys are no longer read.

`app.json`: name `Hail`, slug `HAIL-APP`, iOS `com.ameerbasim.HAIL-APP`, Android `com.ameerbasim.HAILAPP`; the EAS projectId is unchanged. `package.json` name is `hail`.

Kept on purpose: the dish name شوربة جريش / Jareesh soup is a food, not the brand; the GitHub repo, `main-jaresh` branch and `JAREESH-API` backend keep their names. New logo assets replace the old ones on the splash, login and plans screens.

Photos from the old restaurant had Jareesh packaging in frame (bread bags, bottle stickers, wrapping paper, a store bag with address/QR/phone). Offers 02, 03, 05, 06, 08–11, 13–17, 19–21 and catering `hero.jpg` / `shoulder.jpg` were cropped to remove it. `offers/offer-04.jpg` still shows جريش wrapping paper under the burger and needs a new photo.

## Related
- Page: [[login]], [[plans]]
