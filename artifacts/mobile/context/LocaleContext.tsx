import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, translations, TranslationKey } from "@/i18n/translations";

const LOCALE_STORAGE_KEY = "locale_override";

function detectDeviceLocale(): string {
  const deviceLocales = Localization.getLocales();
  for (const deviceLocale of deviceLocales) {
    const tag = deviceLocale.languageTag; // e.g. "zh-TW", "es-MX", "en-US"
    const langCode = deviceLocale.languageCode; // e.g. "zh", "es", "en"

    if (langCode === "zh") {
      const isTraditional =
        deviceLocale.languageScriptCode === "Hant" ||
        tag?.toLowerCase().includes("tw") ||
        tag?.toLowerCase().includes("hk") ||
        tag?.toLowerCase().includes("mo");
      if (isTraditional) return "zh-Hant";
      continue;
    }

    const match = SUPPORTED_LOCALES.find((l) => l.code === langCode);
    if (match) return match.code;
  }
  return DEFAULT_LOCALE;
}

interface LocaleContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isRtl: boolean;
  isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_STORAGE_KEY).then((stored) => {
      const finalLocale = stored && translations[stored] ? stored : detectDeviceLocale();
      setLocaleState(finalLocale);
      try { (globalThis as any).__authLocaleOverride = finalLocale; } catch (e) { /* ignore */ }
      setIsLoading(false);
    });
  }, []);

  const setLocale = async (newLocale: string) => {
    setLocaleState(newLocale);
    try { (globalThis as any).__authLocaleOverride = newLocale; } catch (e) { /* ignore */ }
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  };

  const isRtl = useMemo(() => SUPPORTED_LOCALES.find((l) => l.code === locale)?.rtl ?? false, [locale]);

  const t = useMemo(() => {
    return (key: TranslationKey, params?: Record<string, string | number>) => {
      const dict = translations[locale] ?? translations[DEFAULT_LOCALE];
      let str = dict[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
      if (params) {
        for (const [paramKey, value] of Object.entries(params)) {
          str = str.replace(`{${paramKey}}`, String(value));
        }
      }
      return str;
    };
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, isRtl, isLoading }}>{children}</LocaleContext.Provider>
  );
}

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within a LocaleProvider");
  return context;
};

export function getLocalizedTitle(drama: { titleEn: string; titles?: Record<string, string> | null }, locale: string): string {
  if (locale === DEFAULT_LOCALE) return drama.titleEn;
  return drama.titles?.[locale] || drama.titleEn;
}