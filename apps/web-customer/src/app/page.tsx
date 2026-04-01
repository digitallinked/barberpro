import Link from "next/link";
import { Scissors, CalendarCheck, Bell, Star, Search, ArrowRight, Clock, MapPin } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const features = [
  {
    icon: Search,
    title: "Discover Shops",
    description: "Browse verified barbershops near you with live queue status, services, and pricing — all in one place.",
  },
  {
    icon: CalendarCheck,
    title: "Book in Seconds",
    description: "Pick your service, choose your barber, and lock in a slot. No calls, no waiting on hold.",
  },
  {
    icon: Bell,
    title: "Real-Time Queue",
    description: "Track your position live. We'll let you know when it's almost your turn — so you never wait unnecessarily.",
  },
  {
    icon: Star,
    title: "Earn Rewards",
    description: "Collect loyalty points with every visit. Redeem them for free services at your favourite shops.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(43 65% 52% / 0.12), transparent)",
          }}
        />

        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left copy */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                <Scissors className="h-3.5 w-3.5" />
                Malaysia&apos;s #1 Barber Platform
              </div>

              <h1 className="text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
                Find &amp; Book Your{" "}
                <span className="text-primary">Perfect Barber</span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Discover barbershops near you, book appointments online, track your queue in
                real-time, and earn loyalty rewards with every visit.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/shops"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Browse Shops <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  How It Works
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  Free to use
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  No app download needed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  Instant booking
                </span>
              </div>
            </div>

            {/* Right dashboard mockup */}
            <div className="relative hidden lg:block">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <p className="text-sm font-semibold text-foreground">Your Queue Ticket</p>
                  <span className="flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    Live
                  </span>
                </div>

                <div className="py-6 text-center">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Your Number</p>
                  <p className="mt-2 text-8xl font-bold text-primary">A21</p>
                  <p className="mt-3 text-sm font-medium text-foreground">Now Serving A19</p>
                  <p className="mt-1 text-sm text-muted-foreground">~8 min wait</p>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Shop</p>
                    <p className="mt-0.5 text-sm font-medium">Kings Barbershop</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Service</p>
                    <p className="mt-0.5 text-sm font-medium">Haircut + Wash</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> Time
                    </div>
                    <p className="mt-0.5 text-sm font-medium">2:30 PM</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> Branch
                    </div>
                    <p className="mt-0.5 text-sm font-medium">Bangsar</p>
                  </div>
                </div>
              </div>

              {/* Floating loyalty badge */}
              <div className="absolute -right-4 -top-4 rounded-xl border border-primary/30 bg-card p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Loyalty Points</p>
                    <p className="text-sm font-bold text-primary">1,240 pts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-card/30 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Everything You Need</h2>
            <p className="mt-3 text-muted-foreground">
              Your complete barbershop experience — from discovery to rewards.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready for a Better Barber Experience?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of Malaysians who book smarter with BarberPro.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3 font-semibold transition-colors hover:border-primary/40"
            >
              Browse Shops
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            For barbershop owners?{" "}
            <Link href="/for-businesses" className="text-primary hover:underline">
              Learn about BarberPro for Business →
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
