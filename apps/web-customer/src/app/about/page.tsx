import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getSiteOrigin } from "@/lib/site-url";
import { AboutContent } from "./about-content";

const TITLE = "About Us | BarberPro.my";
const DESC =
  "BarberPro.my makes your barber visit easier across Malaysia. Find shops, book appointments, track your queue, and earn rewards.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${getSiteOrigin()}/about` },
  openGraph: {
    title: TITLE,
    description: DESC,
    type: "website",
    url: `${getSiteOrigin()}/about`,
    locale: "en_MY",
    siteName: "BarberPro",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <AboutContent />
      <Footer />
    </div>
  );
}
