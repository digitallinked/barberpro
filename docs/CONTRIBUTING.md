# Contributing Guide

This document covers how to work in the BarberPro monorepo: setup, conventions, workflow, and code standards.

---

## Prerequisites

- **Node.js** 20+ (use `nvm` or `fnm`)
- **pnpm** 9+ — `npm install -g pnpm`
- **Supabase CLI** — `npm install -g supabase`
- **Git** with conventional commit messages preferred

---

## Repository Setup

```bash
# Clone the repo
git clone https://github.com/your-org/barberpro.git
cd barberpro

# Install all workspace dependencies
pnpm install

# Copy env files
cp apps/web-shop/.env.example apps/web-shop/.env.local
cp apps/web-admin/.env.example apps/web-admin/.env.local
cp apps/web-customer/.env.example apps/web-customer/.env.local
```

Fill in `.env.local` with real credentials from:
- Supabase project dashboard → Settings → API
- Stripe dashboard → Developers → API keys

---

## Running Apps

```bash
# Barber shop management portal (port 3000)
pnpm dev:shop

# Super-admin console (port 3002)
pnpm dev:admin

# Customer portal (port 3001)
pnpm dev:customer

# Expo mobile (choose platform in Expo DevTools)
pnpm dev:mobile
```

### Local Supabase (Optional)

You can run Supabase locally using Docker for fully offline development:

```bash
# Start local Supabase stack
supabase start

# Apply migrations
supabase db push

# Generate TypeScript types from local schema
supabase gen types typescript --local > apps/web-shop/src/types/database.types.ts
```

---

## Monorepo Conventions

### Package Naming

| App/Package | Package name |
|---|---|
| `apps/web-shop` | `@barberpro/web-shop` |
| `apps/web-admin` | `@barberpro/web-admin` |
| `apps/web-customer` | `@barberpro/web-customer` |
| `apps/mobile-customer` | `@barberpro/mobile-customer` |
| `apps/mobile-staff` | `@barberpro/mobile-staff` |
| `packages/db` | `@barberpro/db` |
| `packages/auth` | `@barberpro/auth` |
| `packages/ui` | `@barberpro/ui` |
| `packages/ui-native` | `@barberpro/ui-native` |
| `packages/types` | `@barberpro/types` |
| `packages/config` | `@barberpro/config` |
| `packages/env` | `@barberpro/env` |
| `packages/notifications` | `@barberpro/notifications` |

### Where Does Code Live?

| Code type | Location |
|---|---|
| Supabase clients (browser, server, admin) | `packages/db/src/` |
| Auth helpers, `getAuthContext` | `packages/auth/src/` |
| Shared web UI components | `packages/ui/src/` |
| Shared RN components | `packages/ui-native/src/` |
| DB types (auto-generated) | `apps/web-shop/src/types/database.types.ts` (source of truth — copy to packages/types if needed) |
| App-specific components | `apps/[app]/src/components/` |
| Server actions | `apps/web-shop/src/actions/` |
| API routes | `apps/web-shop/src/app/api/` |
| DB migrations | `supabase/migrations/` |
| Documentation | `docs/` |

### Shared Code Rule
If the same code appears in more than one app — move it to `packages/`. Do not copy-paste across apps.

---

## Database Migrations

**All schema changes go through migration files.** Never modify the Supabase dashboard schema directly in production.

```bash
# Create a new migration file
supabase migration new add_customer_subscriptions

# Apply to local DB
supabase db push

# Regenerate TypeScript types
supabase gen types typescript --local > apps/web-shop/src/types/database.types.ts
```

### Migration File Rules

1. Name format: `{timestamp}_{snake_case_description}.sql`
2. Timestamp: current UTC time in `YYYYMMDDHHMMSS`
3. **Never edit an existing migration** — always create a new one
4. Every new table must have:
   - `id uuid primary key default gen_random_uuid()`
   - `tenant_id uuid not null references public.tenants(id) on delete cascade`
   - `created_at timestamptz not null default now()`
   - `updated_at timestamptz not null default now()`
   - `alter table ... enable row level security`
   - RLS policies using `get_my_tenant_id()`
5. Include a comment block at the top explaining what the migration does

Example:
```sql
-- Add customer_subscriptions table for customer portal loyalty subscription
-- Customers can subscribe to a monthly plan for priority booking and discount perks.

create table if not exists public.customer_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  plan        text not null check (plan in ('monthly', 'annual')),
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.customer_subscriptions enable row level security;

create policy "tenant_customer_subscriptions_select" on public.customer_subscriptions
  for select to authenticated
  using (tenant_id = get_my_tenant_id());
```

---

## TypeScript Standards

### Strict Mode
All apps and packages use `strict: true`. No exceptions.

