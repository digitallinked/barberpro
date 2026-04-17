# BarberPro Monorepo

BarberPro.my is a **Malaysia-first, multi-tenant barber shop management SaaS** — a complete platform for shop owners, their staff, and their customers.

---

## Apps

| App | Domain | Status | Description |
|---|---|---|---|
| `apps/web-shop` | `shop.barberpro.my` | Active | Barber shop management portal (owners + staff) |
| `apps/web-admin` | `admin-go.barberpro.my` | Active | BarberPro super-admin console |
| `apps/web-customer` | `barberpro.my` | Active | Customer-facing portal |
| `apps/mobile-customer` | App Store / Play Store | Planned (Phase 4) | Customer iOS/Android app |
| `apps/mobile-staff` | App Store / Play Store | Planned (Phase 5) | Staff iOS/Android app |

## Packages

| Package | Description | Status |
|---|---|---|
| `packages/config` | Shared TypeScript base config | Active |
| `packages/env` | Typed environment schema helpers | Active |
| `packages/ui` | Shared shadcn/ui design tokens | Active |
| `packages/types` | Shared type placeholders | Active |
| `packages/db` | Shared Supabase clients + queries | Active |
| `packages/auth` | Shared auth helpers | Active |
| `packages/ui-native` | Shared React Native components | Planned (Phase 4) |
| `packages/notifications` | Web-push + Supabase notification helpers | Active |

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 10+: `npm install -g pnpm`
- Supabase CLI: `npm install -g supabase`

### Installation

```bash
pnpm install
```

### Environment Setup

```bash
cp apps/web-shop/.env.example apps/web-shop/.env.local
cp apps/web-admin/.env.example apps/web-admin/.env.local
cp apps/web-customer/.env.example apps/web-customer/.env.local
```

Fill in credentials from your Supabase project and Stripe dashboard. See `docs/DEPLOYMENT.md` for the full variable list.

### Local Database

```bash
# Start local Supabase stack (requires Docker)
supabase start

# Apply migrations
supabase db push

# Regenerate TypeScript types
supabase gen types typescript --local > apps/web-shop/src/types/database.types.ts
```

---

## Development

```bash
# Barber shop management portal (port 3000)
pnpm dev:shop

# Super-admin console (port 3002)
pnpm dev:admin

# Customer portal (port 3001)
pnpm dev:customer

# Mobile (Expo DevTools)
pnpm dev:mobile
```

---

## Workspace Scripts

| Script | Description |
|---|---|
| `pnpm dev:shop` | Start `apps/web-shop` dev server (port 3000) |
| `pnpm dev:admin` | Start `apps/web-admin` dev server (port 3002) |
| `pnpm dev:customer` | Start `apps/web-customer` dev server (port 3001) |
| `pnpm dev:mobile` | Start Expo dev server |
| `pnpm build:shop` | Production build for `apps/web-shop` |
| `pnpm build:admin` | Production build for `apps/web-admin` |
| `pnpm build:customer` | Production build for `apps/web-customer` |
| `pnpm typecheck` | Type-check all apps |
| `pnpm typecheck:shop` | Type-check `apps/web-shop` only |
| `pnpm typecheck:admin` | Type-check `apps/web-admin` only |
| `pnpm typecheck:customer` | Type-check `apps/web-customer` only |
| `pnpm lint:shop` | Lint `apps/web-shop` |
| `pnpm lint:admin` | Lint `apps/web-admin` |
| `pnpm lint:customer` | Lint `apps/web-customer` |

---

## Repository Structure

```
apps/
  web-shop/             # Barber shop management (shop.barberpro.my)
  web-admin/            # Super-admin console (admin-go.barberpro.my)
  web-customer/         # Customer portal (barberpro.my)
  mobile-customer/      # Customer iOS/Android app [Planned]
  mobile-staff/         # Staff iOS/Android app [Planned]
packages/
  config/               # tsconfig base
  env/                  # Typed env helpers
  ui/                   # Shared web UI components
  types/                # Shared types
  db/                   # Supabase clients
  auth/                 # Auth helpers
  ui-native/            # React Native components [Planned]
  notifications/        # Web-push + Supabase notification helpers
supabase/
  migrations/           # SQL migration files (versioned, never edit existing)
docs/
  ARCHITECTURE.md       # Full system architecture
  PRODUCT_BRIEF.md      # Product vision and user personas
  ROADMAP.md            # Phased delivery plan
  DATABASE_SCHEMA.md    # All tables, columns, RLS patterns
  SECURITY.md           # Security rules and guidelines
  CONTRIBUTING.md       # Dev workflow and coding standards
  DEPLOYMENT.md         # Vercel, CI/CD, migrations, domains
  MOBILE_STRATEGY.md    # Expo mobile app plan
.cursor/
  rules/                # AI assistant rules for this project
```

---

## Documentation

| Document | Purpose |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | Multi-app system design, data flows, infrastructure |
| [Product Brief](docs/PRODUCT_BRIEF.md) | Vision, user personas, feature modules, pricing |
| [Roadmap](docs/ROADMAP.md) | Phased delivery plan (Phase 0–6) |
| [Database Schema](docs/DATABASE_SCHEMA.md) | All tables, columns, RLS patterns, indexes |
| [Security](docs/SECURITY.md) | Tenant isolation, auth rules, webhook security |
| [Contributing](docs/CONTRIBUTING.md) | Setup, coding standards, migration workflow |
| [Deployment](docs/DEPLOYMENT.md) | Vercel setup, CI/CD, domain config, monitoring |
| [Mobile Strategy](docs/MOBILE_STRATEGY.md) | Expo app plan, push notifications, EAS |

---

## Current Status

All phases (0–6) have been implemented. See `docs/ROADMAP.md` for the full phased plan.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Mobile | Expo 53, React Native, Expo Router, NativeWind |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Billing | Stripe (subscriptions, webhooks) |
| Deployment | Vercel (web apps), EAS (mobile apps) |
| Monorepo | pnpm workspaces |
