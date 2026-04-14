"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Ambulance,
  HeartPulse,
  Hospital,
  MapPin,
  Phone,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { AppShell, PageTransition } from "@/components/layout";
import { useAuth } from "@/components/auth/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/i18n/context";
import {
  getBrowserLocation,
  getHealthProfiles,
  getNearbyClinics,
  type EmergencyContact,
  type NearbyClinic,
} from "@/lib/api";

const warningSigns = [
  "Chest pain or pressure",
  "Trouble breathing",
  "Unconsciousness or confusion",
  "Heavy bleeding",
  "Signs of stroke or seizure",
];

export default function EmergencyPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [facilities, setFacilities] = useState<NearbyClinic[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFacilities() {
      setIsLoadingFacilities(true);
      try {
        const location = await getBrowserLocation().catch(() => null);
        const items = await getNearbyClinics(location);
        if (!isMounted) return;
        setFacilities(
          items.filter((item) => item.type === "hospital" || item.type === "health_center")
        );
      } catch {
        if (!isMounted) return;
        setErrorMessage("Could not load emergency facility data from the backend.");
        setFacilities([]);
      } finally {
        if (isMounted) setIsLoadingFacilities(false);
      }
    }

    void loadFacilities();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadContacts() {
      setIsLoadingContacts(true);
      try {
        const profiles = await getHealthProfiles(session);
        if (!isMounted) return;
        setContacts(profiles.flatMap((profile) => profile.emergencyContacts));
      } catch {
        if (!isMounted) return;
        setContacts([]);
      } finally {
        if (isMounted) setIsLoadingContacts(false);
      }
    }

    void loadContacts();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const uniqueContacts = useMemo(
    () => Array.from(new Map(contacts.map((contact) => [contact.phone, contact])).values()),
    [contacts]
  );

  return (
    <AppShell>
      <PageTransition>
        <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-red-50 via-white to-amber-50/60 px-4 py-5 lg:px-6">
          <div className="mx-auto max-w-6xl space-y-5">
            <section className="overflow-hidden rounded-[2rem] border border-red-200 bg-white shadow-sm">
              <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
                <div className="p-5 sm:p-8">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-medet-emergency"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    {t("emergency.warningTitle")}
                  </motion.div>
                  <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-tight text-medet-text sm:text-5xl">
                    {t("emergency.title")}
                  </h1>
                  <p className="mt-4 max-w-2xl text-lg leading-relaxed text-medet-text-secondary">
                    {t("emergency.subtitle")} MEDET can help you act quickly while staying calm.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Link
                      href="tel:112"
                      className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-medet-emergency px-5 text-base font-bold text-white shadow-sm"
                    >
                      <Phone className="h-5 w-5" />
                      {t("emergency.dial")}
                    </Link>
                    <Link
                      href="tel:108"
                      className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-slate-900 px-5 text-base font-bold text-white shadow-sm"
                    >
                      <Ambulance className="h-5 w-5" />
                      {t("emergency.callAmbulance")}
                    </Link>
                  </div>
                </div>

                <div className="border-t border-red-100 bg-red-50/80 p-5 sm:p-8 lg:border-l lg:border-t-0">
                  <div className="flex h-full flex-col justify-between gap-6 rounded-3xl bg-white p-5 shadow-sm">
                    <div>
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-medet-emergency-light">
                        <AlertTriangle className="h-7 w-7 text-medet-emergency" />
                      </div>
                      <h2 className="text-xl font-bold text-medet-text">Act now if you see these signs</h2>
                    </div>
                    <div className="space-y-3">
                      {warningSigns.map((sign) => (
                        <div key={sign} className="flex items-start gap-3 rounded-2xl bg-red-50 px-3 py-3">
                          <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-medet-emergency" />
                          <span className="text-sm font-semibold text-red-950">{sign}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-medet-text">{t("emergency.nearestHospital")}</h2>
                    <p className="text-sm text-medet-text-secondary">Loaded from backend facility data when available</p>
                  </div>
                  <Hospital className="h-6 w-6 text-medet-primary" />
                </div>

                <div className="space-y-3">
                  {isLoadingFacilities &&
                    Array.from({ length: 2 }).map((_, index) => (
                      <article key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <Skeleton className="h-20 w-full rounded-2xl" />
                      </article>
                    ))}
                  {!isLoadingFacilities && facilities.map((place) => (
                    <article key={place.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-medet-text">{place.name}</h3>
                          <p className="mt-1 text-sm text-medet-text-secondary">{place.address}</p>
                        </div>
                        <span className="rounded-full bg-medet-secondary-light px-3 py-1 text-xs font-bold text-medet-secondary">
                          {place.distance}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`tel:${place.phone}`}
                          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-medet-primary px-4 text-sm font-bold text-white"
                        >
                          <Phone className="h-4 w-4" />
                          {t("nearby.call")}
                        </Link>
                        <Link
                          href="/nearby"
                          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold text-medet-text"
                        >
                          <MapPin className="h-4 w-4 text-medet-secondary" />
                          {t("emergency.getDirections")}
                        </Link>
                      </div>
                    </article>
                  ))}
                  {!isLoadingFacilities && facilities.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-medet-text-secondary">
                      No nearby emergency facility data is available from the backend yet. Use the emergency call buttons above if help is needed now.
                    </div>
                  )}
                  {errorMessage && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                      {errorMessage}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-4 text-2xl font-bold text-medet-text">{t("emergency.emergencyContacts")}</h2>
                <div className="space-y-3">
                  {isLoadingContacts &&
                    Array.from({ length: 2 }).map((_, index) => (
                      <article key={index} className="rounded-3xl border border-slate-200 p-4">
                        <Skeleton className="h-20 w-full rounded-2xl" />
                      </article>
                    ))}
                  {!isLoadingContacts && uniqueContacts.map((contact) => (
                    <article key={contact.phone} className="rounded-3xl border border-slate-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-medet-primary-light">
                          <UserRound className="h-5 w-5 text-medet-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-medet-text">{contact.name}</h3>
                          <p className="text-sm text-medet-text-secondary">{contact.relation}</p>
                        </div>
                      </div>
                      <Link
                        href={`tel:${contact.phone}`}
                        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 text-sm font-bold text-medet-text"
                      >
                        <Phone className="h-4 w-4" />
                        {contact.phone}
                      </Link>
                    </article>
                  ))}
                  {!isLoadingContacts && uniqueContacts.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-medet-text-secondary">
                      No saved emergency contacts found from backend profiles.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </main>
      </PageTransition>
    </AppShell>
  );
}
