import Link from "next/link";
import { Users, BarChart3, Clock, CreditCard } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Smart Queue Management",
    description: "Eliminate walk-in chaos. Digital queue boards, party check-in, and real-time seat assignment keep your shop running smoothly.",
  },
  {
    icon: CreditCard,
    title: "Integrated POS",
    description: "Ring up sales, track commission per barber, and manage daily cash reporting — all from one dashboard.",
  },
  {
    icon: Users,
    title: "Staff & Scheduling",
    description: "Manage staff schedules, attendance, commission rates, and payroll — across all branches if you scale.",
  },
  {
    icon: BarChart3,
    title: "Revenue Insights",
    description: "Daily, weekly, and monthly reports by branch, barber, and service. Know exactly what drives your business.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "RM 49",
    period: "/month",
    features: ["1 branch", "Up to 5 staff", "Queue management", "POS & transactions", "Basic reports"],
  },
  {
    name: "Professional",
    price: "RM 149",
    period: "/month",
    features: ["Multi-branch", "Unlimited staff", "Appointments & CRM", "Commission & payroll", "Advanced analytics", "Priority support"],
  },
];

export default function ForBusinessesPage() {
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
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">Built for Barbershop Owners</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to run your shop — queue, POS, staff, and customers — in one platform.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-border p-6">
                <feature.icon className="h-8 w-8 text-accent" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-20">
            <h2 className="text-center text-2xl font-bold">Simple Pricing</h2>
            <p className="mt-2 text-center text-muted-foreground">Start free for 14 days. No credit card required.</p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {plans.map((plan) => (
                <div key={plan.name} className="rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <span className="text-accent">&#10003;</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="https://shop.barberpro.my/register"
                    className="mt-6 block rounded-md bg-primary py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Start Free Trial
                  </a>
                </div>
              ))}
            </div>
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
