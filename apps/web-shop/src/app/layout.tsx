import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { type ReactNode } from "react";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { GoogleTagManager } from "@/components/google-tag-manager";
import { APP_DESCRIPTION, APP_NAME } from "@/constants";
import { PushPermissionPrompt } from "@/components/push-permission-prompt";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { getMetadataBase } from "@/lib/env";
import { marketingPageMetadata } from "@/lib/seo";
import type { Language } from "@/lib/i18n/translations";
import { STORAGE_KEY, LanguageProvider } from "@/lib/i18n/language-context";

import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans"
});

export const metadata: Metadata = {
  ...marketingPageMetadata("", APP_NAME, APP_DESCRIPTION),
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
  const initialLanguage: Language = stored === "ms" || stored === "en" ? stored : "en";

  return (
    <html lang={initialLanguage === "ms" ? "ms" : "en"}>
      <body className={`${dmSans.variable} min-h-screen font-sans`}>
        <GoogleTagManager />
        {/* LanguageProvider here serves public routes; dashboard layout overrides with tenant preference */}
        <LanguageProvider initialLanguage={initialLanguage}>
          <Providers>
            {children}
          </Providers>
        </LanguageProvider>
        <PwaInstallBanner />
        {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && (
          <PushPermissionPrompt vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY} />
        )}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
