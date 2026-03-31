import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold">BarberPro</h1>
          <nav className="flex items-center gap-4">
            <Link href="/shops" className="text-sm text-muted-foreground hover:text-foreground">
              Find Shops
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Find & Book Your <span className="text-accent">Perfect Barber</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Discover barbershops near you, book appointments online, track your queue in real-time,
            and earn loyalty rewards with every visit.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/shops"
              className="rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse Shops
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-md border border-border px-6 py-3 font-medium hover:bg-muted"
            >
              How It Works
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} BarberPro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
