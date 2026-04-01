import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HowItWorksContent } from "./how-it-works-content";

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <HowItWorksContent />
      <Footer />
    </div>
  );
}
