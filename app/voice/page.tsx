"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  AudioLines,
  CheckCircle2,
  Languages,
  Mic,
  MicOff,
  MessageCircle,
  Pause,
  Pill,
  Play,
  Send,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { AppShell, PageTransition } from "@/components/layout";
import { useLanguage } from "@/i18n/context";
import {
  getStoredSession,
  sendMedetChat,
  speakWithBrowser,
  type MedetCard,
  type MedetCardType,
  type MedetChatResponse,
} from "@/lib/api";

const cardTone: Record<MedetCardType, string> = {
  emergency: "border-red-200 bg-red-50 text-red-950",
  action: "border-blue-100 bg-blue-50 text-blue-950",
  hydration: "border-cyan-100 bg-cyan-50 text-cyan-950",
  medication: "border-violet-100 bg-violet-50 text-violet-950",
  doctor_visit: "border-emerald-100 bg-emerald-50 text-emerald-950",
  symptom_warning: "border-amber-100 bg-amber-50 text-amber-950",
  nutrition: "border-lime-100 bg-lime-50 text-lime-950",
  followup: "border-slate-200 bg-white text-medet-text",
};

const cardIcon = {
  emergency: AlertTriangle,
  action: CheckCircle2,
  hydration: Volume2,
  medication: Pill,
  doctor_visit: MessageCircle,
  symptom_warning: AlertTriangle,
  nutrition: CheckCircle2,
  followup: MessageCircle,
} satisfies Record<MedetCardType, LucideIcon>;

