import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { type ReactNode } from "react";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { APP_DESCRIPTION, APP_NAME } from "@/constants";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { getMetadataBase } from "@/lib/env";
import type { Language } from "@/lib/i18n/translations";
import { STORAGE_KEY } from "@/lib/i18n/language-context";

import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans"
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  metadataBase: getMetadataBase(),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
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

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const stored = cookieStore.get(STORAGE_KEY)?.value as Language | undefined;
  const initialLanguage: Language = stored === "ms" || stored === "en" ? stored : "ms";

  return (
    <html lang={initialLanguage === "ms" ? "ms" : "en"}>
      <body className={`${dmSans.variable} min-h-screen font-sans`}>
        <Providers initialLanguage={initialLanguage}>{children}</Providers>
        <PwaInstallBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
