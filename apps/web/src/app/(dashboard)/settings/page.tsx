import {
  Bell,
  Building2,
  CreditCard,
  Globe,
  ReceiptText,
  ShieldCheck,
  Upload
} from "lucide-react";

export default function SettingsPage() {
  const sections = [
    {
      heading: "Business",
      items: ["Business Profile", "Branches", "Operating Hours"]
    },
    {
      heading: "Services",
      items: ["Service Categories", "Pricing"]
    },
    {
      heading: "Staff & Payroll",
      items: ["Roles & Permissions", "Payroll Settings"]
    },
    {
      heading: "Financial",
      items: ["Payment Methods", "Tax & Invoice", "Receipt Branding"]
    },
    {
      heading: "System",
      items: ["Notifications", "Language"]
    }
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your business configuration and operational defaults.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-12">
        <aside className="rounded-xl border border-border/70 bg-card p-3 xl:col-span-3">
          {sections.map((group) => (
            <div key={group.heading} className="mb-4 last:mb-0">
              <p className="mb-1 px-2 text-xs uppercase tracking-wide text-muted-foreground">
                {group.heading}
              </p>
              <div className="space-y-1">
                {group.items.map((item, idx) => (
                  <button
                    key={item}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                      group.heading === "Business" && idx === 0
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <section className="rounded-xl border border-border/70 bg-card p-6 xl:col-span-9">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Business Profile</h2>
              <p className="text-sm text-muted-foreground">
                Manage your business information.
              </p>
            </div>
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              type="button"
            >
              Save Changes
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Business Name</span>
              <input
                defaultValue="BarberPro KL"
                className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">
                Registration Number (SSM)
              </span>
              <input
                defaultValue="202301234567"
                className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-xs text-muted-foreground">Business Address</span>
              <textarea
                defaultValue="Lot 123, Jalan Sentral 5, KL Sentral, 50470 Kuala Lumpur"
                className="min-h-20 w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Phone Number</span>
              <input
                defaultValue="+60 12-345 6789"
                className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Email</span>
              <input
                defaultValue="info@barberpro.my"
                className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-lg border border-border/70 bg-background/50 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/20 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-border/70 px-3 py-2 text-sm hover:bg-muted"
              type="button"
            >
              <Upload className="h-4 w-4" />
              Upload New Logo
            </button>
          </div>
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Roles & Permissions",
            description: "Manage access by owner, manager, cashier, and barber.",
            icon: ShieldCheck
          },
          {
            title: "Payment Methods",
            description: "Configure cash, card, transfer, and e-wallet defaults.",
            icon: CreditCard
          },
          {
            title: "Receipt Branding",
            description: "Customize receipt header, footer, and branch labels.",
            icon: ReceiptText
          },
          {
            title: "Notifications",
            description: "Control reminders, alerts, and payroll notices.",
            icon: Bell
          }
        ].map((card) => (
          <article
            key={card.title}
            className="rounded-xl border border-border/70 bg-card p-5"
          >
            <card.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-sm font-semibold">{card.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-border/70 bg-card p-5">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Localization</h3>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Timezone</span>
            <select className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary">
              <option>Asia/Kuala_Lumpur</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Language</span>
            <select className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary">
              <option>English (Malaysia)</option>
              <option>Bahasa Melayu</option>
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}
