# Deployment & CI/CD

---

## Overview

Each web app in the monorepo is a **separate Vercel project** linked to the same GitHub repository. Vercel automatically detects the monorepo and builds only the changed app on each push.

Mobile apps use **EAS Build** (Expo Application Services) for iOS and Android builds and **EAS Update** for over-the-air JavaScript updates.

---

## Vercel Projects

| App | Vercel Project Name | Root Directory | Domain |
|---|---|---|---|
| `apps/web` | `barberpro-web` | `apps/web` | `shop.barberpro.my` |
| `apps/web-admin` | `barberpro-admin` | `apps/web-admin` | `admin-pro.barberpro.my` |
| `apps/customer` | `barberpro-customer` | `apps/customer` | `barberpro.my` |

### Vercel Project Setup
1. Create a new Vercel project → Import Git Repository
2. Set **Root Directory** to `apps/web` (or the respective app)
3. Framework: Next.js (auto-detected)
4. Build command: `pnpm build` (Vercel uses the `package.json` in the root directory)
5. Install command: `pnpm install --frozen-lockfile`
6. Output directory: `.next`

### Vercel Ignored Build Step
To avoid rebuilding an app when unrelated files change, configure ignored build steps in each Vercel project:

```bash
# In each Vercel project's "Ignored Build Step" setting:
# For apps/web:
git diff HEAD^ HEAD --quiet -- apps/web/ packages/

# For apps/web-admin:
git diff HEAD^ HEAD --quiet -- apps/web-admin/ packages/

# For apps/customer:
git diff HEAD^ HEAD --quiet -- apps/customer/ packages/
```

---

## Environment Variables

### Per-App Variables (set in each Vercel project)

**`apps/web` environment:**
```
NEXT_PUBLIC_APP_URL=https://shop.barberpro.my
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]  # Production + Preview only
STRIPE_SECRET_KEY=[sk_live_...]               # Production only; sk_test_... for Preview
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[pk_live_...]
STRIPE_WEBHOOK_SECRET=[whsec_...]
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=[price_...]
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=[price_...]
```

**`apps/web-admin` environment:**
```
NEXT_PUBLIC_ADMIN_URL=https://admin-pro.barberpro.my
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

### Rules
- All `_SECRET_`, `_KEY_` variables: Production + Preview environments only (never Development)
- Use separate Stripe test keys for Preview environment
- Never use production Supabase service role key in local development — use `supabase start` local stack

---

## Database Migrations

**Migrations must run before code deployment.** Never deploy code that requires a schema change without first applying the migration.

### Production Migration Workflow

```bash
# 1. Apply migration to production Supabase
supabase db push --linked

# 2. Verify migration applied correctly
supabase db diff --linked

# 3. Then trigger Vercel deployment (or push to main branch)
```

### Staging Migration Workflow

Use a separate Supabase project as a staging environment:
```bash
# Link to staging project
supabase link --project-ref [staging-project-ref]

# Apply migrations to staging
supabase db push

# Test on Vercel Preview deployment
```

### Automated Migration (Future Goal)
Add migration as a pre-deployment check in GitHub Actions:
```yaml
- name: Run DB migrations
  run: supabase db push --linked
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```

---

## GitHub Actions CI Pipeline

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    name: Typecheck, Lint & Build
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck all apps
        run: pnpm typecheck

      - name: Lint web app
        run: pnpm lint:web

      - name: Lint admin app
        run: pnpm lint:admin

      - name: Build web app
        run: pnpm build:web
        env:
          NEXT_PUBLIC_APP_URL: https://shop.barberpro.my
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Build admin app
        run: pnpm build:admin
        env:
          NEXT_PUBLIC_ADMIN_URL: https://admin-pro.barberpro.my
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

### Required GitHub Secrets
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

These are safe to use in CI (anon key, restricted by RLS) — don't add the service role key to GitHub Actions.

---

## Supabase Connection Pooling (Production)

In production, use **Supabase Supavisor** to prevent connection exhaustion from serverless cold starts.

### Connection Strings

| Mode | Port | Use For |
|---|---|---|
| **Transaction** (Supavisor) | 6543 | Server actions, API routes, Next.js functions |
| **Session** (Supavisor) | 5432 | Migrations (`supabase db push`) |
| **Direct** | 5432 | Never use in production app code |

### Environment Variable
Use the **Transaction mode connection string** from Supabase dashboard → Settings → Database → Connection string → Transaction:
```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

