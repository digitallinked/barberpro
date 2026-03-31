# Security Guidelines

Security is a first-class concern. BarberPro handles business financial data, staff personal information, and customer PII. This document defines the rules and patterns every contributor must follow.

---

## Tenant Isolation (Most Critical)

Every piece of data belongs to a tenant. The database enforces this through RLS, but the application layer must never assume RLS is the only guard.

### Rules

1. **Always use `get_my_tenant_id()` in RLS policies** — never inline the subquery
   ```sql
   -- CORRECT
   using (tenant_id = get_my_tenant_id())

   -- WRONG — inline subquery, not cached per transaction
   using (tenant_id = (select au.tenant_id from app_users au where au.auth_user_id = auth.uid() limit 1))
   ```

2. **Always pass `tenantId` explicitly in server actions** — never derive it from user input
   ```typescript
   // CORRECT
   const { tenantId } = await getAuthContext();
   await supabase.from('customers').insert({ tenant_id: tenantId, ...data });

   // WRONG — never trust tenant_id from the client/form
   await supabase.from('customers').insert({ tenant_id: req.body.tenant_id, ...data });
   ```

3. **Never expose cross-tenant data in API responses** — even if the query "accidentally" works, verify the returned `tenant_id` matches the authenticated tenant

4. **RLS must be enabled on every table** — run `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in every migration

---

## Authentication

### Server Actions

All server actions must call `getAuthContext()` as the first line. This verifies the Supabase session and returns a verified `tenantId` from the database:

```typescript
// apps/web/src/actions/_helpers.ts
export async function getAuthContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  // ... resolves tenantId from app_users
}
```

**Never use `supabase.auth.getSession()` for security checks** — sessions are stored in cookies and can be forged. Always use `supabase.auth.getUser()` which validates the JWT with the Supabase server.

### API Routes

Public API routes (no auth required): queue board, check-in, Stripe webhook only.
All other API routes must verify authentication before any DB access.

```typescript
// API route auth pattern
const supabase = createAdminClient(); // service role for public routes
// OR
const { tenantId } = await getAuthContext(); // session-based for authenticated routes
```

### Middleware

Middleware session refresh uses `supabase.auth.getUser()` (not `getSession()`), which is correct. Keep it this way.

---

## Stripe Webhook Security

### Signature Verification
Always verify the Stripe webhook signature before processing any event:
```typescript
event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET!);
```

Never skip this. A missing or invalid signature must return 400.

### Use Admin Client
Stripe webhooks have no user session. Always use `createAdminClient()` (service role) for DB writes in the webhook handler:
```typescript
// CORRECT
const supabase = createAdminClient();

// WRONG — createClient() returns a session-based client; there's no session in a webhook
const supabase = await createClient();
```

### Idempotency
Store processed Stripe event IDs to prevent double-processing on retries:
```typescript
// Before processing, check if event was already handled
const { data: existing } = await supabase
  .from('processed_webhook_events')
  .select('id')
  .eq('event_id', event.id)
  .maybeSingle();

if (existing) return NextResponse.json({ received: true });
// ... process event
// ... insert event.id into processed_webhook_events
```

### Respond Fast
Stripe requires a response within 5 seconds. For complex processing, write the event to a queue/table immediately, return 200, and process asynchronously.

---

## Public RLS Policies

Some tables allow anonymous reads (queue board, check-in kiosk). These policies must be as narrow as possible.

### Current Issue (Fix Required)
The queue board policies use `using (true)` which exposes ALL tenants' data:
```sql
-- WRONG — exposes all tenants' queue data to anyone
create policy "public_queue_tickets_board_select" on public.queue_tickets
  for select to anon using (true);
```

### Correct Pattern
Scope to active/public branches only:
```sql
-- CORRECT — scope to branches that are active
create policy "public_queue_tickets_board_select" on public.queue_tickets
  for select to anon
  using (
    branch_id in (select id from public.branches where is_active = true)
  );
