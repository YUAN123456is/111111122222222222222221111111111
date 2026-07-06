---
name: FontAwesome5 default style crashes on native Expo
description: Why unlabeled FontAwesome5 icons (no solid/brand prop) can crash or render broken on iOS/Android, and what to do instead
---

`@expo/vector-icons`'s free `FontAwesome5` package only bundles the Solid and Brands font families — it does NOT bundle Font Awesome 5 Free-Regular. If a `<FontAwesome5>` icon is rendered without an explicit `solid` or `brand` prop, its default style is Regular, which triggers a native font-registration attempt that fails (iOS: `CTFontManagerError code: 104`, "Registering 'FontAwesome5Free-Regular' font failed"). This can crash the screen or render the icon as blank/broken glyphs.

**Why:** Discovered when a user reported the player screen's action-rail icons (Like heart when unliked, Save bookmark with no `solid` prop) looked wrong and threw a console crash — both were implicitly requesting the missing Regular style.

**How to apply:** Always pass `solid` explicitly on every `<FontAwesome5>` icon (toggle active/inactive state via `color`, not by switching solid/regular), and pass `brand` explicitly for brand icons (e.g. `apple`, `google`). Never leave the style prop unset and rely on the default.
