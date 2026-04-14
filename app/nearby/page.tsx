"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Clock,
  Cross,
  Hospital,
  Map,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { AppShell, PageTransition } from "@/components/layout";
import { useLanguage } from "@/i18n/context";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getBrowserLocation,
  getNearbyClinics,
  type NearbyClinic,
} from "@/lib/api";

const filters: Array<{
  id: NearbyClinic["type"];
  labelKey: string;
  icon: typeof Cross;
}> = [
  { id: "clinic", labelKey: "nearby.clinics", icon: Cross },
  { id: "hospital", labelKey: "nearby.hospitals", icon: Hospital },
  { id: "health_center", labelKey: "nearby.healthCenters", icon: Building2 },
  { id: "pharmacy", labelKey: "nearby.pharmacies", icon: ShieldCheck },
];

export default function NearbyPage() {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<NearbyClinic["type"]>("clinic");
  const [facilities, setFacilities] = useState<NearbyClinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFacilities() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const location = await getBrowserLocation().catch(() => null);
        const items = await getNearbyClinics(location);
        if (isMounted) setFacilities(items);
      } catch {
        if (!isMounted) return;
        setFacilities([]);
        setErrorMessage("Could not load nearby healthcare facilities from the backend.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadFacilities();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleFacilities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return facilities.filter((facility) => {
      const matchesFilter = facility.type === activeFilter;
      const matchesSearch =
        !normalizedSearch ||
        facility.name.toLowerCase().includes(normalizedSearch) ||
        facility.address.toLowerCase().includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, facilities, search]);

  return (
    <AppShell>
      <PageTransition>
        <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-emerald-50/80 via-white to-blue-50/60 px-4 py-5 lg:px-6">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
            <section className="space-y-5">
              <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-medet-secondary-light">
                  <MapPin className="h-7 w-7 text-medet-secondary" />
                </div>
                <h1 className="text-3xl font-bold text-medet-text">{t("nearby.title")}</h1>
                <p className="mt-2 text-base leading-relaxed text-medet-text-secondary">{t("nearby.subtitle")}</p>

                <label className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                  <Search className="h-5 w-5 text-medet-text-secondary" />
                  <span className="sr-only">{t("common.search")}</span>
                  <input
                    placeholder="Search by clinic, village, or service"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                  />
                </label>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  {filters.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = activeFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setActiveFilter(filter.id)}
                        className={`flex min-h-20 flex-col items-start justify-between rounded-3xl border p-3 text-left transition ${
                          isActive
                            ? "border-medet-secondary bg-medet-secondary-light text-medet-secondary"
                            : "border-slate-200 bg-white text-medet-text"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-bold">{t(filter.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Emergency number</p>
                    <h2 className="mt-1 text-2xl font-bold">112</h2>
                  </div>
                  <Phone className="h-7 w-7 text-red-300" />
                </div>
                <Link
                  href="tel:112"
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-950"
                >
                  {t("emergency.callEmergency")}
                </Link>
              </div>
            </section>

            <section className="space-y-5">
              <div className="relative min-h-72 overflow-hidden rounded-[2rem] border border-emerald-100 bg-emerald-50 shadow-sm">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,150,105,0.10)_1px,transparent_1px),linear-gradient(rgba(37,99,235,0.10)_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute left-[18%] top-[26%] h-4 w-4 rounded-full bg-medet-primary shadow-[0_0_0_8px_rgba(37,99,235,0.15)]" />
                <div className="absolute right-[24%] top-[38%] h-4 w-4 rounded-full bg-medet-secondary shadow-[0_0_0_8px_rgba(5,150,105,0.16)]" />
                <div className="absolute bottom-[24%] left-[42%] h-4 w-4 rounded-full bg-medet-emergency shadow-[0_0_0_8px_rgba(220,38,38,0.14)]" />
                <div className="relative z-10 flex h-full min-h-72 flex-col justify-between p-5">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-medet-text shadow-sm">
                    <Map className="h-4 w-4 text-medet-secondary" />
                    Nearby care map
                  </div>
                  <div className="rounded-3xl bg-white/95 p-4 shadow-sm">
                    <h2 className="text-xl font-bold text-medet-text">
                      {isLoading ? "Loading facilities..." : `${visibleFacilities.length} result${visibleFacilities.length === 1 ? "" : "s"}`}
                    </h2>
                    <p className="mt-1 text-sm text-medet-text-secondary">
                      Results come from the backend when location or facility data is available.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <article key={i} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 space-y-3 w-full">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-2/3 max-w-[200px]" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <Skeleton className="h-4 w-full max-w-[300px]" />
                          <div className="flex gap-3">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </div>
                        <div className="flex w-full gap-2 sm:w-auto sm:flex-col">
                          <Skeleton className="h-11 flex-1 sm:w-28 rounded-2xl" />
                          <Skeleton className="h-11 flex-1 sm:w-28 rounded-2xl" />
                        </div>
                      </div>
                    </article>
                  ))
                ) : visibleFacilities.length > 0 ? (
                  visibleFacilities.map((facility) => (
                    <article key={facility.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-bold text-medet-text">{facility.name}</h2>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                facility.isOpen
                                  ? "bg-medet-secondary-light text-medet-secondary"
                                  : "bg-slate-100 text-medet-text-secondary"
                              }`}
                            >
                              {facility.isOpen ? t("nearby.openNow") : t("nearby.closed")}
                            </span>
                          </div>
                          <p className="mt-2 max-w-xl text-sm leading-relaxed text-medet-text-secondary">
                            {facility.address}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-medet-text">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-medet-secondary" />
                              {facility.distance} {t("nearby.distance")}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-medet-primary" />
                              {facility.travelTime || "Travel time unavailable"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:flex-col">
                          <Link
                            href={`tel:${facility.phone}`}
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-medet-primary px-4 text-sm font-bold text-white sm:flex-none"
                          >
                            <Phone className="h-4 w-4" />
                            {t("nearby.call")}
                          </Link>
                          <button className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-medet-text sm:flex-none">
                            <Navigation className="h-4 w-4 text-medet-secondary" />
                            {t("nearby.directions")}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <article className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
                    <Hospital className="mx-auto h-9 w-9 text-medet-text-secondary" />
                    <h2 className="mt-3 text-xl font-bold text-medet-text">No facilities found</h2>
                    <p className="mt-2 text-sm text-medet-text-secondary">
                      Backend facility results will appear here when available.
                    </p>
                  </article>
                )}
                {errorMessage && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                    {errorMessage}
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </PageTransition>
    </AppShell>
  );
}
