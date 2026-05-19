"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/context";

export function LanguageSwitcher({ variant = "default" }: { variant?: "default" | "compact" }) {
  const { language, setLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find((l) => l.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl transition-all duration-200 medet-tap-target ${
          variant === "compact"
            ? "p-2 hover:bg-medet-primary-light"
            : "px-4 py-2.5 bg-white/80 hover:bg-white border border-gray-200 medet-shadow-sm"
        }`}
        aria-label={t("language.title")}
        id="language-switcher-button"
      >
        <Globe className="w-5 h-5 text-medet-primary" />
        {variant !== "compact" && (
          <span className="text-sm font-medium text-medet-text">
            {currentLang?.nativeName}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-full mt-2 z-50 w-64 bg-white rounded-2xl medet-shadow-lg border border-gray-100 overflow-hidden"
              id="language-dropdown"
            >
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-medet-text-secondary uppercase tracking-wide">
                  {t("language.title")}
                </p>
              </div>

              <div className="p-2 max-h-80 overflow-y-auto medet-scrollbar">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-150 medet-tap-target ${
                      language === lang.code
                        ? "bg-medet-primary-light text-medet-primary"
                        : "hover:bg-gray-50 text-medet-text"
                    }`}
                    id={`language-option-${lang.code}`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-base font-medium">
                        {lang.nativeName}
                      </span>
                      <span className="text-xs text-medet-text-secondary">
                        {lang.name}
                      </span>
                    </div>
                    {language === lang.code && (
                      <Check className="w-5 h-5 text-medet-primary" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-100 p-2">
                <Link
                  href="/language"
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-11 items-center justify-center rounded-xl bg-medet-primary-light text-sm font-bold text-medet-primary"
                >
                  Open language setup
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
