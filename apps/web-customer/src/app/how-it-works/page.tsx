import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getSiteOrigin } from "@/lib/site-url";
import { HowItWorksContent } from "./how-it-works-content";

const TITLE = "Cara ia berfungsi | BarberPro";
const DESC =
  "Cari kedai, tempah slot, sertai giliran, dan urus temujanji anda — semuanya melalui BarberPro.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${getSiteOrigin()}/how-it-works` },
  openGraph: {
    title: TITLE,
    description: DESC,
    type: "website",
    url: `${getSiteOrigin()}/how-it-works`,
    locale: "ms_MY",
    siteName: "BarberPro",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
  },
};

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <HowItWorksContent />
      <Footer />
    </div>
  );
}
