import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getSiteOrigin } from "@/lib/site-url";
import { ForBusinessesContent } from "./for-businesses-content";

const TITLE = "Untuk perniagaan barber | BarberPro";
const DESC =
  "Urus cawangan, staf, POS, dan giliran dari satu papan pemuka. Dibina untuk pasaran Malaysia.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${getSiteOrigin()}/for-businesses` },
  openGraph: {
    title: TITLE,
    description: DESC,
    type: "website",
    url: `${getSiteOrigin()}/for-businesses`,
    locale: "ms_MY",
    siteName: "BarberPro",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
  },
};

export default function ForBusinessesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <ForBusinessesContent />
      <Footer />
    </div>
  );
}
