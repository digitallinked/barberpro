import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { type ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { env } from "@/lib/env";
import { ClientProviders } from "@/components/client-providers";
import { ActiveQueueBanner } from "@/components/active-queue-banner";
import { PwaInstallBanner } from "@/components/pwa-install-banner";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans"
});

export const metadata: Metadata = {
  title: "BarberPro | Cari & Tempah Barber Anda",
  description: "Terokai kedai gunting berdekatan. Buat temujanji, pantau giliran, dan kumpul mata ganjaran.",
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BarberPro",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#D4AF37",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ms">
      <body className={`${dmSans.variable} min-h-screen font-sans`}>
        <ClientProviders>
          {children}
          <ActiveQueueBanner />
          <PwaInstallBanner />
        </ClientProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
