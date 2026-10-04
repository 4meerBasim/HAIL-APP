# Hail (هيل) — React Native Build Spec (single source of truth)

Iraqi-kitchen restaurant app. **Arabic-first RTL**, with an EN (LTR) toggle. Expo + TypeScript + React Navigation.
Clone the design in `design-reference/jareesh-design.html` (11 screens, marked `<!-- 01 SPLASH -->` … `<!-- 11 ENGLISH HOME -->`) and `design-reference/tabbar.html`.

The design HTML is the PIXEL SOURCE OF TRUTH: every color, px size, radius, gap, shadow, font-size and copy string is taken from there. Match it faithfully. `image-slot` → `<Image>`; the `ios-frame` wrapper is just the device (use SafeAreaView, don't recreate a frame). `66px` top padding in the design = safe-area/status-bar space.

## Tech stack (already installed)
- expo (blank-typescript), react-native
- @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs
- react-native-screens, react-native-safe-area-context, react-native-gesture-handler, react-native-reanimated
- react-native-svg  (ALL icons are inline SVG paths — use `Svg`/`Path` from react-native-svg)
- expo-linear-gradient  (design uses many gradients → `LinearGradient`)
- expo-font + @expo-google-fonts/ibm-plex-sans-arabic  (font: IBM Plex Sans Arabic, weights 400/500/600/700)
- @react-native-async-storage/async-storage  (persist language choice)

## Folder structure (build exactly this)
```
App.tsx                       # font load + RTL init + LanguageProvider + NavigationContainer
src/
  theme.ts                    # design tokens (colors, radii, shadow, spacing, font families)
  i18n/
    LanguageContext.tsx       # { lang:'ar'|'en', dir, t, setLang, isRTL }; persists to AsyncStorage
    strings.ts                # ar + en dictionaries for every UI string
  data/
    menu.ts                   # 12 dishes, categories, images, plan-builder constants, tracking data
  components/
    Icon.tsx                  # <Icon path=.. size=.. color=.. strokeWidth=..> wrapping react-native-svg
    Tag.tsx                   # healthy/regular pill (صحي / عادي)
    DishCard.tsx              # menu/featured card (image + tag + name + sub + price + optional +)
    CartRow.tsx               # row with qty stepper
    Segmented.tsx             # reusable selectable chip/segment (used by plan builder)
    TabBar.tsx                # custom bottom tab bar per tabbar.html
    Screen.tsx               # RTL-aware safe-area container
  navigation/
    RootNavigator.tsx         # native-stack: Splash -> Tabs -> DishDetail/Cart/Tracking/Institution
    Tabs.tsx                  # bottom tabs: Home, Menu, PlanBuilder, Orders, Profile (custom TabBar)
  screens/
    SplashScreen.tsx          # 01
    HomeScreen.tsx            # 02 (+ 11 English mirror handled by language toggle, NOT a separate screen)
    MenuScreen.tsx            # 03 (interactive category filter)
    DishDetailScreen.tsx      # 04
    PlanBuilderScreen.tsx     # 05 (interactive live price math)
    CartScreen.tsx            # 06
    TrackingScreen.tsx        # 07 (animated dashed route + pulse; step states)
    OrdersScreen.tsx          # 08
    InstitutionScreen.tsx     # 09
    ProfileScreen.tsx         # 10
```

## Design tokens (theme.ts) — extracted from the design
```
colors = {
  teal: '#159d9b',          // primary, CTAs, active, prices
  tealDark: '#0b5f5e',      // gradients, headers
  tealDarker: '#0b3d3c',    // institution header, dark cards
  tealMid: '#128a88',
  tealText: '#0f7d7b',      // healthy tag text
  amber: '#f2a541',         // accent (subscribe/save, institution badge)
  amberText: '#3d2a05',
  amberIcon: '#bf7418',     // regular tag text/icon
  cream: '#faf6ef',         // screen background
  sand: '#ece5d6',          // page bg / borders
  sandChip: '#f4efe4',      // chip/stepper bg
  healthyBg: '#dff1f0',     // healthy tag bg
  regularBg: '#fdeedd',     // regular tag bg
  ink: '#152a29',           // headings
  body: '#5b6664',          // body text
  muted: '#6b7a79',
  muted2: '#8a9694',        // light muted
  faint: '#b3ab99', faint2: '#c9c0ad', faint3: '#d8cfbd', // very light / borders
  white: '#fff',
  green: '#2fae52',         // live dot
  coral: '#ef6f4c',         // skip/heart/danger
  mapBg: '#e8ebe2', mapShape1: '#dfe6d5', mapShape2: '#dce9e8',
}
radius = { sm:12, md:14, card:16, lg:18, xl:20, xxl:22, sheet:26, sheet2:28, pill:999 }
shadow.card   = shadow of 0 4px 14px rgba(16,60,59,0.07)     // RN: shadowColor '#103c3b', opacity ~0.08, radius 14, offset {0,4}, elevation 3
shadow.teal   = 0 6px 16px rgba(21,157,155,0.35)             // teal CTA glow
shadow.raised = 0 8px 22px rgba(11,95,94,0.28)               // gradient summary cards
shadow.sheet  = 0 -10px 30px rgba(16,60,59,0.14)             // bottom sheets
fonts = { regular:'IBMPlexSansArabic_400Regular', medium:'..._500Medium', semibold:'..._600SemiBold', bold:'..._700Bold' }
```
Set the loaded font family as the default on ALL Text. `font-weight:700`→bold family, 600→semibold, 500/600→medium/semibold, else regular.

## RTL / i18n
- Arabic default. On first load set language = ar. Use `I18nManager.forceRTL(true)` for ar / `forceRTL(false)` for en, persisted; because toggling RTL needs an app reload, on language switch call `Updates.reloadAsync()` if available else prompt-free best effort. Layout uses flexbox that already mirrors via I18nManager; keep explicit `writingDirection`/`textAlign` where needed.
- `t(key)` returns the string for the active language. Provide EN translations for ALL strings (the design only fully mirrors Home in screen 11 — use those exact EN strings for Home; translate the rest cleanly). Home EN strings from design: "Good evening, Sara 👋", "Baghdad · Karrada", "Search masgouf, dolma, quzi…", "SUBSCRIBE & SAVE", "Your daily meal, up to 20% off", "Build your plan →", All/Healthy 🌿/Regular/Most ordered, "Featured dishes", "See all", Masgouf carp/480 kcal/IQD 25,000, "Quzi over rice"/"Serves two"/IQD 18,000, "Jareesh soup"/240 kcal/IQD 5,000, "Most ordered this week", "Iraqi dolma", "Vine leaves & vegetables stuffed with rice and lamb".
- Prices formatting: Arabic shows western digits with `د.ع` suffix in cart/menu (e.g. `25,000 د.ع`) but Arabic-indic digits for calories/counts (٤٨٠ سعرة). English shows `IQD 25,000`. Keep the exact digit style the design uses per place.

## Menu data (data/menu.ts) — 12 dishes
Image base: `https://commons.wikimedia.org/wiki/Special:FilePath/` + file + `?width=600`
```
id        name(ar)                sub(ar)                          price     cat  pop  file
masgouf   مسكوف شبوط بغدادي        مشوي على الحطب · ٤٨٠ سعرة         25,000    h    yes  Masgouf.jpg
quzi      قوزي على تمن             لحم غنم مع تمن بالزعفران          18,000    r    yes  Iraqi%20Quzi.jpg
dolma     دولمة عراقية             ورق عنب وخضار محشية              12,000    r    yes  Iraqi%20Dolma-Mosul%2001.jpg
biryani   برياني عراقي             مع دجاج ونثريات                  10,000    r    yes  Hyderabadi%20Chicken%20Biryani.jpg
tashreeb  تشريب دجاج               خبز تنور ومرق حمص                9,000     r    yes  Tashreeb.JPG
kubba     كبة الموصل               محشية لحم وصنوبر                8,000     r    no   Iraqi%20Kuba.jpg
bagilla   تمن وباقلاء              بالشبنت ودهن حر · ٥٢٠ سعرة        8,000     h    no   Rice%20and%20beans.jpg
bamia     مرق بامية بلحم الغنم      مع تمن عنبر                     9,000     r    no   Bamia-Ocras%20tomate%20(cropped).JPG
jireesh   شوربة جريش               حبوب قمح جريشة · ٢٤٠ سعرة         5,000     h    yes  Harees.JPG
shish     شيش طاووق صحي            مع خضار مشوية · ٣٩٠ سعرة          11,000    h    no   Iraqi%20Mixed%20Grill%20Platter%20with%20Traditional%20Accompaniments.jpg
salad     سلطة جرجير ورمان         دبس رمان وجوز · ١٨٠ سعرة          4,000     h    no   Fattoush%201.JPG
kleicha   كليجة بالتمر             حلوى العيد · ٦ قطع               3,000     r    no   Iraqi%20Dates%20Kleicha.jpg
```
Category tag: h = «صحي» (healthyBg/tealText, EN "Healthy"), r = «عادي» (regularBg/amberIcon, EN "Regular").
Hero/banner image: `Iraqi%20dinner%20spread.jpg?width=1200`.

## Plan-builder logic (screen 05) — reproduce exactly
- meals/day options: 1،2،3،+٤ (values 1,2,3,4). default 2.
- durations: weekly(disc 0.10, weeks 1, label أسبوعي/per أسبوع), monthly(0.18, 4, شهري/شهر), yearly(0.25, 52, سنوي/سنة). default monthly. Show «خصم N٪».
- days chips: [سبت,أحد,اثنين,ثلاثاء,أربعاء,خميس,جمعة] default indices 0-4 selected.
- times chips: [☀️ فطور, 🍽️ غداء, 🌙 عشاء] default غداء+عشاء selected.
- BASE_PER_MEAL = 6000.
- daysCount = # selected days. gross = meals * daysCount * weeks * 6000. total = gross*(1-disc). perMeal = total/(meals*daysCount*weeks) (guard /0).
- summary card (teal gradient): shows planSummary «N وجبات × M أيام أسبوعياً», savings «توفّر X د.ع», big total `total د.ع / <per>`, «≈ perMeal د.ع للوجبة بدل 6,000 عند الطلب المفرد», CTA «اشترك الآن». All numbers update live. planSummary uses arabic-indic digits for the small counts.

## Tracking logic (screen 07)
- states: preparing/ontheway/delivered → step idx 0/1/2. steps [قيد التحضير, في الطريق, تم التوصيل].
- headlines: preparing «مطبخنا يحضّر طلبك», ontheway «كرار في الطريق إليك», delivered «وصل طلبك — بالعافية!». default ontheway.
- Order #٤٨٢١ · وجبة الغداء · 18 min. Driver: كرار محمد, سائق هيل · دراجة كهربائية.
- Animate: dashed route line (stroke-dasharray, animate dashoffset), pulsing driver marker + live dot (use Reanimated or Animated loop). Map is a stylized grid background with rounded blob shapes (no real map SDK).

## Navigation map
RootStack (native-stack, headers hidden):
  Splash (initial) → on «متابعة» navigate to Tabs
  Tabs (bottom tabs, custom TabBar):
    Home (0) | Menu (1) | PlanBuilder (2, «الاشتراكات») | Orders (3, «طلباتي») | Profile (4, «حسابي»)
  DishDetail (push, from DishCard / featured / popular)
  Cart (push, from home cart icon or menu +)
  Tracking (push, from Orders / after checkout)
  Institution (push, from Profile «تبديل» switch card)
- Home hero «ابنِ خطتك» / Build-your-plan → PlanBuilder tab.
- Dish detail «أضف للسلة» → Cart. Cart «تأكيد الطلب» → Tracking.
- Profile language row toggles lang; header language pill on Home toggles lang.

## Interaction requirements (full interactive clone)
- Menu: category chips (الكل/صحي/عادي/الأكثر طلباً) filter the grid live (pop = dishes with pop=yes).
- Plan builder: all selections update the live price summary.
- Tracking: expose the 3 states; default ontheway; steps + headline reflect state.
- Cart: qty steppers adjust and totals recompute (المجموع + توصيل 2,000 = الإجمالي).
- Language toggle flips ar/en and RTL/LTR app-wide.
- Everything else navigable; buttons that are pure visual can be pressable no-ops but should give feedback (activeOpacity).

## Rules
- Match the design's copy EXACTLY (Arabic strings verbatim). Don't invent new screens.
- Import tokens from theme.ts and strings from i18n — NEVER hardcode hex or duplicate the palette in screens.
- Reuse shared components (Icon, Tag, DishCard, CartRow, Segmented, Screen, TabBar).
- No placeholder/TODO code. TypeScript must compile clean (`npx tsc --noEmit`).
- Keep each screen in its own file per the structure above.
