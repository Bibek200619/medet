"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/i18n/context";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

export function Header() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { session } = useAuth();

  // Don't show on landing page
  if (pathname === "/") return null;

  const desktopNavItems = [
    { href: "/chat", labelKey: "nav.chat" },
    { href: "/voice", labelKey: "nav.voice" },
    { href: "/emergency", labelKey: "nav.emergency" },
    { href: "/nearby", labelKey: "nav.nearby" },
    { href: "/reminders", labelKey: "nav.reminders" },
    { href: "/profile", labelKey: "nav.profile" },
    { href: "/language", labelKey: "nav.language" },
  ];

  return (
    <header
      className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-200/60"
      id="app-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" id="header-logo">
            <div className="w-9 h-9 rounded-xl medet-gradient-primary flex items-center justify-center medet-shadow-sm group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-medet-text tracking-tight">
              MED<span className="text-medet-primary">ET</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" role="navigation" id="desktop-nav">
            {desktopNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const isEmergency = item.href === "/emergency";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 medet-tap-target ${
                    isEmergency
                      ? isActive
                        ? "bg-medet-emergency-light text-medet-emergency"
                        : "text-medet-emergency hover:bg-medet-emergency-light/60"
                      : isActive
                      ? "bg-medet-primary-light text-medet-primary"
                      : "text-medet-text-secondary hover:text-medet-text hover:bg-gray-100"
                  }`}
                  id={`desktop-nav-${item.href.slice(1)}`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          {/* Right side: Language Switcher */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-medet-text md:inline-flex"
            >
              {session ? session.user.name : "Sign in"}
            </Link>
            <LanguageSwitcher variant="compact" />
          </div>
        </div>
      </div>
    </header>
  );
}
