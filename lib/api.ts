"use client";

import type { Language } from "@/i18n";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SESSION_STORAGE_KEY = "medet-session";

type JsonRecord = Record<string, unknown>;

export interface AuthUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  provider: "phone" | "google";
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt?: string;
}

export interface AuthInput {
  name?: string;
  phone?: string;
  email?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  isEmergency?: boolean;
  language?: Language;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface HealthProfile {
  id: string;
  name: string;
  relation: string;
  age: number;
  bloodGroup?: string;
  allergies: string[];
  medicalConditions: string[];
  medicines: string[];
  emergencyContacts: EmergencyContact[];
}

export interface NearbyClinic {
  id: string;
  name: string;
  type: "clinic" | "hospital" | "health_center" | "pharmacy";
  distance: string;
  travelTime?: string;
  address: string;
  phone: string;
  isOpen: boolean;
  rating?: number;
  latitude?: number;
  longitude?: number;
}

export interface MedicineReminder {
  id: string;
  medicineName: string;
  dosage: string;
  time: string;
  period: "morning" | "afternoon" | "evening" | "night";
  status: "pending" | "taken" | "missed";
  notes?: string;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface VoiceTranscription {
  transcript: string;
  confidence?: number;
}

export type MedetInputType = "text" | "voice";
export type MedetSeverity = "low" | "medium" | "high";
export type MedetTrustLevel = "safe" | "guarded";
export type MedetCardType =
  | "emergency"
  | "action"
  | "hydration"
  | "medication"
  | "doctor_visit"
  | "symptom_warning"
  | "nutrition"
  | "followup";

export interface MedetCard {
  type: MedetCardType;
  title: string;
  content: string;
}

export interface MedetSource {
  title?: string | null;
  url?: string | null;
  snippet?: string | null;
  source_type?: string;
}

export interface MedetVoiceMetadata {
  interaction_mode: string;
  speech_to_text_status: string;
  transcript?: string | null;
  transcript_language?: string | null;
  voice_locale?: string | null;
  tts_text?: string | null;
  audio_status: string;
  audio_url?: string | null;
}

export interface MedetChatResponse {
  response: string;
  input_type: MedetInputType;
  language: string;
  emergency: boolean;
  severity: MedetSeverity;
  reason: string | null;
  medical_warning: boolean;
  trust_level: MedetTrustLevel;
  suggest_doctor: boolean;
  cards: MedetCard[];
  sources: MedetSource[];
  conversation_id: string;
  voice?: MedetVoiceMetadata | null;
}

export type MedetStreamEvent =
  | { type: "token"; content: string; conversation_id?: string; language?: string; input_type?: MedetInputType }
  | { type: "source"; source: MedetSource; conversation_id?: string; language?: string; input_type?: MedetInputType }
  | { type: "metadata"; metadata: MedetChatResponse }
  | { type: "done"; conversation_id?: string }
  | { type: "error"; message: string; retryable: boolean; code?: string };

function nowIso() {
  return new Date().toISOString();
}

function localId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API ${path} failed with ${response.status}`);
  }

  return readJson<T>(response);
}

export function getStoredSession() {
  return readStorage<AuthSession | null>(SESSION_STORAGE_KEY, null);
}

export function saveSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event("medet-session-change"));
    return;
  }
  writeStorage(SESSION_STORAGE_KEY, session);
  window.dispatchEvent(new Event("medet-session-change"));
}

export async function getCurrentSession() {
  const stored = getStoredSession();
  if (!stored) return null;

  try {
    const session = await apiFetch<AuthSession>("/auth/session", {
      token: stored.accessToken,
    });
    saveSession(session);
    return session;
  } catch {
    saveSession(null);
    return null;
  }
}

export async function signInWithPhone(input: AuthInput) {
  const session = await apiFetch<AuthSession>("/auth/phone", {
    method: "POST",
    body: JSON.stringify(input),
  });
  saveSession(session);
  return session;
}

export async function signInWithGoogle() {
  const session = await apiFetch<AuthSession>("/auth/google/session", {
    method: "POST",
  });
  saveSession(session);
  return session;
}

export function continueAsGuest() {
  saveSession(null);
}

export async function signOut() {
  const session = getStoredSession();
  try {
    if (session) {
      await apiFetch("/auth/logout", {
        method: "POST",
        token: session.accessToken,
      });
    }
  } catch {
    // Sign out locally even when the backend session endpoint is unavailable.
  } finally {
    saveSession(null);
  }
}

function toBackendLanguage(language: Language) {
  return language === "mr" ? "hi" : language;
}

function parseSseEvents(buffer: string, flush = false) {
  const events: Array<{ event: string; data: string }> = [];
  const frames = buffer.replace(/\r\n/g, "\n").split("\n\n");
  const remaining = flush ? "" : (frames.pop() ?? "");

  for (const frame of frames) {
    if (!frame.trim()) continue;

    let event = "message";
    const dataLines: string[] = [];

    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice("event:".length).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trim());
      }
    }

    if (dataLines.length) {
      events.push({ event, data: dataLines.join("\n") });
    }
  }

  return { events, remaining };
}

function normalizeMedetStreamEvents(eventName: string, rawData: string): MedetStreamEvent[] {
  try {
    const parsed = JSON.parse(rawData) as JsonRecord;
    const parsedType = readString(parsed.type);

    if (eventName === "metadata" || parsedType === "metadata") {
      return [
        {
          type: "metadata",
          metadata: coerceMedetChatResponse((parsed.metadata as JsonRecord | undefined) ?? parsed),
        },
      ];
    }
    if (isMedetChatResponseRecord(parsed)) {
      return [{ type: "metadata", metadata: coerceMedetChatResponse(parsed) }];
    }

    if (eventName === "source" || parsedType === "source" || parsedType === "sources") {
      const sourceList = Array.isArray(parsed.sources)
        ? parsed.sources
        : [parsed.source ?? parsed];
      return sourceList
        .filter((source): source is JsonRecord => Boolean(source) && typeof source === "object")
        .map((source) => ({ type: "source", source: coerceMedetSource(source) }));
    }

    if (eventName === "error" || parsedType === "error") {
      const error = parsed.error as JsonRecord | undefined;
      return [
        {
          type: "error",
          message: readString(error?.message) || readString(parsed.detail) || readString(parsed.message) || "Medet could not complete the response.",
          retryable: Boolean(error?.retryable ?? parsed.retryable ?? true),
          code: readString(error?.code) || readString(parsed.code) || undefined,
        },
      ];
    }

    if (parsedType === "done") {
      return [
        {
          type: "done",
          conversation_id: readString(parsed.conversation_id) || undefined,
        },
      ];
    }

    return [
      {
        type: "token",
        content:
          readString(parsed.content) ||
          readString(parsed.text) ||
          readString(parsed.delta) ||
          readString(parsed.message) ||
          readString(parsed.response),
        conversation_id: readString(parsed.conversation_id) || undefined,
        language: readString(parsed.language) || undefined,
        input_type: parsed.input_type === "voice" ? "voice" : "text",
      },
    ];
  } catch {
    return rawData ? [{ type: "token", content: rawData }] : [];
  }
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isMedetChatResponseRecord(value: JsonRecord) {
  return typeof value.response === "string" && ("emergency" in value || "cards" in value);
}

function coerceMedetChatResponse(value: JsonRecord): MedetChatResponse {
  return {
    response: readString(value.response) || readString(value.message),
    input_type: value.input_type === "voice" ? "voice" : "text",
    language: readString(value.language) || "en",
    emergency: Boolean(value.emergency),
    severity: value.severity === "medium" || value.severity === "high" ? value.severity : "low",
    reason: readString(value.reason) || null,
    medical_warning: Boolean(value.medical_warning),
    trust_level: value.trust_level === "guarded" ? "guarded" : "safe",
    suggest_doctor: Boolean(value.suggest_doctor),
    cards: Array.isArray(value.cards)
      ? value.cards
          .map(coerceMedetCard)
          .filter((card): card is MedetCard => Boolean(card))
      : [],
    sources: Array.isArray(value.sources) ? value.sources.map(coerceMedetSource) : [],
    conversation_id: readString(value.conversation_id) || localId("conversation"),
    voice: (value.voice as MedetVoiceMetadata | null | undefined) ?? null,
  };
}

function coerceMedetCard(value: unknown): MedetCard | null {
  if (!value || typeof value !== "object") return null;
  const record = value as JsonRecord;
  const type = readString(record.type);
  if (!isMedetCardType(type)) return null;
  return {
    type,
    title: readString(record.title),
    content: readString(record.content),
  };
}

function isMedetCardType(value: string): value is MedetCardType {
  return [
    "emergency",
    "action",
    "hydration",
    "medication",
    "doctor_visit",
    "symptom_warning",
    "nutrition",
    "followup",
  ].includes(value);
}

function coerceMedetSource(value: unknown): MedetSource {
  if (!value || typeof value !== "object") {
    return { title: readString(value), snippet: readString(value), source_type: "tavily" };
  }
  const record = value as JsonRecord;
  return {
    title: readString(record.title) || readString(record.name) || null,
    url: readString(record.url) || readString(record.link) || null,
    snippet: readString(record.snippet) || readString(record.content) || readString(record.description) || null,
    source_type: readString(record.source_type) || "tavily",
  };
}

export async function sendMedetChat(
  message: string,
  language: Language,
  session: AuthSession | null,
  options: { inputType?: MedetInputType; conversationId?: string } = {}
): Promise<MedetChatResponse> {
  return apiFetch<MedetChatResponse>("/medet/chat", {
    method: "POST",
    token: session?.accessToken,
    body: JSON.stringify({
      message,
      language: toBackendLanguage(language),
      input_type: options.inputType ?? "text",
      conversation_id: options.conversationId,
    }),
  });
}

export async function* streamMedetChat(
  message: string,
  language: Language,
  session: AuthSession | null,
  options: { inputType?: MedetInputType; conversationId?: string } = {}
): AsyncGenerator<MedetStreamEvent> {
  try {
    const response = await fetch(`${API_BASE_URL}/medet/chat/stream`, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        ...(session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : {}),
      },
      body: JSON.stringify({
        message,
        language: toBackendLanguage(language),
        input_type: options.inputType ?? "text",
        conversation_id: options.conversationId,
      }),
    });

    if (!response.ok || !response.body) {
      const fallback = await sendMedetChat(message, language, session, options);
      yield { type: "metadata", metadata: fallback };
      return;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const metadata = coerceMedetChatResponse((await response.json()) as JsonRecord);
      yield { type: "metadata", metadata };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let emittedEvent = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseEvents(buffer);
      buffer = parsed.remaining;

      for (const item of parsed.events) {
        for (const event of normalizeMedetStreamEvents(item.event, item.data)) {
          emittedEvent = true;
          yield event;
        }
      }
    }

    const flushed = parseSseEvents(buffer, true);
    for (const item of flushed.events) {
      for (const event of normalizeMedetStreamEvents(item.event, item.data)) {
        emittedEvent = true;
        yield event;
      }
    }

    if (!emittedEvent) {
      const fallback = await sendMedetChat(message, language, session, options);
      yield { type: "metadata", metadata: fallback };
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    const frontendSafeMessage =
      detail && !/(failed to fetch|load failed|network|streaming response unavailable)/i.test(detail)
        ? detail
        : "Medet backend is unavailable. Please check the connection and try again.";

    yield {
      type: "error",
      message: frontendSafeMessage,
      retryable: true,
      code: "frontend_fetch_failed",
    };
  }
}

export async function* streamChatMessage(
  message: string,
  language: Language,
  session: AuthSession | null
): AsyncGenerator<string> {
  for await (const event of streamMedetChat(message, language, session)) {
    if (event.type === "token") {
      yield event.content;
    }
  }
}

export async function getHealthProfiles(session: AuthSession | null) {
  return apiFetch<HealthProfile[]>("/profiles", {
    token: session?.accessToken,
  });
}

export async function saveHealthProfile(
  profile: HealthProfile,
  session: AuthSession | null
) {
  return apiFetch<HealthProfile>(`/profiles/${profile.id}`, {
    method: "PUT",
    body: JSON.stringify(profile),
    token: session?.accessToken,
  });
}

export async function getReminders(session: AuthSession | null) {
  return apiFetch<MedicineReminder[]>("/reminders", {
    token: session?.accessToken,
  });
}

export async function saveReminder(
  reminder: MedicineReminder,
  session: AuthSession | null
) {
  return apiFetch<MedicineReminder>(`/reminders/${reminder.id}`, {
    method: "PUT",
    body: JSON.stringify(reminder),
    token: session?.accessToken,
  });
}

export function createReminderDraft(
  medicineName: string,
  dosage: string,
  time: string
): MedicineReminder {
  const hour = Number(time.split(":")[0] || 8);
  const period: MedicineReminder["period"] =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 20 ? "evening" : "night";

  return {
    id: localId("reminder"),
    medicineName,
    dosage,
    time,
    period,
    status: "pending",
  };
}

export async function transcribeAudio(
  audio: Blob,
  language: Language,
  session: AuthSession | null
): Promise<VoiceTranscription> {
  const formData = new FormData();
  formData.append("audio", audio, "voice.webm");
  formData.append("language", language);

  return apiFetch<VoiceTranscription>("/voice/stt", {
    method: "POST",
    body: formData,
    token: session?.accessToken,
  });
}

export async function synthesizeSpeech(
  text: string,
  language: Language,
  session: AuthSession | null
) {
  const response = await fetch(`${API_BASE_URL}/voice/tts`, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      ...(session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : {}),
    },
    body: JSON.stringify({ text, language }),
  });
  if (!response.ok) throw new Error("TTS unavailable");
  return response.blob();
}

export function speakWithBrowser(text: string, language: Language) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang =
    language === "hi" || language === "mr" || language === "ne"
      ? "hi-IN"
      : language === "bn"
        ? "bn-IN"
        : language === "ta"
          ? "ta-IN"
          : language === "kn"
            ? "kn-IN"
            : "en-IN";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function getBrowserLocation(): Promise<LocationPoint> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      reject,
      { enableHighAccuracy: false, maximumAge: 1000 * 60 * 5, timeout: 8000 }
    );
  });
}

export async function getNearbyClinics(location: LocationPoint | null) {
  const query = location
    ? `?lat=${location.latitude}&lng=${location.longitude}`
    : "";
  return apiFetch<NearbyClinic[]>(`/clinics${query}`);
}

export function getIntegrationModeLabel() {
  return API_BASE_URL.includes("localhost")
    ? "Connected to local backend"
    : "Connected to backend";
}

export { nowIso };
