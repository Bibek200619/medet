"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageCircle,
  AlertTriangle,
  AudioLines,
  MapPin,
  Pill,
  User,
} from "lucide-react";
import { useLanguage } from "@/i18n/context";

const navItems = [
  { href: "/chat", icon: MessageCircle, labelKey: "nav.chat" },
  { href: "/voice", icon: AudioLines, labelKey: "nav.voice" },
  { href: "/nearby", icon: MapPin, labelKey: "nav.nearby" },
  { href: "/emergency", icon: AlertTriangle, labelKey: "nav.emergency", isEmergency: true },
  { href: "/reminders", icon: Pill, labelKey: "nav.reminders" },
  { href: "/profile", icon: User, labelKey: "nav.profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Don't show on landing/auth pages
  if (pathname === "/" || pathname === "/login") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      role="navigation"
      aria-label="Main navigation"
      id="bottom-nav"
    >
      {/* Glass backdrop */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/60 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 px-1 medet-tap-target transition-colors duration-200 ${
                  item.isEmergency
                    ? "text-medet-emergency"
                    : isActive
                    ? "text-medet-primary"
                    : "text-medet-text-secondary"
                }`}
                id={`nav-${item.href.slice(1)}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className={`absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-7 rounded-full ${
                      item.isEmergency ? "bg-medet-emergency" : "bg-medet-primary"
                    }`}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}

                <div
                  className={`relative p-1 rounded-xl transition-colors duration-200 ${
                    item.isEmergency && !isActive
                      ? "bg-medet-emergency-light"
                      : ""
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "stroke-[2.5]" : "stroke-[1.8]"
                    }`}
                  />
                </div>

                <span
                  className={`max-w-full truncate text-[9px] leading-tight ${
                    isActive ? "font-semibold" : "font-medium"
                  }`}
                >
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
