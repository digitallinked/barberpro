import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { type ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { env } from "@/lib/env";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans"
});

export const metadata: Metadata = {
  title: "BarberPro — Find & Book Your Barber",
  description: "Discover barbershops near you. Book appointments, track your queue, and earn loyalty rewards.",
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
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
