# BarberPro Architecture

## Overview

BarberPro is a Malaysia-first, multi-tenant barber shop management SaaS. The system is structured as a **pnpm monorepo** containing multiple independently deployed Next.js web apps, Expo mobile apps, and shared packages. All apps share a single Supabase backend with row-level security (RLS) enforcing tenant data isolation.

---

## Repository Structure

```
barberpro/
├── apps/
│   ├── web-shop/             # Barber shop management portal (shop.barberpro.my)
│   ├── web-admin/            # Super-admin console (admin-pro.barberpro.my)
│   ├── web-customer/         # Customer-facing portal (barberpro.my)
│   ├── mobile-customer/      # Customer iOS/Android app               [PLANNED]
│   └── mobile-staff/         # Staff/barber iOS/Android app           [PLANNED]
├── packages/
│   ├── config/               # Shared tsconfig base
│   ├── env/                  # Shared typed env schema helpers
│   ├── types/                # Shared TypeScript type placeholders
│   ├── ui/                   # Shared web UI design tokens (shadcn base)
│   ├── db/                   # Shared Supabase clients + queries
│   ├── auth/                 # Shared auth helpers
│   ├── ui-native/            # Shared React Native UI components       [PLANNED]
│   └── notifications/        # Shared Expo push notification helpers   [PLANNED]
├── supabase/
│   └── migrations/           # SQL migration files (sequential)
└── docs/                     # All project documentation
```

---

## Apps

### 1. `apps/web-shop` — Barber Shop Management Portal
**Domain:** `shop.barberpro.my`
**Port (dev):** 3000
**Audience:** Barber shop owners and their staff

This is the primary operator dashboard. It handles:

- **Marketing landing page** — SaaS pitch, pricing plans, CTA to register
- **Onboarding flow** — shop setup wizard, Stripe subscription
- **Dashboard** — revenue, queue overview, today's appointments
- **Queue management** — real-time walk-in queue with seat assignment
- **POS (Point of Sale)** — service billing, product sales, receipts
- **Appointments** — calendar-based booking management
- **Staff management** — barbers, roles, commission schemes, attendance, payroll
- **Customer management** — CRM, loyalty points, notes
- **Inventory** — products, supplies, stock movements, suppliers
- **Expenses** — expense tracking by category
- **Reports** — revenue, staff performance, commissions, sales
- **Branch management** — multi-location support (Professional/Enterprise plans)
- **Settings** — shop profile, operating hours, language, integrations
- **Queue Board** (`/queue-board`) — public TV display for in-shop lobby
- **Self-check-in Kiosk** (`/check-in/[token]`) — walk-in QR code check-in

**Tech stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Supabase SSR, Stripe

---

### 2. `apps/web-admin` — Super-Admin Console
**Domain:** `admin-pro.barberpro.my`
**Port (dev):** 3002
**Audience:** BarberPro internal team only

Platform-level administration:

- **Tenant management** — view, activate, suspend all shops
- **User management** — search/manage users across all tenants
- **Billing overview** — subscription statuses, Stripe customer links, MRR
- **Audit logs** — platform-level activity log
- **Reports** — aggregate platform metrics
- **Settings** — feature flags, platform config

**Access control:** Only users with `is_super_admin() = true` (DB function) can access any route. Middleware must enforce this using the Supabase admin client, not the session client.

**Tech stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Supabase (service role for admin queries)

---

### 3. `apps/web-customer` — Customer Portal
**Domain:** `barberpro.my`
**Audience:** End customers (people getting haircuts)

The public-facing product that drives growth and retention:

- **Marketing landing page** — "Find your barber, skip the wait"
- **Shop discovery** — browse shops by location, browse services
- **Shop profile pages** — `/shop/[slug]` — photos, services, staff, operating hours, queue status
- **Online booking** — pick service, barber, time slot
- **Live queue** — real-time queue position for current visit
- **Customer account** — signup, login, profile
- **Booking history** — past and upcoming appointments
- **Loyalty & rewards** — points balance, rewards redemption
- **Customer subscription** — premium booking features (optional, future)

**Tech stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Supabase SSR, same Supabase project as `apps/web-shop`

---

### 4. `apps/mobile-customer` — Customer Mobile App [PLANNED]
**Platform:** iOS + Android (Expo)
**Audience:** End customers

Native mobile experience. The core value-add over the web portal:

- **Push notifications** — "You're #3 in queue, head to the shop now"
- **Booking flow** — fast native UX, camera for QR scan
- **Queue tracking** — live position with background updates
- **Loyalty wallet** — points, stamps, rewards
- **Deep links** — `barberpro://shop/[slug]` for QR codes

**Tech stack:** Expo 53+, Expo Router, React Native, NativeWind, Supabase JS, Expo Notifications, EAS Build, EAS Update

---

### 5. `apps/mobile-staff` — Staff Mobile App [PLANNED]
**Platform:** iOS + Android (Expo)
**Audience:** Barbers and shop staff

Lightweight companion to the web dashboard:

- **Daily schedule** — appointments assigned to this barber
- **Queue view** — see current queue, mark serving/done
- **Clock in/out** — attendance recording
- **Commission tracker** — today's earnings, monthly summary
- **Push notifications** — "New booking assigned to you"

**Tech stack:** Same as `mobile-customer`

---

## Shared Packages

### `packages/db`
Shared Supabase clients and common queries used across all apps. Eliminates copy-paste of auth/query logic.

**Contents:**
- `src/client.ts` — browser Supabase client factory
- `src/server.ts` — server-side Supabase client factory (SSR cookie bridge)
- `src/admin.ts` — service-role admin client
- `src/queries.ts` — shared query helpers (getCurrentTenant, etc.)
- `src/middleware.ts` — session refresh helper for Next.js middleware

