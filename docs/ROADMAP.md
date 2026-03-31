# BarberPro Roadmap

## Guiding Principles

1. **Validate on web before going native** — build the web portal first, ship to real users, then build mobile once you know what matters
2. **Fix production correctness before adding features** — security, reliability, and observability before new screens
3. **One thing at a time** — complete and polish each phase before starting the next
4. **Infrastructure investments compound** — shared packages, CI/CD, and monitoring pay dividends across all future work

---

## Phase 0 — Production Hardening (Current Priority)
**Goal:** Make `apps/web-shop` production-safe before any real customers use it.
**Timeline:** Complete before first paying tenant

### Security Fixes
- [ ] Fix Stripe webhook: use `createAdminClient()` instead of `createClient()` (session client has no user in webhook context)
- [ ] Fix queue board RLS policies — `using (true)` exposes all tenants' queue data to anon users; scope to active branches only
- [ ] Add Stripe webhook idempotency — store processed `event.id` to prevent double-processing on retries
- [ ] Audit all anon-accessible RLS policies for data leakage

### Performance Fixes
- [ ] Cache tenant state in a signed cookie post-login — eliminate the 1–3 Supabase DB queries per request in middleware
- [ ] Switch all RLS policies to use `get_my_tenant_id()` function instead of inline subqueries (Postgres caches per transaction)
- [ ] Enable Supabase Supavisor connection pooling (port 6543) for production DB URL
- [ ] Add critical indexes: `app_users(auth_user_id)`, `app_users(tenant_id, is_active)`, `tenants(owner_auth_id)`, `tenants(slug)`, `queue_tickets(branch_id, status, created_at)`

### Observability
- [ ] Add Sentry error monitoring to `apps/web-shop` (Next.js SDK)
- [ ] Configure Vercel Analytics + Speed Insights on `apps/web-shop`
- [ ] Set up structured logging via Axiom or Logtail

### Email
- [ ] Integrate Resend for transactional email
- [ ] Booking confirmation email to customer
- [ ] Payment failed notification to shop owner
- [ ] Staff invitation email (via `link_auth_user_by_email`)

### DevOps
- [ ] Create `.env.example` files for all apps documenting required variables
- [ ] Set up GitHub Actions CI: `typecheck → lint → build` on every PR
- [ ] Configure separate Vercel projects for `apps/web-shop` and `apps/web-admin` with proper domains
- [ ] Automate `supabase db push` as part of deployment pipeline

---

## Phase 1 — Wire Up Super-Admin (`apps/web-admin`)
**Goal:** Have a working admin console to manage the platform as tenants grow.
**Prerequisite:** Phase 0 complete

### Auth & Middleware
- [ ] Add Supabase to `web-admin` (`@supabase/supabase-js`, `@supabase/ssr`)
- [ ] Add middleware with `is_super_admin()` check — redirect non-admins to login
- [ ] Add Sentry to `web-admin`

### Features
- [ ] Tenant list: search, filter by plan/status, view details
- [ ] Tenant detail: subscription status, Stripe customer link, branch count, user count
- [ ] User search: find any user across all tenants
- [ ] Manually suspend / reactivate a tenant
- [ ] Platform metrics: total tenants, active subscriptions, MRR
- [ ] Audit log viewer

### Package Extraction
- [ ] Create `packages/db` — move Supabase clients from `apps/web-shop/src/lib/supabase/` to shared package
- [ ] Create `packages/auth` — move `getAuthContext` and auth helpers to shared package
- [ ] Update `apps/web-shop` and `apps/web-admin` to import from `@barberpro/db` and `@barberpro/auth`

---

## Phase 2 — Customer Portal (`apps/web-customer`)
**Goal:** Launch the customer-facing web app at `barberpro.my` to drive growth and enable online booking.
**Prerequisite:** Phase 1 complete (shared packages must exist first)

### Setup
- [ ] Scaffold `apps/web-customer` as a new Next.js 15 app in the monorepo
- [ ] Configure domain `barberpro.my` in Vercel
- [ ] Add to root `package.json` workspace scripts
- [ ] Add Sentry, Vercel Analytics

### Marketing Pages
- [ ] Landing page (`/`) — "Find your barber, skip the wait" hero, features, shop count CTA
- [ ] How it works page
- [ ] For Businesses page (upsell to `shop.barberpro.my` via `apps/web-shop`)
- [ ] Blog/SEO placeholder structure

### Shop Discovery
- [ ] Shop listing page (`/shops`) — browse all active shops
- [ ] Shop profile page (`/shop/[slug]`) — photos, services, staff, operating hours, live queue status
- [ ] Basic location/city filtering

### Customer Auth
- [ ] Customer signup / login (Supabase Auth, same project)
- [ ] Distinguish customer role from shop owner/staff role in `app_users` or new `customer_accounts` table
- [ ] Customer profile page

