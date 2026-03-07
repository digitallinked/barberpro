import {
  CheckCircle2,
  MoveRight,
  RefreshCw,
  Timer,
  UserCheck,
  UserRound,
  Users
} from "lucide-react";

export default function QueuePage() {
  const queueRows = [
    {
      code: "Q1",
      name: "Ahmad Fauzi",
      phone: "+6012-345-6789",
      service: "Premium Cut + Shave",
      wait: "~45 min",
      status: "Waiting",
      barber: "Sam"
    },
    {
      code: "Q2",
      name: "Tan Wei Liang",
      phone: "+6019-876-5432",
      service: "Basic Cut",
      wait: "~30 min",
      status: "In Service",
      barber: "Sam"
    },
    {
      code: "Q3",
      name: "Kumar Rajan",
      phone: "+6016-234-8901",
      service: "Kids Cut",
      wait: "~20 min",
      status: "Waiting",
      barber: "Any"
    },
    {
      code: "Q4",
      name: "Jason Lee",
      phone: "+6012-567-8901",
      service: "Hair Coloring",
      wait: "~60 min",
      status: "In Service",
      barber: "Zack"
    }
  ];

  const barberStatus = [
    {
      name: "Sam",
      role: "Senior Barber",
      status: "Available",
      count: "Today: 8 customers"
    },
    { name: "Zack", role: "Barber", status: "Busy", count: "Serving: Tan Wei Liang" },
    { name: "Ali", role: "Barber", status: "Available", count: "Today: 6 customers" },
    { name: "Faiz", role: "Junior Barber", status: "Busy", count: "Serving: Jason Lee" },
    { name: "Rina", role: "Barber", status: "Break", count: "Back in: 15 min" }
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Walk-in Queue</h1>
          <p className="text-sm text-muted-foreground">
            Manage walk-in customers and barber assignments.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-2 text-sm hover:bg-muted"
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Queue Board
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Waiting", value: "8", hint: "~35 min avg wait", icon: Timer },
          { label: "In Service", value: "5", hint: "Actively serving", icon: UserCheck },
          { label: "Completed", value: "23", hint: "Today so far", icon: CheckCircle2 },
          { label: "Available", value: "3", hint: "Barbers ready", icon: UserRound }
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-xl border border-border/70 bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <item.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.hint}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="space-y-3 xl:col-span-8">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card p-3">
            {[
              "All (13)",
              "Waiting (8)",
              "Assigned (5)",
              "In Service (5)",
              "Completed (23)",
              "Cancelled (2)"
            ].map((tab, idx) => (
              <button
                key={tab}
                className={`rounded-md border px-3 py-1.5 text-xs ${
                  idx === 0
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border/70 bg-background text-muted-foreground hover:text-foreground"
                }`}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          {queueRows.map((item) => (
            <article
              key={item.code}
              className="rounded-xl border border-border/70 bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-lg font-semibold text-primary">
                    {item.code}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.phone}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded bg-muted px-2 py-1 text-muted-foreground">
                        {item.service}
                      </span>
                      <span className="rounded bg-muted px-2 py-1 text-muted-foreground">
                        {item.wait}
                      </span>
                      <span className="rounded bg-muted px-2 py-1 text-muted-foreground">
                        Barber: {item.barber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-xs font-medium ${
                      item.status === "In Service"
                        ? "text-blue-300"
                        : "text-amber-300"
                    }`}
                  >
                    {item.status}
                  </p>
                  <p className="text-2xl font-semibold">
                    {item.status === "In Service" ? "20:00" : "25:14"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    item.status === "In Service"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-primary text-primary-foreground"
                  }`}
                  type="button"
                >
                  {item.status === "In Service" ? "Mark Complete" : "Assign Barber"}
                </button>
                <button
                  className="rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  Reassign
                </button>
              </div>
            </article>
          ))}
        </section>

        <aside className="space-y-4 xl:col-span-4">
          <section className="rounded-xl border border-border/70 bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Barber Availability</h2>
              <button className="text-xs text-primary" type="button">
                Manage
              </button>
            </div>
            <div className="space-y-2.5">
              {barberStatus.map((barber) => (
                <article
                  key={barber.name}
                  className="rounded-lg border border-border/70 bg-background/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{barber.name}</p>
                      <p className="text-xs text-muted-foreground">{barber.role}</p>
                    </div>
                    <p
                      className={`text-xs ${
                        barber.status === "Available"
                          ? "text-emerald-300"
                          : barber.status === "Busy"
                            ? "text-rose-300"
                            : "text-amber-300"
                      }`}
                    >
                      {barber.status}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{barber.count}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-primary/40 bg-primary/10 p-4">
            <p className="text-xs uppercase tracking-wide text-primary">Now Serving</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-5xl font-bold text-primary">Q2</p>
              <Users className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-1 text-sm">Tan Wei Liang</p>
            <p className="text-xs text-muted-foreground">Barber: Sam</p>
            <button
              className="mt-4 inline-flex items-center gap-1 text-xs text-primary"
              type="button"
            >
              Open queue board <MoveRight className="h-3.5 w-3.5" />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