### `packages/auth`
Shared authentication utilities.

**Contents:**
- Role checking helpers
- Auth context helpers (`getAuthContext`)
- Middleware gate utilities

### `packages/ui` [EXISTS — Expand]
Shared shadcn/ui component overrides and design tokens. Any component used in more than one web app lives here.

### `packages/ui-native` [PLANNED]
Shared React Native components using NativeWind. Mirrors the design system for mobile apps.

### `packages/notifications` [PLANNED]
Expo push notification helpers shared between both mobile apps.

---

## Backend: Supabase

**One Supabase project** serves all apps. Multi-tenancy is enforced entirely through PostgreSQL Row Level Security (RLS).

### Auth Strategy

| User Type | How identified | Access |
|---|---|---|
| Shop Owner | `tenants.owner_auth_id = auth.uid()` | Full dashboard |
| Staff/Barber | `app_users` row with `role = 'barber'\|'cashier'\|'manager'` | Role-scoped dashboard |
| Customer | `customers` table (future: `app_users` with `role = 'customer'`) | Customer portal only |
| Super Admin | `is_super_admin()` DB function returns true | Admin console only |

### Tenant Isolation

Every table (except public read tables) has `tenant_id` column. RLS policies use `get_my_tenant_id()` DB function to scope access:

```sql
-- Standard pattern for all authenticated tables
using (tenant_id = get_my_tenant_id())
```

The `get_my_tenant_id()` function result is cached within a transaction, so it runs once regardless of how many rows are evaluated.

### Public Access

The queue board and check-in flow require anonymous access. These tables have separate anon-scoped policies that restrict to active/public branches only.

### Database Functions

| Function | Purpose |
|---|---|
| `get_my_tenant_id()` | Returns tenant_id for current auth user — used in every RLS policy |
| `get_my_owned_tenant_ids()` | Returns array of tenant IDs the user owns |
| `is_super_admin()` | Returns true if current user has super admin privileges |
| `current_tenant_id()` | Alias for get_my_tenant_id() |
| `link_auth_user_by_email()` | Links a Supabase auth user to an app_users row by email |

### Realtime

Supabase Realtime is enabled for:
- `queue_tickets` — live queue board updates
- `queue_ticket_seats` — seat assignment updates
- `branch_seats` — seat configuration updates

---

## Infrastructure

### Deployment

Each app is a **separate Vercel project** linked to this monorepo. Vercel detects the monorepo and allows per-app root directory configuration.

| App | Vercel Project | Domain |
|---|---|---|
| `apps/web-shop` | `barberpro-shop` | `shop.barberpro.my` |
| `apps/web-admin` | `barberpro-admin` | `admin-pro.barberpro.my` |
| `apps/web-customer` | `barberpro-customer` | `barberpro.my` |
| `apps/mobile-customer` | EAS (Expo) | App Store / Play Store |
| `apps/mobile-staff` | EAS (Expo) | App Store / Play Store |

### Connection Pooling

In production, use Supabase Supavisor (port 6543) for all non-realtime DB connections. This prevents connection exhaustion from serverless function cold starts.

- **Transaction mode** (port 6543) — for server actions and API routes
- **Session mode** (port 5432) — for migrations only
- **Direct connection** — never in production app code

### Caching

- Middleware tenant check: cache tenant state in a short-lived signed cookie after login. Avoid DB queries on every request.
- API routes: set appropriate `Cache-Control` headers. Queue board data should use Realtime subscriptions instead of polling.
- Next.js: use `unstable_cache` or React cache() for repeated server-side queries within a request.

---

## Key Architectural Decisions

### Why separate apps instead of one app with subdomain middleware?

- **Independent deployments** — a bug in the customer portal doesn't block a shop from using their dashboard
- **Independent scaling** — high customer traffic doesn't affect barber shop dashboard latency
- **Team ownership** — different features can be developed independently without merge conflicts
- **Security boundary** — the super admin app is a completely separate deployment; there is no shared code path from the public internet to admin routes

### Why pnpm monorepo?

- **Shared packages** — types, auth, and DB clients are written once and consumed by all apps
- **Atomic changes** — a DB schema change can update types, queries, and app code in one PR
- **Single CI run** — one pipeline validates the entire platform

### Why Supabase for multi-tenancy?

- **RLS is the security layer** — even if application code has bugs, the database will reject unauthorized data access
- **One DB, all tenants** — simpler operations, no per-tenant DB provisioning
- **Built-in auth** — Supabase Auth handles email/password, OTP, OAuth with minimal setup
- **Realtime included** — queue board live updates are free with existing infrastructure

---

## Data Flow: Barber Shop Request

```
Browser → Vercel Edge → Next.js Middleware
  → Refresh Supabase session (cookie)
  → Check tenant gate (cache-first)
  → Route to page/server action
  → createClient() with user session
  → Supabase RLS validates tenant_id
  → Return data scoped to tenant
```

## Data Flow: Queue Board (Public)

```
In-shop TV/tablet → GET /api/queue-board?branch=<id>
  → createAdminClient() (service role, bypasses RLS)
  → Filter by branch_id param (application-layer scope)
  → Return queue data
  → Supabase Realtime WebSocket for live updates
```

## Data Flow: Stripe Webhook

```
Stripe → POST /api/webhooks/stripe
  → Verify webhook signature (HMAC)
  → Parse event type
  → createAdminClient() (service role — no user session on webhook)
  → Update tenants table
  → Return 200 immediately (< 5s requirement)
```