### No `any`
Avoid `any`. Use `unknown` if the type is truly unknown, then narrow it:
```typescript
// WRONG
function processEvent(event: any) { ... }

// CORRECT
function processEvent(event: unknown) {
  if (!isStripeEvent(event)) throw new Error('Invalid event');
  // now event is typed
}
```

### Use Generated DB Types
Always use the generated types from `database.types.ts`, not hand-written interfaces:
```typescript
import type { Tables } from '@/types/database.types';
type Tenant = Tables<'tenants'>;
type Customer = Tables<'customers'>;
```

### Server Action Return Type
All server actions must return a discriminated union:
```typescript
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createCustomer(input: unknown): Promise<ActionResult<Customer>> {
  // ...
}
```

### Zod Validation in Actions
```typescript
const schema = z.object({
  full_name: z.string().min(1).max(100),
  phone: z.string(),
});

export async function createCustomer(input: unknown): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid input' };
  const { tenantId } = await getAuthContext();
  // ...
}
```

---

## React / Next.js Patterns

### Server vs Client Components
- Default to **Server Components** — they are zero-JS and fetch data directly
- Use `'use client'` only when you need: `useState`, `useEffect`, event handlers, browser APIs, TanStack Query
- Never fetch data in client components on the first render — pass data from server components as props

### Server Actions vs API Routes
- **Server Actions** — for mutations triggered from form submissions or button clicks
- **API Routes** — for webhooks, public endpoints, and data consumed by external clients

### Data Fetching Pattern
```typescript
// Server Component (preferred)
export default async function CustomersPage() {
  const { tenantId } = await getAuthContext();
  const customers = await getCustomers(tenantId); // direct DB call, no fetch()
  return <CustomerTable customers={customers} />;
}

// Client Component with TanStack Query (for real-time or interactive data)
'use client';
export function QueueBoard({ branchId }: { branchId: string }) {
  const { data } = useQuery({
    queryKey: ['queue', branchId],
    queryFn: () => fetchQueue(branchId),
    refetchInterval: 5000,
  });
}
```

### Error Handling
Never let server actions throw unhandled exceptions to the client. Return structured errors:
```typescript
try {
  // ... operation
  return { success: true, data: result };
} catch (error) {
  console.error('[createCustomer]', error);
  return { success: false, error: 'Failed to create customer' };
}
```

---

## Styling

- **Tailwind CSS** — utility-first, no custom CSS files except `globals.css` for base styles
- **shadcn/ui** — component library. Add components via `pnpm dlx shadcn@latest add [component]`
- **No inline styles** in JSX except for dynamic values that can't be expressed as Tailwind classes
- Design system tokens live in `packages/ui`
- Never hardcode colors — use Tailwind's design token system (`bg-primary`, `text-muted-foreground`, etc.)

---

## Git Workflow

### Branches
- `main` — production-ready code, protected
- `dev` — integration branch for features (optional, use if team grows)
- `feat/[description]` — new features
- `fix/[description]` — bug fixes
- `chore/[description]` — tooling, deps, docs

### Commit Messages (Conventional Commits)
```
feat: add customer loyalty points display
fix: resolve queue board RLS data leakage
chore: update supabase types after migration
docs: update ROADMAP with Phase 2 customer portal
refactor: extract supabase clients to packages/db
```

### Pull Request Checklist
- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm lint:shop` passes with no errors
- [ ] `pnpm build:shop` succeeds locally
- [ ] New DB migrations are tested locally with `supabase db push`
- [ ] TypeScript types regenerated if schema changed
- [ ] Security checklist items verified (see `docs/SECURITY.md`)
- [ ] No secrets or API keys in the diff

---

## Adding a New App to the Monorepo

1. Scaffold the app: `pnpm create next-app apps/[name] --typescript --tailwind --app`
2. Update `package.json` `name` to `@barberpro/[name]`
3. Add workspace scripts to root `package.json`:
   ```json
   "dev:[name]": "pnpm --filter @barberpro/[name] dev",
   "build:[name]": "pnpm --filter @barberpro/[name] build"
   ```
4. Extend `packages/config/tsconfig.base.json` in the app's `tsconfig.json`
5. Add `.env.example` with all required variables documented
6. Add Sentry integration
7. Create a Vercel project linked to this repo with the correct Root Directory set
8. Document the new app in `docs/ARCHITECTURE.md`

---

## Adding a New Shared Package

1. Create `packages/[name]/` with `package.json`, `tsconfig.json`, `src/index.ts`
2. Name it `@barberpro/[name]` in `package.json`
3. Extend `packages/config/tsconfig.base.json`
4. Add it as a workspace dependency in consuming apps: `pnpm --filter @barberpro/web-shop add @barberpro/[name]`
5. Add `"@barberpro/[name]": "workspace:*"` to the consuming app's `package.json`