```

The application layer (API route) still filters by `branch_id` parameter, but this ensures the DB-level policy provides a real security boundary.

---

## Super Admin Access

### Use `is_super_admin()` DB function
```typescript
// web-admin middleware
const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');
if (!isSuperAdmin) return redirect('/login');
```

### Use Service Role for Admin Queries
The super admin console must use the service role (admin client) to bypass RLS when reading across all tenants:
```typescript
// Only in apps/web-admin — never in apps/web
const supabase = createAdminClient();
const { data: allTenants } = await supabase.from('tenants').select('*');
```

### Never Expose Service Role Key to Client
`SUPABASE_SERVICE_ROLE_KEY` must only ever be used in:
- Server components / server actions
- API route handlers
- The `createAdminClient()` helper

It must never appear in any `NEXT_PUBLIC_*` environment variable.

---

## Environment Variables

### Required for Production `apps/web`

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | `https://shop.barberpro.my` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Safe to expose — restricted by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **Never expose to client** |
| `STRIPE_SECRET_KEY` | Yes | **Never expose to client** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Safe to expose |
| `STRIPE_WEBHOOK_SECRET` | Yes | **Never expose to client** |
| `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID` | Yes | Stripe Price ID |
| `NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID` | Yes | Stripe Price ID |

### Rules
- All secret keys (`STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`) must **never** be committed to the repository
- Use Vercel's environment variable UI to inject secrets at build/runtime
- Never log secret values — use structured logging that redacts sensitive fields
- Rotate keys immediately if they are ever accidentally exposed

---

## File Uploads

Receipt photos and other uploads must go **directly to Supabase Storage** from the client using presigned URLs — never through a Next.js server action.

```typescript
// WRONG — routes up to 8MB through Next.js function
async function uploadReceiptAction(formData: FormData) {
  const file = formData.get('file') as File;
  // ...
}

// CORRECT — client gets a presigned URL, uploads directly to storage
async function getUploadUrl(fileName: string) {
  const { data } = await supabase.storage
    .from('receipts')
    .createSignedUploadUrl(`${tenantId}/${fileName}`);
  return data?.signedUrl;
}
```

Storage bucket policies must scope access to the authenticated tenant's folder:
```sql
-- Bucket: receipts
-- Allow authenticated users to read/write their own tenant folder only
create policy "tenant_receipts_access" on storage.objects
  for all to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = get_my_tenant_id()::text);
```

---

## Input Validation

### Server Actions
All server actions must validate input with Zod before any DB operation:
```typescript
const schema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^(\+?60|0)\d{8,10}$/),
  amount: z.number().positive(),
});

const parsed = schema.safeParse(input);
if (!parsed.success) return { error: 'Invalid input' };
```

### API Routes
Same rule — validate query parameters and request bodies before use.

---

## Security Checklist (Per Feature)

Before shipping any new feature, verify:

- [ ] New tables have RLS enabled with `get_my_tenant_id()` policies
- [ ] Server actions call `getAuthContext()` and use the returned `tenantId`
- [ ] No secret env vars referenced in client-side code (`NEXT_PUBLIC_*`)
- [ ] User input validated with Zod before DB access
- [ ] File uploads go to storage directly, not through server actions
- [ ] New API routes that require auth check the session before any DB access
- [ ] No `console.log` of sensitive data (IDs, emails, tokens) in production code

---

## Incident Response

If a security issue is discovered:

1. **Assess scope** — which tenants are affected, what data was exposed
2. **Contain** — disable the affected endpoint or rotate the compromised credential immediately
3. **Fix and deploy** — do not wait; push a fix to production
4. **Notify affected tenants** — if customer data was exposed, notify within 72 hours (PDPA Malaysia requirement)
5. **Post-mortem** — document what happened and how to prevent recurrence
6. **Do not commit secrets to git** — if a secret is in git history, rotate it immediately, then clean the history
