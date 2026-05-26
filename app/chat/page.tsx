"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { AppShell, PageTransition } from "@/components/layout";
import { useLanguage } from "@/i18n/context";
import {
  getStoredSession,
  streamMedetChat,
  type MedetCard,
  type MedetCardType,
  type MedetInputType,
  type MedetSeverity,
  type MedetSource,
  type MedetTrustLevel,
} from "@/lib/api";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
  emergency?: boolean;
  severity?: MedetSeverity;
  medicalWarning?: boolean;
  trustLevel?: MedetTrustLevel;
  suggestDoctor?: boolean;
  cards?: MedetCard[];
  sources?: MedetSource[];
  isStreaming?: boolean;
};

type PersistedChatState = {
  conversationId?: string;
  messages: ChatMessage[];
};

const CHAT_STORAGE_KEY = "medet-chat-state";

const quickActions = [
  { key: "chat.symptomCheck", prompt: "I want to check symptoms.", icon: Stethoscope },
  { key: "chat.medicineInfo", prompt: "I have a medicine safety question.", icon: Pill },
  { key: "chat.firstAid", prompt: "I need basic first aid guidance.", icon: ShieldCheck },
  { key: "chat.nutrition", prompt: "I need simple recovery food guidance.", icon: HeartPulse },
];

const cardTone: Record<MedetCardType, string> = {
  emergency: "border-red-200 bg-red-100/80 text-red-950",
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
  hydration: HeartPulse,
  medication: Pill,
  doctor_visit: Stethoscope,
  symptom_warning: ShieldCheck,
  nutrition: HeartPulse,
  followup: Bot,
} satisfies Record<MedetCardType, LucideIcon>;

function loadPersistedChatState(): PersistedChatState {
  if (typeof window === "undefined") return { messages: [] };

  try {
    const rawState = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!rawState) return { messages: [] };

    const parsed = JSON.parse(rawState) as Partial<PersistedChatState>;
    return {
      conversationId: typeof parsed.conversationId === "string" ? parsed.conversationId : undefined,
      messages: Array.isArray(parsed.messages)
        ? parsed.messages.filter(isPersistedMessage).map((message) => ({
            ...message,
            isStreaming: false,
          }))
        : [],
    };
  } catch {
    return { messages: [] };
  }
}

function persistChatState(state: PersistedChatState) {
  if (typeof window === "undefined") return;

  const messages = state.messages
    .filter((message) => message.role === "user" || message.text.trim() || (message.cards?.length ?? 0) > 0)
    .map((message) => ({ ...message, isStreaming: false }));

  window.localStorage.setItem(
    CHAT_STORAGE_KEY,
    JSON.stringify({
      conversationId: state.conversationId,
      messages,
    })
  );
}

function isPersistedMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === "number" &&
    (message.role === "assistant" || message.role === "user") &&
    typeof message.text === "string"
  );
}

function getNextMessageId(messages: ChatMessage[]) {
  return Math.max(1, ...messages.map((message) => message.id)) + 1;
}

