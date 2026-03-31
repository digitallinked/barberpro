# BarberPro Monorepo

BarberPro.my is a **Malaysia-first, multi-tenant barber shop management SaaS** — a complete platform for shop owners, their staff, and their customers.

---

## Apps

| App | Domain | Status | Description |
|---|---|---|---|
| `apps/web` | `shop.barberpro.my` | Active | Barber shop management portal (owners + staff) |
| `apps/web-admin` | `admin-pro.barberpro.my` | Active | BarberPro super-admin console |
| `apps/customer` | `barberpro.my` | Planned (Phase 2) | Customer-facing portal |
| `apps/mobile-customer` | App Store / Play Store | Planned (Phase 4) | Customer iOS/Android app |
| `apps/mobile-staff` | App Store / Play Store | Planned (Phase 5) | Staff iOS/Android app |

## Packages

| Package | Description | Status |
|---|---|---|
| `packages/config` | Shared TypeScript base config | Active |
| `packages/env` | Typed environment schema helpers | Active |
| `packages/ui` | Shared shadcn/ui design tokens | Active |
| `packages/types` | Shared type placeholders | Active |
| `packages/db` | Shared Supabase clients + queries | Planned (Phase 1) |
| `packages/auth` | Shared auth helpers | Planned (Phase 1) |
| `packages/ui-native` | Shared React Native components | Planned (Phase 4) |
| `packages/notifications` | Expo push notification helpers | Planned (Phase 4) |

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+: `npm install -g pnpm`
- Supabase CLI: `npm install -g supabase`

### Installation

```bash
pnpm install
```

### Environment Setup

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/web-admin/.env.example apps/web-admin/.env.local
```

Fill in credentials from your Supabase project and Stripe dashboard. See `docs/DEPLOYMENT.md` for the full variable list.

### Local Database

```bash
# Start local Supabase stack (requires Docker)
supabase start

# Apply migrations
supabase db push

# Regenerate TypeScript types
supabase gen types typescript --local > apps/web/src/types/database.types.ts
```

---

## Development

```bash
# Barber shop management portal (port 3000)
pnpm dev:web

# Super-admin console (port 3002)
pnpm dev:admin

# Mobile (Expo DevTools)
pnpm dev:mobile
```

---

## Workspace Scripts

| Script | Description |
|---|---|
| `pnpm dev:web` | Start `apps/web` dev server (port 3000) |
| `pnpm dev:admin` | Start `apps/web-admin` dev server (port 3002) |
| `pnpm dev:mobile` | Start Expo dev server |
| `pnpm build:web` | Production build for `apps/web` |
| `pnpm build:admin` | Production build for `apps/web-admin` |
| `pnpm typecheck` | Type-check all apps |
| `pnpm typecheck:web` | Type-check `apps/web` only |
| `pnpm typecheck:admin` | Type-check `apps/web-admin` only |
| `pnpm lint:web` | Lint `apps/web` |
| `pnpm lint:admin` | Lint `apps/web-admin` |

---

## Repository Structure

```
apps/
  web/                  # Barber shop management (shop.barberpro.my)
  web-admin/            # Super-admin console (admin-pro.barberpro.my)
  customer/             # Customer portal [Planned]
  mobile-customer/      # Customer iOS/Android app [Planned]
  mobile-staff/         # Staff iOS/Android app [Planned]
packages/
  config/               # tsconfig base
  env/                  # Typed env helpers
  ui/                   # Shared web UI components
  types/                # Shared types
  db/                   # Supabase clients [Planned]
  auth/                 # Auth helpers [Planned]
  ui-native/            # React Native components [Planned]
  notifications/        # Push notification helpers [Planned]
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

## Current Priority (Phase 0 — Production Hardening)

Before adding new features, these production correctness issues must be fixed:

- [ ] Fix Stripe webhook to use `createAdminClient()` (not session client)
- [ ] Fix queue board RLS policy scope (currently exposes all tenants' data)
- [ ] Cache tenant state in cookie to eliminate middleware DB queries per request
- [ ] Add Sentry error monitoring
- [ ] Add transactional email (Resend)
- [ ] Set up GitHub Actions CI pipeline
- [ ] Create `.env.example` files for all apps
- [ ] Add critical database indexes

See `docs/ROADMAP.md` for the full phased plan.

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
