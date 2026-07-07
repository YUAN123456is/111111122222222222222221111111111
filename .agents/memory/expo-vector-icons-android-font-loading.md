---
name: Expo vector-icons Android font loading
description: Why FontAwesome5/Feather icons show as broken X-boxes on Android, and the fix
---

On Android (including Expo Go), `@expo/vector-icons` fonts are NOT automatically pre-loaded before components render. Each icon set registers fonts under specific family names (e.g. `FontAwesomeFree-Solid`, `FontAwesomeFree-Brand`, `Feather`) but these only take effect after `Font.loadAsync` runs — which doesn't happen automatically unless explicitly called.

**Symptom:** Icons render as □ or X-boxes on real Android device while working fine in web/iOS previews.

**Why:** Expo Go historically pre-bundled vector icon fonts natively, but newer SDKs (50+/SDK 54 with `newArchEnabled: true`) require explicit JS-side font loading before the first render. The broken X-box shape (not blank square) on Android is specifically the "image failed to load" placeholder showing that the native font wasn't registered in time.

**Fix (two parts):**
1. In `app/_layout.tsx`: call `useFonts` with the font files mapped to the exact family name strings the library registers, and gate splash-screen hide + rendering on `fontsLoaded`:
   ```js
   const [fontsLoaded] = useFonts({
     "FontAwesomeFree-Regular": require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf"),
     "FontAwesomeFree-Solid":   require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf"),
     "FontAwesomeFree-Brand":   require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Brands.ttf"),
     "Feather": require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf"),
   });
   if (!fontsLoaded) return null;
   ```
2. In `app.json`, configure the `expo-font` plugin `fonts` array with the same file paths (for standalone/EAS native builds).

**How to apply:** Any time new icon sets are added to the project, add the matching TTF from `node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/` to both the `useFonts` call and the `expo-font` plugin config. Family name strings come from `createFA5iconSet` (`FontAwesomeFree-*`) or the font file's PostScript name.
