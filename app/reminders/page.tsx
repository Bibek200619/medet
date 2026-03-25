"use client";

import { useMemo, useState } from "react";
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
import { useLanguage } from "@/i18n/context";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

type ReminderStatus = "taken" | "pending" | "missed";

type Reminder = {
  id: number;
  medicine: string;
  dosage: string;
  time: string;
  period: "morning" | "afternoon" | "evening" | "night";
  status: ReminderStatus;
};

const periodIcons = {
  morning: Sunrise,
  afternoon: SunMedium,
  evening: CalendarClock,
  night: Moon,
};

const initialReminders: Reminder[] = [
  { id: 1, medicine: "Paracetamol", dosage: "500 mg after food", time: "8:00 AM", period: "morning", status: "taken" },
  { id: 2, medicine: "ORS solution", dosage: "1 glass slowly", time: "1:00 PM", period: "afternoon", status: "pending" },
  { id: 3, medicine: "Iron tablet", dosage: "1 tablet after dinner", time: "8:30 PM", period: "night", status: "pending" },
];

export default function RemindersPage() {
  const { t } = useLanguage();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReminders(initialReminders);
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const completedCount = useMemo(
    () => reminders.filter((reminder) => reminder.status === "taken").length,
    [reminders]
  );

  function markTaken(id: number) {
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === id ? { ...reminder, status: "taken" } : reminder
      )
    );
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
                  Large cards and simple status labels help family members support medication routines.
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
                ) : (
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
                                <h2 className="text-xl font-bold text-medet-text">{reminder.medicine}</h2>
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
                )}
              </div>

              <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-xl font-bold text-medet-text">Add a simple reminder</h2>
                <p className="mt-2 text-sm text-medet-text-secondary">
                  The backend can connect this form to Supabase sessions later.
                </p>
                <div className="mt-5 space-y-3">
                  {[
                    t("reminders.medicineName"),
                    t("reminders.dosage"),
                    t("reminders.time"),
                  ].map((label) => (
                    <label key={label} className="block">
                      <span className="mb-1 block text-sm font-bold text-medet-text">{label}</span>
                      <input className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-medet-primary" />
                    </label>
                  ))}
                </div>
                <button className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-medet-warm px-5 text-sm font-bold text-white">
                  <Plus className="h-4 w-4" />
                  {t("reminders.addReminder")}
                </button>
              </aside>
            </section>
          </div>
        </main>
      </PageTransition>
    </AppShell>
  );
}
