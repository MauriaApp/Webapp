import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// On importe directement les fichiers statiques
import fr from "@/locales/fr-FR.json";
import en from "@/locales/en-US.json";
import es from "@/locales/es-ES.json";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "fr",
    supportedLngs: ["fr", "en", "es"],
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      es: { translation: es }
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      caches: ["localStorage"]
    }
  });

export default i18n;