This is used if you ever add Prisma or Drizzle. For Supabase JS client (which manages its own connection), the `SUPABASE_URL` and keys are sufficient.

---

## Domain Configuration

### DNS Setup (Cloudflare or your DNS provider)

| Record | Type | Name | Value |
|---|---|---|---|
| barberpro.my | A or CNAME | `@` | Vercel IP / cname.vercel-dns.com |
| shop.barberpro.my | CNAME | `shop` | cname.vercel-dns.com |
| admin-pro.barberpro.my | CNAME | `admin-pro` | cname.vercel-dns.com |
| *.barberpro.my (future) | CNAME | `*` | cname.vercel-dns.com |

### Vercel Domain Assignment
In each Vercel project → Settings → Domains:
- `barberpro-customer` project → Add `barberpro.my` and `www.barberpro.my`
- `barberpro-web` project → Add `shop.barberpro.my`
- `barberpro-admin` project → Add `admin-pro.barberpro.my`

---

## Stripe Webhook Configuration

### Production Webhook
In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- **Endpoint URL:** `https://shop.barberpro.my/api/webhooks/stripe`
- **Events to listen:**
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`
  - `checkout.session.completed`

### Preview/Staging Webhook
- **Endpoint URL:** Use the Vercel Preview deployment URL
- Use Stripe CLI for local testing:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```

---

## Monitoring & Observability

### Sentry (Error Tracking)
Add to all web apps. Install via:
```bash
cd apps/web && npx @sentry/wizard@latest -i nextjs
```

Configure in `sentry.client.config.ts` and `sentry.server.config.ts`. Key settings:
```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
  release: process.env.VERCEL_GIT_COMMIT_SHA,
});
```

### Vercel Analytics & Speed Insights
Add to root layout of each web app:
```tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Logging (Axiom or Logtail)
Choose one structured logging destination. All server-side errors should be logged with:
- Tenant ID (for filtering by shop)
- Request path
- Error message and stack
- Never log: passwords, tokens, credit card numbers

---

## Release Process

### Normal Feature Release
```
1. Feature branch → PR → CI passes
2. PR approved → merge to main
3. Vercel automatically deploys to production
4. Monitor Sentry for errors in first 30 minutes
5. Check Vercel Analytics for Core Web Vitals regression
```

### Emergency Hotfix
```
1. Create fix branch from main
2. Apply fix, push
3. CI runs on PR
4. Merge directly to main after review
5. Monitor Sentry
```

### Database-First Releases (Schema Changes)
```
1. Write and test migration locally
2. Apply migration to staging Supabase
3. Deploy code to Vercel Preview (linked to staging Supabase)
4. Test on Preview
5. Apply migration to production Supabase
6. Merge code to main → production deployment
```

### Rollback
- **Code rollback:** Vercel → Deployments → Previous deployment → Promote to Production (instant)
- **DB rollback:** Write a reverse migration. Never roll back migrations by editing them.
- **Stripe:** Webhook events can be replayed from the Stripe dashboard

---

## Checklist Before First Production Launch

- [ ] All `.env.example` files committed and up to date
- [ ] Production Supabase project linked and migrations applied
- [ ] Supavisor connection pooling URL configured
- [ ] All Vercel projects created with correct Root Directories
- [ ] Custom domains assigned and DNS configured
- [ ] SSL certificates active (Vercel handles this automatically)
- [ ] Stripe live keys configured in Vercel production environment
- [ ] Stripe webhook endpoint registered with production URL
- [ ] Sentry DSNs created and configured in all apps
- [ ] Vercel Analytics enabled on all projects
- [ ] GitHub Actions CI pipeline passing
- [ ] `supabase gen types` run and `database.types.ts` is current
- [ ] Security checklist from `docs/SECURITY.md` completed
- [ ] Critical database indexes created (see `docs/DATABASE_SCHEMA.md`)