function VoiceCardList({ cards }: { cards: MedetCard[] }) {
  if (!cards.length) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {cards.map((card) => {
        const Icon = cardIcon[card.type];
        return (
          <div key={`${card.type}-${card.title}`} className={`rounded-2xl border p-3 ${cardTone[card.type]}`}>
            <div className="flex items-center gap-2 text-sm font-bold">
              <Icon className="h-4 w-4 shrink-0" />
              {card.title}
            </div>
            <p className="mt-1 text-sm leading-relaxed">{card.content}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function VoicePage() {
  const { t, language, languages } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [medetResponse, setMedetResponse] = useState<MedetChatResponse | null>(null);

  const currentLanguage = useMemo(
    () => languages.find((item) => item.code === language),
    [language, languages]
  );

  const isEmergency = medetResponse?.emergency ?? false;

  async function askMedetVoice() {
    const cleanTranscript = transcript.trim();
    if (!cleanTranscript) return;
    setIsChecking(true);
    try {
      const response = await sendMedetChat(cleanTranscript, language, getStoredSession(), {
        inputType: "voice",
      });
      setMedetResponse(response);
      const spoken = response.voice?.tts_text || response.response;
      setIsSpeaking(speakWithBrowser(spoken, language));
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <AppShell>
      <PageTransition>
        <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-blue-50/80 via-white to-emerald-50/60 px-4 py-5 lg:px-6">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-sm">
              <div className="border-b border-blue-100 p-5 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-medet-primary-light px-4 py-2 text-sm font-bold text-medet-primary">
                      <AudioLines className="h-4 w-4" />
                      Voice-first consultation
                    </div>
                    <h1 className="mt-4 text-3xl font-bold text-medet-text sm:text-5xl">
                      Speak naturally. MEDET listens carefully.
                    </h1>
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-medet-text-secondary">
                      Designed for users who are more comfortable speaking than typing, with clear
                      listening, transcript, and response states.
                    </p>
                  </div>
                  <Link
                    href="/chat"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-medet-text"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Open chat
                  </Link>
                </div>
              </div>

              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="flex flex-col items-center justify-center rounded-[2rem] bg-gradient-to-b from-blue-50 to-emerald-50 p-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsListening((value) => !value)}
                    className={`relative flex h-40 w-40 items-center justify-center rounded-full transition ${
                      isListening ? "bg-medet-primary text-white" : "bg-white text-medet-primary"
                    } shadow-sm`}
                    aria-label={t("chat.voiceInput")}
                  >
                    {isListening && (
                      <>
                        <span className="absolute h-full w-full rounded-full bg-medet-primary/20 animate-ping" />
                        <span className="absolute h-56 w-56 rounded-full border border-medet-primary/20" />
                      </>
                    )}
                    {isListening ? <MicOff className="relative h-14 w-14" /> : <Mic className="h-14 w-14" />}
                  </button>
                  <h2 className="mt-6 text-2xl font-bold text-medet-text">
                    {isListening ? t("chat.listening") : "Tap to speak"}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-medet-text-secondary">
                    Current language: {currentLanguage?.nativeName}. Speak one symptom at a time.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="text-lg font-bold text-medet-text">Live transcript</h2>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-medet-text-secondary">
                        Speech to text
                      </span>
                    </div>
                    <textarea
                      value={transcript}
                      onChange={(event) => {
                        setTranscript(event.target.value);
                        setMedetResponse(null);
                      }}
                      rows={4}
                      placeholder="Speech-to-text transcript will appear here. You can type a transcript to test voice mode."
                      className="min-h-32 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xl font-bold leading-relaxed text-medet-text outline-none focus:border-medet-primary"
                    />
                    <button
                      type="button"
                      onClick={() => void askMedetVoice()}
                      disabled={isChecking || !transcript.trim()}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-medet-primary px-4 text-sm font-bold text-white disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {isChecking ? "Checking with MEDET..." : "Check with MEDET"}
                    </button>
                  </div>

                  {isEmergency ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-[1.75rem] border border-red-200 bg-red-50 p-5"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-medet-emergency" />
                        <div>
                          <h2 className="text-xl font-bold text-red-950">{t("emergency.warningTitle")}</h2>
                          <p className="mt-2 text-sm leading-relaxed text-red-900">
                            {medetResponse?.response}
                          </p>
                          {medetResponse?.cards && (
                            <div className="mt-4">
                              <VoiceCardList cards={medetResponse.cards} />
                            </div>
                          )}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              href="tel:112"
                              className="inline-flex min-h-11 items-center rounded-2xl bg-medet-emergency px-4 text-sm font-bold text-white"
                            >
                              {t("emergency.dial")}
                            </Link>
                            <Link
                              href="/nearby"
                              className="inline-flex min-h-11 items-center rounded-2xl bg-white px-4 text-sm font-bold text-medet-emergency"
                            >
                              {t("emergency.nearestHospital")}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
                      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-medet-secondary">
                        <CheckCircle2 className="h-4 w-4" />
                        Safe to continue with follow-up questions
                      </div>
                      <p className="text-base leading-relaxed text-medet-text">
                        {medetResponse?.response ||
                          "Enter a transcript and send it to the backend. Medet will return voice metadata, safety status, and care cards."}
                      </p>
                      {medetResponse?.cards && (
                        <div className="mt-4">
                          <VoiceCardList cards={medetResponse.cards} />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setIsSpeaking((value) => !value)}
                      className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-medet-secondary-light px-4 text-sm font-bold text-medet-secondary"
                    >
                      {isSpeaking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isSpeaking ? "Pause voice reply" : "Play voice reply"}
                    </button>
                    <Link
                      href={`/chat?prompt=${encodeURIComponent(transcript)}`}
                      className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-medet-primary px-4 text-sm font-bold text-white"
                    >
                      <Send className="h-4 w-4" />
                      Send to chat
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-[1.75rem] border border-blue-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-medet-primary-light">
                    <Languages className="h-5 w-5 text-medet-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-medet-text">{t("language.title")}</h2>
                    <p className="text-sm text-medet-text-secondary">
                      {currentLanguage?.nativeName} voice mode
                    </p>
                  </div>
                </div>
                <Link
                  href="/language"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-medet-text"
                >
                  Change language
                </Link>
              </div>

              <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
                <Volume2 className="h-6 w-6 text-medet-secondary" />
                <h2 className="mt-4 font-bold text-medet-text">Voice reply state</h2>
                <p className="mt-2 text-sm leading-relaxed text-medet-text-secondary">
                  The assistant response can be spoken aloud for elderly users and low-literacy
                  consultations.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-medet-secondary">
                  <span className="h-2 w-2 rounded-full bg-medet-secondary animate-pulse" />
                  {isSpeaking ? "Speaking slowly" : "Paused"}
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-slate-900 p-5 text-white shadow-sm">
                <h2 className="font-bold">Backend-ready hooks</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  This UI is ready for speech-to-text, streaming AI responses, and text-to-speech
                  service wiring without changing the user flow.
                </p>
              </div>
            </aside>
          </div>
        </main>
      </PageTransition>
    </AppShell>
  );
}
