"use client";

import type { Language } from "@/i18n";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SESSION_STORAGE_KEY = "medet-session";
const PROFILES_STORAGE_KEY = "medet-health-profiles";
const REMINDERS_STORAGE_KEY = "medet-medicine-reminders";

type JsonRecord = Record<string, unknown>;

export interface AuthUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  provider: "phone" | "google" | "guest";
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

export function isEmergencyText(text: string) {
  return /chest pain|breathing|breath|unconscious|stroke|bleeding|seizure|poison|burn|heart/i.test(
    text
  );
}

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

let cachedSessionString: string | null = null;
let cachedSession: AuthSession | null = null;

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(SESSION_STORAGE_KEY);
  if (value === cachedSessionString) {
    return cachedSession;
  }
  cachedSessionString = value;
  if (!value) {
    cachedSession = null;
  } else {
    try {
      cachedSession = JSON.parse(value);
    } catch {
      cachedSession = null;
    }
  }
  return cachedSession;
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

function createLocalSession(input: AuthInput, provider: AuthUser["provider"]): AuthSession {
  const phoneTail = input.phone?.replace(/\D/g, "").slice(-4);
  const user: AuthUser = {
    id: localId("user"),
    name: input.name || (provider === "guest" ? "Guest User" : "MEDET User"),
    phone: input.phone,
    email: input.email,
    provider,
  };

  return {
    user,
    accessToken: `local-${provider}-${phoneTail || "session"}`,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
  };
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
    return stored;
  }
}

export async function signInWithPhone(input: AuthInput) {
  try {
    const session = await apiFetch<AuthSession>("/auth/phone", {
      method: "POST",
      body: JSON.stringify(input),
    });
    saveSession(session);
    return session;
  } catch {
    const session = createLocalSession(input, "phone");
    saveSession(session);
    return session;
  }
}

export async function signInWithGoogle() {
  try {
    const session = await apiFetch<AuthSession>("/auth/google/session", {
      method: "POST",
    });
    saveSession(session);
    return session;
  } catch {
    const session = createLocalSession(
      { name: "Google User", email: "google.user@medet.local" },
      "google"
    );
    saveSession(session);
    return session;
  }
}

export function continueAsGuest() {
  const session = createLocalSession({ name: "Guest User" }, "guest");
  saveSession(session);
  return session;
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
    // Local fallback still signs out.
  } finally {
    saveSession(null);
  }
}

function normalizeChatChunk(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.replace(/^data:\s?/, "").trim())
    .filter((line) => line && line !== "[DONE]")
    .map((line) => {
      try {
        const parsed = JSON.parse(line) as JsonRecord;
        return String(parsed.delta ?? parsed.content ?? parsed.message ?? "");
      } catch {
        return line;
      }
    })
    .join("");
}

async function* fallbackChatStream(message: string): AsyncGenerator<string> {
  const emergency = isEmergencyText(message);
  const reply = emergency
    ? "This may need urgent medical care. Please call emergency services or go to the nearest hospital now. If possible, ask a family member or neighbor to stay with you while you get help."
    : "I hear you. I can guide you with simple next steps, but I will not diagnose you. How long has this been happening, and do you have fever, severe pain, dizziness, or trouble breathing?";

  for (const word of reply.split(" ")) {
    await new Promise((resolve) => setTimeout(resolve, 25));
    yield `${word} `;
  }
}

export async function* streamChatMessage(
  message: string,
  language: Language,
  session: AuthSession | null
): AsyncGenerator<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        ...(session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : {}),
      },
      body: JSON.stringify({ message, language, sessionId: session?.user.id }),
    });

    if (!response.ok || !response.body) {
      throw new Error("Streaming response unavailable");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = normalizeChatChunk(decoder.decode(value, { stream: true }));
      if (chunk) yield chunk;
    }
  } catch {
    yield* fallbackChatStream(message);
  }
}

const seedProfiles: HealthProfile[] = [
  {
    id: "profile-self",
    name: "Lenin Sarmah",
    relation: "Self",
    age: 28,
    bloodGroup: "O+",
    allergies: ["None known"],
    medicalConditions: ["Seasonal allergies"],
    medicines: ["Vitamin D", "ORS when needed"],
    emergencyContacts: [
      { name: "Family Contact", relation: "Family", phone: "+91 90000 44556" },
    ],
  },
  {
    id: "profile-mother",
    name: "Anita Sarmah",
    relation: "Mother",
    age: 56,
    bloodGroup: "B+",
    allergies: ["Penicillin"],
    medicalConditions: ["High blood pressure"],
    medicines: ["Amlodipine 5 mg"],
    emergencyContacts: [
      { name: "Family Contact", relation: "Family", phone: "+91 90000 44557" },
    ],
  },
];

