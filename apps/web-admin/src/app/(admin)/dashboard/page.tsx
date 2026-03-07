import { Activity, Building2, ShieldCheck, Users } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Platform-level monitoring for tenants, usage, and system health.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active Tenants", value: "42", icon: Building2 },
          { label: "Platform Users", value: "1,248", icon: Users },
          { label: "API Health", value: "99.98%", icon: Activity },
          { label: "Security Alerts", value: "0", icon: ShieldCheck }
        ].map((card) => (
          <article
            key={card.label}
            className="rounded-xl border border-border/70 bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-semibold">{card.value}</p>
          </article>
        ))}
      </div>

      <section className="rounded-xl border border-border/70 bg-card p-6">
        <h2 className="text-base font-semibold">Recent Platform Events</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tenant creation, billing changes, and admin-level actions.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="rounded-md border border-border/70 bg-background/40 px-3 py-2">
            New tenant created: <span className="font-medium">FadeLab Barbershop</span>
          </li>
          <li className="rounded-md border border-border/70 bg-background/40 px-3 py-2">
            Billing plan upgraded: <span className="font-medium">CutCraft HQ</span>
          </li>
          <li className="rounded-md border border-border/70 bg-background/40 px-3 py-2">
            Super admin login: <span className="font-medium">admin@barberpro.my</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
