import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { type ReactNode } from "react";

import { BRAND_NAME } from "@barberpro/ui";
import { env } from "@/lib/env";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans"
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} | Super Admin`,
  description: "Internal super-admin workspace for managing tenants and platform operations.",
  metadataBase: new URL(env.NEXT_PUBLIC_ADMIN_URL)
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} min-h-screen font-sans`}>
        {children}
      </body>
    </html>
  );
}
