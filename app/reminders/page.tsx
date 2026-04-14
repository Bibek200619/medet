"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarClock,
  Check,
  Clock3,
  Moon,
  Pill,
  Plus,
  Sunrise,
  SunMedium,
} from "lucide-react";
import { AppShell, PageTransition } from "@/components/layout";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/i18n/context";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createReminderDraft,
  getReminders,
  saveReminder,
  type MedicineReminder,
} from "@/lib/api";

const periodIcons = {
  morning: Sunrise,
  afternoon: SunMedium,
  evening: CalendarClock,
  night: Moon,
};

export default function RemindersPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReminders() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const items = await getReminders(session);
        if (isMounted) setReminders(items);
      } catch {
        if (!isMounted) return;
        setErrorMessage("Could not load reminders from the backend.");
        setReminders([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadReminders();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const completedCount = useMemo(
    () => reminders.filter((reminder) => reminder.status === "taken").length,
    [reminders]
  );

  async function markTaken(id: string) {
    const reminder = reminders.find((item) => item.id === id);
    if (!reminder) return;

    try {
      const updated = await saveReminder({ ...reminder, status: "taken" }, session);
      setReminders((current) =>
        current.map((item) => (item.id === id ? updated : item))
      );
    } catch {
      setErrorMessage("Could not update reminder in the backend.");
    }
  }

  async function handleAddReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!medicineName.trim() || !dosage.trim() || !time.trim()) return;

    setIsSaving(true);
    setErrorMessage("");
    try {
      const saved = await saveReminder(
        createReminderDraft(medicineName.trim(), dosage.trim(), time),
        session
      );
      setReminders((current) => [...current, saved]);
      setMedicineName("");
      setDosage("");
      setTime("");
    } catch {
      setErrorMessage("Could not save reminder. Please check the backend connection.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <PageTransition>
        <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50/80 via-white to-blue-50/50 px-4 py-5 lg:px-6">
          <div className="mx-auto max-w-6xl space-y-5">
            <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="rounded-[2rem] border border-amber-100 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-medet-warm-light">
                      <Pill className="h-7 w-7 text-medet-warm" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-medet-text">{t("reminders.title")}</h1>
                      <p className="mt-2 max-w-2xl text-medet-text-secondary">{t("reminders.subtitle")}</p>
                    </div>
                  </div>
                  <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-medet-warm px-5 text-sm font-bold text-white shadow-sm">
                    <Plus className="h-4 w-4" />
                    {t("reminders.addReminder")}
                  </button>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
                <Bell className="h-7 w-7 text-amber-300" />
                <h2 className="mt-4 text-2xl font-bold">
                  {completedCount}/{reminders.length} taken today
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  Reminders load from the backend. Add your first reminder when storage is connected.
                </p>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <article
                      key={i}
                      className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4 w-full">
                          <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-6 w-32" />
                              <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-40" />
                            <div className="flex gap-3">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                        </div>
                        <Skeleton className="h-12 w-full sm:w-28 rounded-2xl" />
                      </div>
                    </article>
                  ))
                ) : reminders.length > 0 ? (
                  reminders.map((reminder) => {
                    const Icon = periodIcons[reminder.period];
                    const isTaken = reminder.status === "taken";
                    const isMissed = reminder.status === "missed";

                    return (
                      <article
                        key={reminder.id}
                        className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-4">
                            <div
                              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                                isTaken ? "bg-medet-secondary-light" : "bg-medet-warm-light"
                              }`}
                            >
                              <Icon className={`h-6 w-6 ${isTaken ? "text-medet-secondary" : "text-medet-warm"}`} />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-bold text-medet-text">{reminder.medicineName}</h2>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    isTaken
                                      ? "bg-medet-secondary-light text-medet-secondary"
                                      : isMissed
                                        ? "bg-medet-emergency-light text-medet-emergency"
                                        : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {t(`reminders.${reminder.status}`)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-medet-text-secondary">{reminder.dosage}</p>
                              <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-medet-text">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3 className="h-4 w-4 text-medet-primary" />
                                  {reminder.time}
                                </span>
                                <span>{t(`reminders.${reminder.period}`)}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => markTaken(reminder.id)}
                            disabled={isTaken}
                            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold ${
                              isTaken
                                ? "bg-medet-secondary-light text-medet-secondary"
                                : "bg-medet-primary text-white"
                            }`}
                          >
                            <Check className="h-4 w-4" />
                            {isTaken ? t("reminders.taken") : t("reminders.markTaken")}
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <article className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
                    <Pill className="mx-auto h-9 w-9 text-medet-text-secondary" />
                    <h2 className="mt-3 text-xl font-bold text-medet-text">No reminders found</h2>
                    <p className="mt-2 text-sm text-medet-text-secondary">
                      Saved reminders from the backend will appear here.
                    </p>
                  </article>
                )}
                {errorMessage && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                    {errorMessage}
                  </div>
                )}
              </div>

              <form onSubmit={handleAddReminder} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-xl font-bold text-medet-text">Add a simple reminder</h2>
                <p className="mt-2 text-sm text-medet-text-secondary">
                  This form saves through the backend reminder API.
                </p>
                <div className="mt-5 space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold text-medet-text">{t("reminders.medicineName")}</span>
                    <input
                      value={medicineName}
                      onChange={(event) => setMedicineName(event.target.value)}
                      className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-medet-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold text-medet-text">{t("reminders.dosage")}</span>
                    <input
                      value={dosage}
                      onChange={(event) => setDosage(event.target.value)}
                      className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-medet-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold text-medet-text">{t("reminders.time")}</span>
                    <input
                      value={time}
                      type="time"
                      onChange={(event) => setTime(event.target.value)}
                      className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-medet-primary"
                    />
                  </label>
                </div>
                <button
                  disabled={isSaving || !medicineName.trim() || !dosage.trim() || !time.trim()}
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-medet-warm px-5 text-sm font-bold text-white disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {isSaving ? "Saving..." : t("reminders.addReminder")}
                </button>
              </form>
            </section>
          </div>
        </main>
      </PageTransition>
    </AppShell>
  );
}
