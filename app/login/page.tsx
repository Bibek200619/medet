"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Mail, Phone, ShieldCheck, UserPlus, UserRound } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { useLanguage } from "@/i18n/context";

export default function LoginPage() {
  const { t } = useLanguage();
  const { session, signInPhone, signInGoogle, continueGuest, signOutUser } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const isSignup = mode === "signup";

  async function handlePhoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    try {
      await signInPhone({ name: name || undefined, phone });
      setStatus("ready");
      router.push("/chat");
    } catch {
      setStatus("error");
      setErrorMessage("Sign-in service is not available. You can continue without an account.");
    }
  }

  async function handleGoogle() {
    setStatus("loading");
    setErrorMessage("");
    try {
      await signInGoogle();
      setStatus("ready");
      router.push("/chat");
    } catch {
      setStatus("error");
      setErrorMessage("Google sign-in is not connected yet. You can continue without an account.");
    }
  }

  function handleGuest() {
    continueGuest();
    router.push("/chat");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-emerald-50 px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl medet-gradient-primary">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-medet-text">
              MED<span className="text-medet-primary">ET</span>
            </span>
          </Link>
          <LanguageSwitcher />
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-medet-secondary-light px-4 py-2 text-sm font-bold text-medet-secondary">
              <ShieldCheck className="h-4 w-4" />
              {session ? `Signed in as ${session.user.name}` : "Private and community-ready"}
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-medet-text sm:text-5xl">
              Start healthcare guidance in your language.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-medet-text-secondary">
              Sign in to keep family health profiles, reminders, and consultations together.
              You can also continue without an account for quick help.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Multilingual", "Voice-first", "Low bandwidth"].map((item) => (
                <div key={item} className="rounded-3xl border border-slate-200 bg-white p-4 text-sm font-bold text-medet-text shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-medet-primary-light">
                {isSignup ? (
                  <UserPlus className="h-6 w-6 text-medet-primary" />
                ) : (
                  <UserRound className="h-6 w-6 text-medet-primary" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-medet-text">
                  {isSignup ? "Create your MEDET profile" : "Welcome to MEDET"}
                </h2>
                <p className="text-sm text-medet-text-secondary">
                  {isSignup ? "Save family health details safely" : "Choose a simple sign-in method"}
                </p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              {[
                { id: "login", label: "Log in" },
                { id: "signup", label: "Sign up" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id as "login" | "signup")}
                  className={`min-h-11 rounded-xl text-sm font-bold transition ${
                    mode === item.id ? "bg-white text-medet-primary shadow-sm" : "text-medet-text-secondary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-medet-text shadow-sm"
              disabled={status === "loading"}
            >
              <Mail className="h-4 w-4 text-medet-primary" />
              {t("landing.continueWithGoogle")}
            </button>

            {errorMessage && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {errorMessage}
              </div>
            )}

            <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-medet-text-secondary">
              <span className="h-px flex-1 bg-slate-200" />
              or
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form className="space-y-3" onSubmit={handlePhoneSubmit}>
              {isSignup && (
                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-medet-text">{t("profile.name")}</span>
                  <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                    <UserRound className="h-4 w-4 text-medet-text-secondary" />
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Full name"
                      className="w-full bg-transparent text-base outline-none"
                    />
                  </div>
                </label>
              )}
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-medet-text">{t("profile.phone")}</span>
                <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                  <Phone className="h-4 w-4 text-medet-text-secondary" />
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    inputMode="tel"
                    placeholder="+91 90000 00000"
                    className="w-full bg-transparent text-base outline-none"
                  />
                </div>
              </label>
              <button
                className="min-h-12 w-full rounded-2xl bg-medet-primary text-sm font-bold text-white disabled:opacity-60"
                disabled={status === "loading" || !phone.trim()}
              >
                {status === "loading"
                  ? "Connecting..."
                  : isSignup
                    ? "Create profile"
                    : "Continue"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleGuest}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-medet-secondary-light text-sm font-bold text-medet-secondary"
            >
              Continue without account
            </button>

            {session && (
              <button
                type="button"
                onClick={signOutUser}
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-medet-text"
              >
                Sign out current session
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
