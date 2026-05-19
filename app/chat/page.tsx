"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  HeartPulse,
  Languages,
  MapPin,
  Mic,
  MicOff,
  Pill,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { AppShell, PageTransition } from "@/components/layout";
import { useLanguage } from "@/i18n/context";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
  emergency?: boolean;
};

const emergencyPattern =
  /chest pain|breathing|breath|unconscious|stroke|bleeding|seizure|poison|burn|heart/i;

const quickActions = [
  { key: "chat.symptomCheck", prompt: "I have fever, cough, and body pain.", icon: Stethoscope },
  { key: "chat.medicineInfo", prompt: "Can you explain how to take my medicine safely?", icon: Pill },
  { key: "chat.firstAid", prompt: "What first aid should I do for a small cut?", icon: ShieldCheck },
  { key: "chat.nutrition", prompt: "Suggest simple nutrition tips for recovery.", icon: HeartPulse },
];

function buildAssistantReply(input: string, id: number): ChatMessage {
  const hasEmergency = emergencyPattern.test(input);

  if (hasEmergency) {
    return {
      id,
      role: "assistant",
      emergency: true,
      text:
        "This may need urgent medical care. Please call emergency services or go to the nearest hospital now. If possible, ask a family member or neighbor to stay with you while you get help.",
    };
  }

  return {
    id,
    role: "assistant",
    text:
      "I hear you. I can guide you with simple next steps, but I will not diagnose you. How long has this been happening, and do you have fever, severe pain, dizziness, or trouble breathing?",
  };
}

export default function ChatPage() {
  const { t, language, languages } = useLanguage();
  const nextMessageId = useRef(2);
  const [input, setInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("prompt") ?? "";
  });
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text:
        "Hello, I am MEDET. Tell me what you are feeling in simple words. I will ask a few questions and help you decide what to do next.",
    },
  ]);

  const currentLanguage = useMemo(
    () => languages.find((item) => item.code === language),
    [language, languages]
  );

  function sendMessage(text: string) {
    const cleanText = text.trim();
    if (!cleanText) return;

    const userMessage: ChatMessage = {
      id: nextMessageId.current++,
      role: "user",
      text: cleanText,
    };

    const assistantMessage = buildAssistantReply(cleanText, nextMessageId.current++);

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
    setIsListening(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <AppShell>
      <PageTransition>
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-blue-50/70 via-white to-emerald-50/50">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-5 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:px-6">
            <section className="flex h-[calc(100dvh-9rem)] min-h-[520px] flex-col overflow-hidden rounded-[2rem] border border-blue-100/80 bg-white shadow-sm lg:h-[calc(100vh-7rem)] lg:min-h-[560px]">
              <div className="border-b border-blue-100 bg-white/95 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-medet-primary-light">
                      <Bot className="h-6 w-6 text-medet-primary" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-medet-text">{t("chat.welcomeTitle")}</h1>
                      <p className="text-sm text-medet-text-secondary">
                        Compassionate guidance in {currentLanguage?.nativeName}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/emergency"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-medet-emergency-light px-4 text-sm font-semibold text-medet-emergency"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {t("landing.emergencyHelp")}
                  </Link>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 medet-scrollbar sm:px-5">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
                  <span className="font-semibold">Important: </span>
                  {t("chat.disclaimerText")}
                </div>

                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-3xl px-4 py-3 text-base leading-relaxed sm:max-w-[72%] ${
                        message.role === "user"
                          ? "rounded-br-md bg-medet-primary text-white"
                          : message.emergency
                            ? "rounded-tl-md border border-red-200 bg-red-50 text-red-950"
                            : "rounded-tl-md bg-slate-50 text-medet-text"
                      }`}
                    >
                      {message.emergency && (
                        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-medet-emergency">
                          <AlertTriangle className="h-4 w-4" />
                          {t("emergency.warningTitle")}
                        </div>
                      )}
                      <p>{message.text}</p>
                      {message.emergency && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            href="tel:112"
                            className="rounded-xl bg-medet-emergency px-3 py-2 text-sm font-semibold text-white"
                          >
                            {t("emergency.dial")}
                          </Link>
                          <Link
                            href="/nearby"
                            className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-medet-emergency"
                          >
                            {t("emergency.nearestHospital")}
                          </Link>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                <div className="flex items-center gap-2 pl-2 text-sm text-medet-text-secondary">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-medet-secondary opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-medet-secondary" />
                  </span>
                  Ready to ask a careful follow-up question
                </div>
              </div>

              <div className="border-t border-blue-100 bg-white p-4">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1 medet-scrollbar">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.key}
                        type="button"
                        onClick={() => sendMessage(action.prompt)}
                        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-medet-text shadow-sm"
                      >
                        <Icon className="h-4 w-4 text-medet-primary" />
                        {t(action.key)}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsListening((value) => !value)}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      isListening
                        ? "bg-medet-primary text-white medet-animate-pulse-soft"
                        : "bg-medet-primary-light text-medet-primary"
                    }`}
                    aria-label={t("chat.voiceInput")}
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  <label className="sr-only" htmlFor="chat-input">
                    {t("chat.placeholder")}
                  </label>
                  <textarea
                    id="chat-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    rows={1}
                    placeholder={isListening ? t("chat.listening") : t("chat.placeholder")}
                    className="min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-medet-text outline-none transition focus:border-medet-primary focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-medet-primary text-white shadow-sm disabled:opacity-50"
                    aria-label={t("chat.send")}
                    disabled={!input.trim()}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
                <Link
                  href="/voice"
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-medet-secondary-light text-sm font-bold text-medet-secondary sm:hidden"
                >
                  <Mic className="h-4 w-4" />
                  Open voice-first mode
                </Link>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-[1.75rem] border border-blue-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-medet-secondary-light">
                    <Languages className="h-5 w-5 text-medet-secondary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-medet-text">{t("language.title")}</h2>
                    <p className="text-sm text-medet-text-secondary">
                      {currentLanguage?.nativeName} selected
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((item) => (
                    <div
                      key={item.code}
                      className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${
                        item.code === language
                          ? "border-medet-primary bg-medet-primary-light text-medet-primary"
                          : "border-slate-200 bg-slate-50 text-medet-text"
                      }`}
                    >
                      {item.nativeName}
                    </div>
                  ))}
                </div>
                <Link
                  href="/language"
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-medet-text"
                >
                  Open language setup
                </Link>
              </div>

              <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-bold text-medet-text">How MEDET guides you</h2>
                <div className="space-y-3 text-sm text-medet-text-secondary">
                  {[
                    "Asks simple follow-up questions",
                    "Highlights emergency signs clearly",
                    "Recommends professional medical care",
                    "Keeps language and voice access visible",
                  ].map((item) => (
                    <div key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-medet-secondary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/nearby"
                className="flex items-center justify-between rounded-[1.75rem] border border-slate-200 bg-slate-900 p-5 text-white shadow-sm"
              >
                <div>
                  <p className="text-sm text-white/70">{t("nearby.title")}</p>
                  <h2 className="mt-1 font-bold">Find help close to you</h2>
                </div>
                <MapPin className="h-6 w-6 text-emerald-300" />
              </Link>

              <div className="rounded-[1.75rem] bg-gradient-to-br from-blue-600 to-emerald-600 p-5 text-white shadow-sm">
                <Sparkles className="mb-3 h-6 w-6" />
                <h2 className="font-bold">Built for low-bandwidth care</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/85">
                  Fast UI states, readable cards, and tap-friendly controls for low-end phones.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
