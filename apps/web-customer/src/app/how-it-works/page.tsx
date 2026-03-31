import Link from "next/link";
import { Search, CalendarCheck, Bell, Star } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Discover Shops",
    description: "Browse barbershops near you with reviews, services, and real-time queue status.",
  },
  {
    icon: CalendarCheck,
    title: "Book Online",
    description: "Pick your service, choose your barber, and book an appointment in seconds.",
  },
  {
    icon: Bell,
    title: "Track Your Queue",
    description: "Get real-time updates on your position in the queue — no more guessing when it's your turn.",
  },
  {
    icon: Star,
    title: "Earn Rewards",
    description: "Collect loyalty points with every visit and redeem them for free services.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">BarberPro</Link>
          <nav className="flex items-center gap-4">
            <Link href="/shops" className="text-sm text-muted-foreground hover:text-foreground">
              Find Shops
            </Link>
            <Link href="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">How BarberPro Works</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Your barbershop experience, simplified in four easy steps.
            </p>
          </div>

          <div className="mt-16 grid gap-12 sm:grid-cols-2">
            {steps.map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <step.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Step {index + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/shops"
              className="inline-flex rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Find a Barbershop Near You
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
