"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Droplets,
  HeartHandshake,
  Phone,
  Pill,
  Plus,
  Shield,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { AppShell, PageTransition } from "@/components/layout";
import { useAuth } from "@/components/auth/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/i18n/context";
import { getHealthProfiles, type HealthProfile } from "@/lib/api";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [profiles, setProfiles] = useState<HealthProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const activeProfile =
    profiles.find((profile) => profile.id === activeId) ?? profiles[0] ?? null;

  useEffect(() => {
    let isMounted = true;

    async function loadProfiles() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const items = await getHealthProfiles(session);
        if (!isMounted) return;
        setProfiles(items);
        setActiveId(items[0]?.id ?? null);
      } catch {
        if (!isMounted) return;
        setErrorMessage("Could not load health profiles from the backend.");
        setProfiles([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProfiles();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const profileDetails = activeProfile
    ? [
        { label: t("profile.age"), value: `${activeProfile.age}`, icon: User },
        { label: t("profile.bloodGroup"), value: activeProfile.bloodGroup || "Not added", icon: Droplets },
        { label: t("profile.allergies"), value: activeProfile.allergies.join(", ") || "Not added", icon: AlertCircle },
        { label: t("profile.medicalConditions"), value: activeProfile.medicalConditions.join(", ") || "Not added", icon: Shield },
        { label: t("profile.currentMedicines"), value: activeProfile.medicines.join(", ") || "Not added", icon: Pill },
        {
          label: t("profile.emergencyContacts"),
          value: activeProfile.emergencyContacts.map((contact) => contact.phone).join(", ") || "Not added",
          icon: Phone,
        },
      ]
    : [];

  return (
    <AppShell>
      <PageTransition>
        <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-violet-50/70 via-white to-blue-50/60 px-4 py-5 lg:px-6">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <section className="rounded-[2rem] border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-medet-accent-light">
                  <Users className="h-7 w-7 text-medet-accent" />
                </div>
                <h1 className="text-3xl font-bold text-medet-text">{t("profile.title")}</h1>
                <p className="mt-2 text-medet-text-secondary">{t("profile.subtitle")}</p>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm">
                <div className="px-2 pb-2 pt-1">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-medet-text-secondary">
                    {t("profile.familyMembers")}
                  </h2>
                </div>
                <div className="space-y-2">
                  {isLoading &&
                    Array.from({ length: 2 }).map((_, index) => (
                      <div key={index} className="rounded-3xl border border-slate-200 bg-white p-3">
                        <Skeleton className="h-11 w-full rounded-2xl" />
                      </div>
                    ))}
                  {!isLoading && profiles.map((profile) => {
                    const isActive = profile.id === activeId;
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => setActiveId(profile.id)}
                        className={`flex min-h-16 w-full items-center gap-3 rounded-3xl border p-3 text-left transition ${
                          isActive
                            ? "border-medet-accent bg-medet-accent-light"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                            isActive ? "bg-white" : "bg-slate-100"
                          }`}
                        >
                          <User className={`h-5 w-5 ${isActive ? "text-medet-accent" : "text-medet-text-secondary"}`} />
                        </div>
                        <div>
                          <p className="font-bold text-medet-text">{profile.name}</p>
                          <p className="text-sm text-medet-text-secondary">{profile.relation}</p>
                        </div>
                      </button>
                    );
                  })}
                  {!isLoading && profiles.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-medet-text-secondary">
                      No health profiles found from the backend yet.
                    </div>
                  )}
                </div>
                <button className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-medet-accent px-4 text-sm font-bold text-white">
                  <Plus className="h-4 w-4" />
                  {t("profile.addMember")}
                </button>
              </section>
            </aside>

            <section className="space-y-5">
              {errorMessage && (
                <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                  {errorMessage}
                </div>
              )}

              {isLoading && (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <Skeleton className="h-20 w-full rounded-3xl" />
                </div>
              )}

              {!isLoading && !activeProfile && (
                <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-7 text-center shadow-sm">
                  <User className="mx-auto h-10 w-10 text-medet-text-secondary" />
                  <h2 className="mt-4 text-2xl font-bold text-medet-text">No profile data</h2>
                  <p className="mt-2 text-sm text-medet-text-secondary">
                    Connect the backend profile store to show family health details here.
                  </p>
                </div>
              )}

              {activeProfile && (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white">
                      <User className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-medet-text">{activeProfile.name}</h2>
                      <p className="mt-1 text-medet-text-secondary">
                        {activeProfile.relation} - {activeProfile.age} years
                      </p>
                    </div>
                  </div>
                  <button className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-5 text-sm font-bold text-medet-text">
                    {t("profile.editProfile")}
                  </button>
                </div>
              </div>
              )}

              {activeProfile && <div className="grid gap-3 sm:grid-cols-2">
                {profileDetails.map((detail) => {
                  const Icon = detail.icon;
                  return (
                    <article key={detail.label} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-medet-primary-light">
                          <Icon className="h-5 w-5 text-medet-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-medet-text-secondary">{detail.label}</p>
                          <p className="mt-1 text-lg font-bold text-medet-text">{detail.value}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>}

              {activeProfile && <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
                  <HeartHandshake className="h-7 w-7 text-medet-secondary" />
                  <h2 className="mt-4 text-xl font-bold text-medet-text">Care notes for family</h2>
                  <p className="mt-2 text-sm leading-relaxed text-medet-text-secondary">
                    Store allergies, current medicines, and emergency contacts in one readable place
                    so caregivers can act quickly during consultations.
                  </p>
                </section>

                <section className="rounded-[2rem] border border-red-100 bg-red-50 p-5 shadow-sm sm:p-6">
                  <Phone className="h-7 w-7 text-medet-emergency" />
                  <h2 className="mt-4 text-xl font-bold text-red-950">{t("profile.emergencyContacts")}</h2>
                  <p className="mt-2 text-sm text-red-900">
                    {activeProfile.emergencyContacts[0]?.phone || "No emergency contact added"}
                  </p>
                  <Link
                    href={`tel:${activeProfile.emergencyContacts[0]?.phone || "112"}`}
                    className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-medet-emergency text-sm font-bold text-white"
                  >
                    {t("emergency.callEmergency")}
                  </Link>
                </section>
              </div>}
            </section>
          </div>
        </main>
      </PageTransition>
    </AppShell>
  );
}