### Booking Flow
- [ ] Service selection on shop profile page
- [ ] Barber selection (optional)
- [ ] Time slot picker (based on `appointments` table)
- [ ] Booking confirmation page + email confirmation

### Queue Tracking
- [ ] Live queue position page for current visit (reuse existing Realtime subscription logic)
- [ ] Queue join via QR code scan on the web

### Loyalty
- [ ] Loyalty points balance display
- [ ] Points history

---

## Phase 3 — Queue Board & Kiosk Polish
**Goal:** Make the in-shop display surfaces production-quality.
**Can run in parallel with Phase 2**

### Queue Board (`/queue-board`)
- [ ] Kiosk mode — fullscreen, no browser chrome, auto-wake screen via Wake Lock API
- [ ] Convert to PWA — installable on Android TV / iPad, works offline for last-known state
- [ ] Improved visual design — large text, high contrast, seat assignment display

### Self-Check-in Kiosk (`/check-in/[token]`)
- [ ] Full-screen kiosk layout (large touch targets, no navigation)
- [ ] QR code generation for shop entrance printed cards
- [ ] Party size selection
- [ ] Confirmation screen with queue ticket number
- [ ] Convert to PWA for offline-capable kiosk install

---

## Phase 4 — Customer Mobile App (`apps/mobile-customer`)
**Goal:** Launch iOS and Android apps for end customers to enable push notifications.
**Prerequisite:** Phase 2 (customer portal) has real users

### Rationale
Only build the mobile app after the customer portal has validated demand. The #1 reason to go native is push notifications — "You're #3 in queue" is the killer feature that makes customers install the app.

### Setup
- [ ] Rename/repurpose `apps/mobile` to `apps/mobile-customer`
- [ ] Add Expo Router, Supabase JS, NativeWind, Expo Notifications, Expo SecureStore
- [ ] Configure EAS Build for iOS and Android
- [ ] Configure EAS Update for over-the-air JS updates
- [ ] Set up `packages/ui-native` for shared React Native components
- [ ] Set up `packages/notifications` for push notification helpers

### Features
- [ ] Onboarding / sign-in flow
- [ ] Home screen — upcoming booking, nearby shops
- [ ] Shop discovery (map + list view)
- [ ] Shop profile — services, barbers, live queue badge
- [ ] Book appointment flow (native UX)
- [ ] Live queue tracking screen
- [ ] Push notifications — queue position updates, booking reminders
- [ ] Loyalty wallet
- [ ] Profile & booking history

### Infrastructure
- [ ] Supabase Edge Function or Vercel Cron to trigger push notifications when queue position changes
- [ ] Expo push token stored per customer record

---

## Phase 5 — Staff Mobile App (`apps/mobile-staff`)
**Goal:** Give barbers a mobile-first view of their workday.
**Prerequisite:** Phase 4 (shared mobile infrastructure exists)

### Features
- [ ] Login (same Supabase Auth, role detection)
- [ ] Today's appointments and queue
- [ ] Clock in / clock out (attendance)
- [ ] Commission dashboard — today, this week, this month
- [ ] Push notifications — new booking assigned
- [ ] Quick queue actions: mark serving, mark done

---

## Phase 6 — Scale & Enterprise Features
**Goal:** Unlock the Professional and Enterprise tier value props.
**Prerequisite:** Phases 1–4 complete with stable user base

### Multi-Branch Improvements
- [ ] Branch performance comparison in reports
- [ ] Cross-branch staff scheduling
- [ ] Centralized product catalog shared across branches
- [ ] Branch-level P&L

### Payments
- [ ] Online payment at booking (Stripe payment intent)
- [ ] Deposit requirement for no-show prevention
- [ ] E-wallet integration (GrabPay, Touch 'n Go) for Malaysian market

### Communications
- [ ] SMS notifications via Malaysian SMS gateway (for customers without the app)
- [ ] WhatsApp notification option (via Twilio or Vonage WhatsApp Business API)
- [ ] Email marketing — post-visit feedback request, loyalty campaigns

### Platform
- [ ] White-label option for Enterprise (custom domain per shop)
- [ ] Public API for Enterprise customers (webhooks, OAuth app)
- [ ] Background job queue (Vercel Queues or Supabase Edge Functions) for payroll calculations, email sends, and report generation
- [ ] Advanced analytics — customer retention cohorts, LTV

---

## Ongoing / Always

- Dependency updates (monthly — Renovate bot)
- Supabase migration hygiene — all schema changes via versioned migration files
- Security audit — quarterly review of RLS policies and API route authorization
- Performance budget — Core Web Vitals must stay green on Vercel Analytics
- Type safety — `database.types.ts` regenerated after every migration (`supabase gen types`)
