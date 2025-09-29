// utils/translations.ts
import { getFromStorage, saveToStorage } from "./storage";
import i18n from "@/i18n";

export type LocaleOption = "fr-FR" | "en-US" | "es-ES";

export const LOCALE_STORAGE_KEY = "mauria-locale";

const I18N_CODE: Record<LocaleOption, "fr" | "en" | "es"> = {
  "fr-FR": "fr",
  "en-US": "en",
  "es-ES": "es"
};

const toLocaleOption = (lng?: string): LocaleOption => {
  if (!lng) return "fr-FR";
  return lng.startsWith("fr") ? "fr-FR" : lng.startsWith("es") ? "es-ES" : "en-US";
};

export const readInitialLocale = (): LocaleOption => {
  if (typeof window === "undefined") return "fr-FR";

  const stored = getFromStorage(LOCALE_STORAGE_KEY);
  if (stored === "fr-FR" || stored === "en-US" || stored === "es-ES") return stored;

  // fallback navigateur
  const nav = navigator.language || (navigator.languages && navigator.languages[0]) || "fr";
  return toLocaleOption(nav);
};

export const applyLocale = (locale: LocaleOption) => {
  const code = I18N_CODE[locale];
  i18n.changeLanguage(code);
  saveToStorage(LOCALE_STORAGE_KEY, locale);
};
