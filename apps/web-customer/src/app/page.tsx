import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HomeContent } from "./home-content";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <HomeContent />
      <Footer />
    </div>
  );
}