const seedReminders: MedicineReminder[] = [
  {
    id: "reminder-paracetamol",
    medicineName: "Paracetamol",
    dosage: "500 mg after food",
    time: "8:00 AM",
    period: "morning",
    status: "taken",
  },
  {
    id: "reminder-ors",
    medicineName: "ORS solution",
    dosage: "1 glass slowly",
    time: "1:00 PM",
    period: "afternoon",
    status: "pending",
  },
  {
    id: "reminder-iron",
    medicineName: "Iron tablet",
    dosage: "1 tablet after dinner",
    time: "8:30 PM",
    period: "night",
    status: "pending",
  },
];

export async function getHealthProfiles(session: AuthSession | null) {
  try {
    const profiles = await apiFetch<HealthProfile[]>("/profiles", {
      token: session?.accessToken,
    });
    writeStorage(PROFILES_STORAGE_KEY, profiles);
    return profiles;
  } catch {
    return readStorage<HealthProfile[]>(PROFILES_STORAGE_KEY, seedProfiles);
  }
}

export async function saveHealthProfile(
  profile: HealthProfile,
  session: AuthSession | null
) {
  try {
    const saved = await apiFetch<HealthProfile>(`/profiles/${profile.id}`, {
      method: "PUT",
      body: JSON.stringify(profile),
      token: session?.accessToken,
    });
    const current = await getHealthProfiles(session);
    const next = current.map((item) => (item.id === saved.id ? saved : item));
    writeStorage(PROFILES_STORAGE_KEY, next);
    return saved;
  } catch {
    const current = readStorage<HealthProfile[]>(PROFILES_STORAGE_KEY, seedProfiles);
    const exists = current.some((item) => item.id === profile.id);
    const next = exists
      ? current.map((item) => (item.id === profile.id ? profile : item))
      : [...current, profile];
    writeStorage(PROFILES_STORAGE_KEY, next);
    return profile;
  }
}

export async function getReminders(session: AuthSession | null) {
  try {
    const reminders = await apiFetch<MedicineReminder[]>("/reminders", {
      token: session?.accessToken,
    });
    writeStorage(REMINDERS_STORAGE_KEY, reminders);
    return reminders;
  } catch {
    return readStorage<MedicineReminder[]>(REMINDERS_STORAGE_KEY, seedReminders);
  }
}

export async function saveReminder(
  reminder: MedicineReminder,
  session: AuthSession | null
) {
  try {
    const saved = await apiFetch<MedicineReminder>(`/reminders/${reminder.id}`, {
      method: "PUT",
      body: JSON.stringify(reminder),
      token: session?.accessToken,
    });
    const current = await getReminders(session);
    const exists = current.some((item) => item.id === saved.id);
    const next = exists
      ? current.map((item) => (item.id === saved.id ? saved : item))
      : [...current, saved];
    writeStorage(REMINDERS_STORAGE_KEY, next);
    return saved;
  } catch {
    const current = readStorage<MedicineReminder[]>(
      REMINDERS_STORAGE_KEY,
      seedReminders
    );
    const exists = current.some((item) => item.id === reminder.id);
    const next = exists
      ? current.map((item) => (item.id === reminder.id ? reminder : item))
      : [...current, reminder];
    writeStorage(REMINDERS_STORAGE_KEY, next);
    return reminder;
  }
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

  try {
    return await apiFetch<VoiceTranscription>("/voice/stt", {
      method: "POST",
      body: formData,
      token: session?.accessToken,
    });
  } catch {
    return { transcript: "", confidence: 0 };
  }
}

export async function synthesizeSpeech(
  text: string,
  language: Language,
  session: AuthSession | null
) {
  try {
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
    return await response.blob();
  } catch {
    return null;
  }
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

const seedClinics: NearbyClinic[] = [
  {
    id: "clinic-rural-family",
    name: "Rural Family Clinic",
    type: "clinic",
    distance: "1.2 km",
    travelTime: "12 min",
    address: "Village market road",
    phone: "+91 90000 12001",
    isOpen: true,
  },
  {
    id: "hospital-district",
    name: "District Civil Hospital",
    type: "hospital",
    distance: "2.4 km",
    travelTime: "18 min",
    address: "District center",
    phone: "+91 90000 12002",
    isOpen: true,
  },
  {
    id: "health-primary",
    name: "Primary Health Centre",
    type: "health_center",
    distance: "3.1 km",
    travelTime: "22 min",
    address: "Block health campus",
    phone: "+91 90000 12003",
    isOpen: true,
  },
  {
    id: "pharmacy-jan-aushadhi",
    name: "Jan Aushadhi Pharmacy",
    type: "pharmacy",
    distance: "800 m",
    travelTime: "8 min",
    address: "Near bus stand",
    phone: "+91 90000 12004",
    isOpen: false,
  },
];

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
  if (!location) return seedClinics;
  try {
    return await apiFetch<NearbyClinic[]>(
      `/clinics?lat=${location.latitude}&lng=${location.longitude}`
    );
  } catch {
    return seedClinics;
  }
}

export function getIntegrationModeLabel() {
  return API_BASE_URL.includes("localhost")
    ? "Local fallback + API-ready"
    : "Connected to backend";
}

export { nowIso };
