# BarberPro Roadmap

## Guiding Principles

1. **Validate on web before going native** — build the web portal first, ship to real users, then build mobile once you know what matters
2. **Fix production correctness before adding features** — security, reliability, and observability before new screens
3. **One thing at a time** — complete and polish each phase before starting the next
4. **Infrastructure investments compound** — shared packages, CI/CD, and monitoring pay dividends across all future work

---

## Phases 0–3 — Completed

All web-platform phases are shipped. Key milestones delivered:

**Phase 0 — Production Hardening**
- Stripe webhook uses `createAdminClient()` with idempotency guard and durability fix (insert after handler)
- Queue board RLS scoped to active branches only (`20260331120000_security_hardening.sql`)
- Vercel Analytics + Speed Insights on all web apps
- Resend transactional email (subscription, payroll, trial expiry, card expiry)
- `.env.example` files for all apps; GitHub Actions CI (`typecheck → lint → build`)
- Separate Vercel projects for shop (`shop.barberpro.my`), admin (`admin-go.barberpro.my`), customer (`barberpro.my`)

**Phase 1 — Super-Admin Console (`apps/web-admin`)**
- Full middleware with `get_admin_role()` RBAC (super_admin, accounts, support, reports_viewer)
- Tenant management, user search, billing, audit logs, announcements, blog CMS, platform reports
- `packages/db`, `packages/auth`, `packages/env`, `packages/ui` extracted and shared

**Phase 2 — Customer Portal (`apps/web-customer`)**
- Landing page, shop discovery, booking flow, queue tracking, loyalty, customer auth
- BarberPro Plus subscription (Stripe Checkout + Customer Portal)
- Walk-in QR check-in, push notifications via `packages/notifications`

**Phase 3 — Queue Board & Kiosk Polish**
- Queue board TV display with Realtime updates and seat assignments
- Self-check-in kiosk with party size, confirmation, and QR code entry

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
