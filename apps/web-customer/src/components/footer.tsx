import Link from "next/link";
import { Scissors } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 px-6 py-8 mt-auto">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <Scissors className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">BarberPro</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/shops" className="hover:text-foreground transition-colors">Find Shops</Link>
          <Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
          <Link href="/for-businesses" className="hover:text-foreground transition-colors">For Businesses</Link>
          <Link href="/subscription" className="hover:text-foreground transition-colors">BarberPro Plus</Link>
        </div>
      </div>
    </footer>
  );
}
