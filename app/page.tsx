"use client";

import { motion } from "framer-motion";
import {
  Heart,
  Shield,
  Globe,
  Mic,
  MapPin,
  Pill,
  ArrowRight,
  Mail,
  Sparkles,
  Users,
  CheckCircle2,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/i18n/context";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export default function LandingPage() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Heart,
      titleKey: "landing.featureChat",
      descKey: "landing.featureChatDesc",
      color: "bg-medet-primary-light text-medet-primary",
      href: "/chat",
    },
    {
      icon: Mic,
      titleKey: "landing.featureVoice",
      descKey: "landing.featureVoiceDesc",
      color: "bg-medet-secondary-light text-medet-secondary",
      href: "/voice",
    },
    {
      icon: Shield,
      titleKey: "landing.featureEmergency",
      descKey: "landing.featureEmergencyDesc",
      color: "bg-medet-emergency-light text-medet-emergency",
      href: "/emergency",
    },
    {
      icon: Pill,
      titleKey: "landing.featureReminder",
      descKey: "landing.featureReminderDesc",
      color: "bg-medet-warm-light text-medet-warm",
      href: "/reminders",
    },
    {
      icon: MapPin,
      titleKey: "landing.featureNearby",
      descKey: "landing.featureNearbyDesc",
      color: "bg-medet-secondary-light text-medet-secondary",
      href: "/nearby",
    },
    {
      icon: Globe,
      titleKey: "landing.featureMultilingual",
      descKey: "landing.featureMultilingualDesc",
      color: "bg-medet-accent-light text-medet-accent",
      href: "/language",
    },
  ];

  const trustPoints = [
    "Medical knowledge-backed guidance",
    "Privacy-first approach",
    "Works on low bandwidth",
    "Available in 7+ languages",
    "24/7 availability",
    "Designed for rural communities",
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5" id="landing-logo">
            <div className="w-9 h-9 rounded-xl medet-gradient-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-medet-text">
              MED<span className="text-medet-primary">ET</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-medet-text-secondary hover:text-medet-text transition-colors"
              id="landing-login-link"
            >
              Log in
            </Link>
            <Link
              href="/chat"
              className="px-4 py-2.5 medet-gradient-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity medet-tap-target"
              id="landing-start-cta-nav"
            >
              {t("landing.startConsultation")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 relative" id="hero-section">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-blue-50/80 via-white to-white" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-medet-primary-light text-medet-primary text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Healthcare</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-medet-text leading-tight mb-6"
          >
            {t("landing.heroTitle")}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-medet-text-secondary leading-relaxed max-w-2xl mx-auto mb-10"
          >
            {t("landing.heroSubtitle")}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
          >
            <Link
              href="/chat"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 medet-gradient-primary text-white text-base font-semibold rounded-2xl medet-shadow-glow hover:opacity-90 transition-all medet-tap-target"
              id="hero-start-consultation"
            >
              {t("landing.startConsultation")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/voice"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-medet-text text-base font-semibold rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all medet-shadow-sm medet-tap-target"
              id="hero-talk-to-ai"
            >
              <Mic className="w-5 h-5 text-medet-primary" />
              {t("landing.talkToAI")}
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-medet-secondary-light text-medet-secondary text-base font-semibold rounded-2xl hover:bg-emerald-100 transition-all medet-tap-target"
              id="hero-google-cta"
            >
              <Mail className="w-5 h-5" />
              {t("landing.continueWithGoogle")}
            </Link>
          </motion.div>

          {/* Emergency CTA */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link
              href="/emergency"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-medet-emergency-light text-medet-emergency text-sm font-semibold hover:bg-red-100 transition-colors medet-tap-target"
              id="hero-emergency-help"
            >
              <Phone className="w-4 h-4" />
              {t("landing.emergencyHelp")}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Feature Cards ─── */}
      <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-white to-gray-50/80" id="features-section">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-bold text-medet-text mb-4"
            >
              Everything You Need
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-medet-text-secondary text-lg max-w-xl mx-auto"
            >
              Comprehensive healthcare support designed for simplicity and accessibility
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.titleKey} variants={fadeUp}>
                  <Link
                    href={feature.href}
                    className="group block p-6 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 medet-shadow-sm hover:medet-shadow transition-all duration-300"
                    id={`feature-${feature.titleKey.split(".")[1]}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-medet-text mb-1.5">
                      {t(feature.titleKey)}
                    </h3>
                    <p className="text-sm text-medet-text-secondary leading-relaxed">
                      {t(feature.descKey)}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Trust Section ─── */}
      <section className="py-16 sm:py-24 px-4" id="trust-section">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left: Content */}
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-medet-secondary-light text-medet-secondary text-sm font-medium mb-4">
                <Users className="w-4 h-4" />
                {t("landing.trustTitle")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-medet-text mb-4 leading-tight">
                Healthcare Guidance You Can Trust
              </h2>
              <p className="text-medet-text-secondary text-lg leading-relaxed mb-8">
                {t("landing.trustDesc")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trustPoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-5 h-5 text-medet-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-medet-text font-medium">
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Visual card */}
            <motion.div variants={fadeUp} className="relative">
              <div className="bg-gradient-to-br from-medet-primary-light via-blue-50 to-indigo-50 rounded-3xl p-8 sm:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-medet-primary/5 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-medet-secondary/5 rounded-full blur-2xl" />

                {/* Mock chat preview */}
                <div className="space-y-4 relative z-10">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full medet-gradient-primary flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 medet-shadow-sm max-w-[280px]">
                      <p className="text-sm text-medet-text leading-relaxed">
                        Hello! I&apos;m MEDET, your healthcare companion. How can I help you today?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-medet-primary text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[240px]">
                      <p className="text-sm leading-relaxed">
                        I&apos;ve been having headaches for 2 days
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full medet-gradient-primary flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 medet-shadow-sm max-w-[280px]">
                      <p className="text-sm text-medet-text leading-relaxed">
                        I&apos;m sorry to hear that. Let me ask a few questions to understand better. Are you experiencing any fever or nausea?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Emergency Banner ─── */}
      <section className="py-12 px-4" id="emergency-banner">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border border-red-100 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="w-14 h-14 rounded-2xl bg-medet-emergency-light flex items-center justify-center flex-shrink-0">
                  <Shield className="w-7 h-7 text-medet-emergency" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-medet-text mb-1">
                    {t("landing.featureEmergency")}
                  </h3>
                  <p className="text-sm text-medet-text-secondary">
                    {t("landing.featureEmergencyDesc")}. Instant access to emergency services, nearest hospitals, and ambulance contact.
                  </p>
                </div>
                <Link
                  href="/emergency"
                  className="flex-shrink-0 px-6 py-3 bg-medet-emergency text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors medet-tap-target"
                  id="emergency-banner-cta"
                >
                  {t("emergency.dial")}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-10 px-4 border-t border-gray-100" id="landing-footer">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-medet-primary" />
            <span className="text-sm font-semibold text-medet-text">
              MED<span className="text-medet-primary">ET</span>
            </span>
            <span className="text-sm text-medet-text-secondary ml-1">
              - {t("common.tagline")}
            </span>
          </div>
          <p className="text-xs text-medet-text-secondary">
            © {new Date().getFullYear()} MEDET. Built for rural healthcare.
          </p>
        </div>
      </footer>
    </div>
  );
}
