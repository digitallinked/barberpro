import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ContactContent } from "./contact-content";

export const metadata: Metadata = {
  title: "Contact Us | BarberPro.my",
  description:
    "Get in touch with the BarberPro.my team. We're here to help you with bookings, accounts, and anything else."
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
