import en from "./translations/en.json";
import hi from "./translations/hi.json";
import bn from "./translations/bn.json";
import ne from "./translations/ne.json";
import ta from "./translations/ta.json";
import kn from "./translations/kn.json";
import mr from "./translations/mr.json";

export type Language = "en" | "hi" | "bn" | "ne" | "ta" | "kn" | "mr";

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  script: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", script: "Latin" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", script: "Devanagari" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", script: "Bengali" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", script: "Devanagari" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", script: "Tamil" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", script: "Kannada" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", script: "Devanagari" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translations: Record<Language, any> = {
  en,
  hi,
  bn,
  ne,
  ta,
  kn,
  mr,
};

/**
 * Get a nested translation value by dot-notation key.
 * Example: getTranslation("en", "landing.heroTitle")
 */
export function getTranslation(lang: Language, key: string): string {
  const keys = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations[lang];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      // Fallback to English if key not found in current language
      value = translations.en;
      for (const fk of keys) {
        if (value && typeof value === "object" && fk in value) {
          value = value[fk];
        } else {
          return key; // Return key itself as last resort
        }
      }
      return typeof value === "string" ? value : key;
    }
  }

  return typeof value === "string" ? value : key;
}

export function getLanguageName(code: Language): string {
  return LANGUAGES.find((l) => l.code === code)?.nativeName || code;
}

export default translations;
