import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LanguageProvider } from "@/i18n/context";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEDET — AI-Powered Rural Healthcare Assistant",
  description:
    "Compassionate AI healthcare companion for rural and underserved communities. Get trusted health guidance, emergency support, medicine reminders, and nearby clinic information — in your language.",
  keywords: [
    "healthcare",
    "AI assistant",
    "rural health",
    "telemedicine",
    "medical guidance",
    "emergency help",
  ],
  authors: [{ name: "MEDET Team" }],
  openGraph: {
    title: "MEDET — AI-Powered Rural Healthcare Assistant",
    description:
      "Compassionate AI healthcare companion for rural and underserved communities.",
    type: "website",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563EB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-medet-bg text-medet-text">
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
