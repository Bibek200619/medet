"use client";

import { Check, Heart, Languages, MessageCircle, Mic, Phone } from "lucide-react";
import Link from "next/link";
import { AppShell, PageTransition } from "@/components/layout";
import { useLanguage } from "@/i18n/context";

const languageExamples: Record<string, string> = {
  en: "Tell us your symptom in simple words.",
  hi: "अपने लक्षण सरल शब्दों में बताएं।",
  bn: "সহজ ভাষায় আপনার লক্ষণ বলুন।",
  ne: "आफ्नो लक्षण सरल शब्दमा भन्नुहोस्।",
  ta: "உங்கள் அறிகுறியை எளிய வார்த்தைகளில் சொல்லுங்கள்.",
  kn: "ನಿಮ್ಮ ಲಕ್ಷಣವನ್ನು ಸರಳ ಪದಗಳಲ್ಲಿ ಹೇಳಿ.",
  mr: "तुमची लक्षणे सोप्या शब्दांत सांगा.",
};

export default function LanguagePage() {
  const { language, setLanguage, languages, t } = useLanguage();

  return (
    <AppShell>
      <PageTransition>
        <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-violet-50/80 via-white to-blue-50/60 px-4 py-5 lg:px-6">
          <div className="mx-auto max-w-6xl space-y-5">
            <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-[2rem] border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-medet-accent-light">
                  <Languages className="h-7 w-7 text-medet-accent" />
                </div>
                <h1 className="text-3xl font-bold text-medet-text sm:text-5xl">{t("language.title")}</h1>
                <p className="mt-3 max-w-2xl text-lg leading-relaxed text-medet-text-secondary">
                  {t("language.subtitle")}. This choice updates chat, voice, navigation, and
                  healthcare prompts instantly.
                </p>
              </div>

              <div className="rounded-[2rem] bg-slate-900 p-5 text-white shadow-sm sm:p-6">
                <Heart className="h-7 w-7 text-blue-300" />
                <h2 className="mt-4 text-2xl font-bold">Made for shared phones</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  Large buttons make it easier for families, health workers, and elderly users to
                  choose the right language quickly.
                </p>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {languages.map((item) => {
                const isActive = item.code === language;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLanguage(item.code)}
                    className={`min-h-40 rounded-[1.75rem] border p-5 text-left shadow-sm transition ${
                      isActive
                        ? "border-medet-primary bg-medet-primary-light"
                        : "border-slate-200 bg-white hover:border-medet-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-2xl font-bold text-medet-text">{item.nativeName}</p>
                        <p className="mt-1 text-sm font-semibold text-medet-text-secondary">
                          {item.name} - {item.script}
                        </p>
                      </div>
                      {isActive && (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-medet-primary text-white">
                          <Check className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                    <p className="mt-5 text-base leading-relaxed text-medet-text">
                      {languageExamples[item.code]}
                    </p>
                  </button>
                );
              })}
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Link
                href="/chat"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-medet-primary px-5 text-base font-bold text-white shadow-sm"
              >
                <MessageCircle className="h-5 w-5" />
                {t("landing.startConsultation")}
              </Link>
              <Link
                href="/voice"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-medet-secondary-light px-5 text-base font-bold text-medet-secondary"
              >
                <Mic className="h-5 w-5" />
                {t("landing.talkToAI")}
              </Link>
              <Link
                href="/emergency"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-medet-emergency-light px-5 text-base font-bold text-medet-emergency"
              >
                <Phone className="h-5 w-5" />
                {t("landing.emergencyHelp")}
              </Link>
            </section>
          </div>
        </main>
      </PageTransition>
    </AppShell>
  );
}
