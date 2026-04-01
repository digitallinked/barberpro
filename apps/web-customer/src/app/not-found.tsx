import Link from "next/link";
import { Scissors, Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/50 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Scissors className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold">
            BarberPro<span className="text-primary">.my</span>
          </span>
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card">
          <Scissors className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-xl font-semibold">Page Not Found</p>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Home className="h-4 w-4" />
            Back Home
          </Link>
          <Link
            href="/shops"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Search className="h-4 w-4" />
            Find Shops
          </Link>
        </div>
      </div>
    </div>
  );
}
