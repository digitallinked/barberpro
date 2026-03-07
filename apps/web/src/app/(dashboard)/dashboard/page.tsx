import { BarChart3, CircleDollarSign, TimerReset, Users } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Business overview for owners, managers, and front desk operations.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Sales Today", value: "RM 1,245", icon: CircleDollarSign },
          { label: "Customers Served", value: "18", icon: Users },
          { label: "Active Queue", value: "5", icon: TimerReset },
          { label: "Month Trend", value: "+12%", icon: BarChart3 }
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
    </div>
  );
}
