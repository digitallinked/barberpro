import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getSiteOrigin } from "@/lib/site-url";
import { ContactContent } from "./contact-content";

const TITLE = "Contact Us | BarberPro.my";
const DESC =
  "Get in touch with the BarberPro.my team. We're here to help you with bookings, accounts, and anything else.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${getSiteOrigin()}/contact` },
  openGraph: {
    title: TITLE,
    description: DESC,
    type: "website",
    url: `${getSiteOrigin()}/contact`,
    locale: "en_MY",
    siteName: "BarberPro",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <ContactContent />
      <Footer />
    </div>
  );
}
