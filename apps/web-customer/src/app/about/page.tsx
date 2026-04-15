import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AboutContent } from "./about-content";

export const metadata: Metadata = {
  title: "About Us | BarberPro.my",
  description:
    "BarberPro.my makes your barber visit easier across Malaysia. Find shops, book appointments, track your queue, and earn rewards.",
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
