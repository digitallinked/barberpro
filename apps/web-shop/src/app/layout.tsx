import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { type ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { APP_DESCRIPTION, APP_NAME } from "@/constants";
import { env } from "@/lib/env";

import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans"
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL)
};

export const viewport: Viewport = {
  viewportFit: "cover"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} min-h-screen font-sans`}>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
