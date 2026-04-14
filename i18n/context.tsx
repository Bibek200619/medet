"use client";

import React, { createContext, useContext, useCallback, useSyncExternalStore } from "react";
import { Language, getTranslation, LANGUAGES, LanguageOption } from "@/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "medet-language";
const LANGUAGE_CHANGE_EVENT = "medet-language-change";

let fallbackLanguage: Language = "en";

function isSupportedLanguage(value: string | null): value is Language {
  return !!value && LANGUAGES.some((item) => item.code === value);
}

function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isSupportedLanguage(saved)) return saved;
  } catch {
    // localStorage may not be available
  }
  return fallbackLanguage;
}

function subscribeToLanguageChange(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  };
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore<Language>(
    subscribeToLanguageChange,
    getStoredLanguage,
    () => "en"
  );

  const setLanguage = useCallback((lang: Language) => {
    fallbackLanguage = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage may not be available
    }
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  }, []);

  const t = useCallback(
    (key: string) => getTranslation(language, key),
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, languages: LANGUAGES }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
