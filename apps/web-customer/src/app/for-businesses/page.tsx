import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ForBusinessesContent } from "./for-businesses-content";

export default function ForBusinessesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <ForBusinessesContent />
      <Footer />
    </div>
  );
}
