import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getSiteOrigin } from "@/lib/site-url";
import { HomeContent } from "./home-content";

const TITLE = "BarberPro | Cari & Tempah Barber Anda";
const DESC =
  "Terokai kedai gunting berdekatan. Buat temujanji, pantau giliran, dan kumpul mata ganjaran.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: getSiteOrigin() },
  openGraph: {
    title: TITLE,
    description: DESC,
    type: "website",
    url: getSiteOrigin(),
    locale: "ms_MY",
    siteName: "BarberPro",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
  },
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <HomeContent />
      <Footer />
    </div>
  );
}