function mergeSources(existing: MedetSource[] = [], incoming: MedetSource[]) {
  const seen = new Set(existing.map((source) => `${source.url ?? ""}|${source.title ?? ""}`));
  const merged = [...existing];

  for (const source of incoming) {
    const key = `${source.url ?? ""}|${source.title ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(source);
  }

  return merged;
}

function logStreamIssue(event: { code?: string; retryable?: boolean }) {
  if (process.env.NODE_ENV === "production") return;
  console.warn("[Medet chat] Stream did not complete normally", {
    code: event.code,
    retryable: event.retryable,
  });
}

export default function ChatPage() {
  const { t, language, languages } = useLanguage();
  const [initialChat] = useState(loadPersistedChatState);
  const nextMessageId = useRef(getNextMessageId(initialChat.messages));
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialChat.conversationId
  );
  const [input, setInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("prompt") ?? "";
  });
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat.messages);

  const currentLanguage = useMemo(
    () => languages.find((item) => item.code === language),
    [language, languages]
  );

  function updateAssistantMessage(id: number, patch: Partial<ChatMessage>) {
    setMessages((current) =>
      current.some((message) => message.id === id)
        ? current.map((message) =>
            message.id === id ? { ...message, ...patch } : message
          )
        : [...current, { id, role: "assistant", text: "", ...patch }]
    );
  }

  useEffect(() => {
    persistChatState({ conversationId, messages });
  }, [conversationId, messages]);

  async function sendMessage(text: string, inputType: MedetInputType = "text") {
    const cleanText = text.trim();
    if (!cleanText || isSending) return;

    const userMessage: ChatMessage = {
      id: nextMessageId.current++,
      role: "user",
      text: cleanText,
    };

    const assistantId = nextMessageId.current++;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      isStreaming: true,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
    setIsListening(false);
    setIsSending(true);

    let streamedText = "";
    let metadataReceived = false;
    let pendingSources: MedetSource[] = [];

    try {
      for await (const event of streamMedetChat(cleanText, language, getStoredSession(), {
        inputType,
        conversationId,
      })) {
        if (event.type === "token") {
          streamedText += event.content;
          if (streamedText) {
            updateAssistantMessage(assistantId, { text: streamedText, isStreaming: true });
          }
        }

        if (event.type === "source") {
          pendingSources = mergeSources(pendingSources, [event.source]);
          updateAssistantMessage(assistantId, { sources: pendingSources });
        }

        if (event.type === "metadata") {
          metadataReceived = true;
          setConversationId(event.metadata.conversation_id);
          const metadataSources = event.metadata.sources.length
            ? event.metadata.sources
            : pendingSources;
          updateAssistantMessage(assistantId, {
            text: event.metadata.response || streamedText,
            emergency: event.metadata.emergency,
            severity: event.metadata.severity,
            medicalWarning: event.metadata.medical_warning,
            trustLevel: event.metadata.trust_level,
            suggestDoctor: event.metadata.suggest_doctor,
            cards: event.metadata.cards,
            sources: metadataSources,
            isStreaming: false,
          });
        }

        if (event.type === "done") {
          metadataReceived = true;
          if (event.conversation_id) {
            setConversationId(event.conversation_id);
          }
          updateAssistantMessage(assistantId, {
            text: streamedText || "Medet completed the response, but no message text was returned.",
            sources: pendingSources,
            isStreaming: false,
          });
        }

        if (event.type === "error") {
          metadataReceived = true;
          logStreamIssue(event);
          updateAssistantMessage(assistantId, {
            text: streamedText
              ? `${streamedText}\n\n${event.message}`
              : event.message ||
                "I could not reach the Medet backend. Please check the backend server and try again.",
            medicalWarning: true,
            trustLevel: "guarded",
            sources: pendingSources,
            isStreaming: false,
          });
        }
      }
    } finally {
      if (!metadataReceived) {
        logStreamIssue({ code: "stream_ended_without_metadata", retryable: true });
        updateAssistantMessage(assistantId, {
          text:
            streamedText ||
            "Medet could not complete the response. Please check the backend and try again.",
          medicalWarning: !streamedText,
          trustLevel: streamedText ? undefined : "guarded",
          sources: pendingSources,
          isStreaming: false,
        });
      }
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input, isListening ? "voice" : "text");
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

                {messages.length === 0 && (
                  <div className="rounded-3xl border border-blue-100 bg-slate-50 px-4 py-5 text-sm leading-relaxed text-medet-text-secondary">
                    Tell Medet what is happening in your own words. Responses, safety warnings,
                    source cards, and care cards will come from the backend.
                  </div>
                )}

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
                      <p className="whitespace-pre-line">
                        {message.text || (message.isStreaming ? t("chat.thinking") : "")}
                        {message.isStreaming && (
                          <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
                        )}
                      </p>
                      {message.role === "assistant" && message.trustLevel && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                          <span className="rounded-full bg-white/80 px-2 py-1 text-medet-text-secondary">
                            Trust: {message.trustLevel}
                          </span>
                          {message.severity && (
                            <span className="rounded-full bg-white/80 px-2 py-1 text-medet-text-secondary">
                              Severity: {message.severity}
                            </span>
                          )}
                          {message.medicalWarning && (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">
                              Safety adjusted
                            </span>
                          )}
                        </div>
                      )}
                      {message.cards && message.cards.length > 0 && (
                        <div className="mt-3 grid gap-2">
                          {message.cards.map((card) => {
                            const Icon = cardIcon[card.type];
                            return (
                              <div
                                key={`${message.id}-${card.type}-${card.title}`}
                                className={`rounded-2xl border px-3 py-3 ${cardTone[card.type]}`}
                              >
                                <div className="flex items-center gap-2 text-sm font-bold">
                                  <Icon className="h-4 w-4 shrink-0" />
                                  {card.title}
                                </div>
                                <p className="mt-1 text-sm leading-relaxed">{card.content}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.sources.map((source, index) => (
                            <a
                              key={`${message.id}-source-${index}`}
                              href={source.url ?? "#"}
                              target={source.url ? "_blank" : undefined}
                              rel={source.url ? "noreferrer" : undefined}
                              className="block rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-medet-text"
                            >
                              <span className="font-bold">{source.title || "Health source"}</span>
                              {source.snippet && (
                                <span className="mt-1 block text-xs text-medet-text-secondary">
                                  {source.snippet}
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
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
                        onClick={() => setInput(action.prompt)}
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
                    disabled={!input.trim() || isSending}
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
