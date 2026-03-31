# Database Schema

BarberPro uses a single **Supabase (PostgreSQL)** project. All multi-tenancy is enforced through **Row Level Security (RLS)** — every table (except public read surfaces) scopes access to the authenticated user's tenant.

---

## Core Principle: Tenant Isolation

Every table carries a `tenant_id UUID` foreign key referencing `tenants.id`. RLS policies use the `get_my_tenant_id()` DB function to scope all reads and writes:

```sql
-- Standard RLS pattern used on every authenticated table
create policy "tenant_[table]_select" on public.[table]
  for select to authenticated
  using (tenant_id = get_my_tenant_id());
```

**Never repeat the subquery inline.** Always use the function — Postgres caches the result within a transaction, so the DB lookup runs once regardless of row count.

---

## Entity Relationship Overview

```
tenants
  ├── branches (1:many)
  │     └── branch_seats (1:many)
  ├── app_users (1:many) — owners, managers, barbers, cashiers
  ├── staff_profiles (1:many) — barber details, linked to app_users
  │     ├── staff_commission_assignments (1:many)
  │     └── staff_attendance (1:many)
  ├── commission_schemes (1:many)
  ├── service_categories (1:many)
  ├── services (1:many)
  ├── customers (1:many)
  │     └── appointments (1:many)
  ├── queue_tickets (1:many) — one per customer visit day
  │     └── queue_ticket_seats (1:many)
  ├── transactions (1:many) — POS sales
  │     └── transaction_items (1:many)
  ├── inventory_items (1:many)
  │     └── inventory_movements (1:many)
  ├── expenses (1:many)
  ├── suppliers (1:many)
  ├── payroll_periods (1:many)
  └── payroll_entries (1:many)
```

---

## Tables

### `tenants`
The root entity. One row per barber shop account (operator).

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Tenant identifier |
| `name` | text | Shop display name |
| `slug` | text UNIQUE | URL-safe identifier (e.g. `kedai-ali`) |
| `owner_auth_id` | uuid | Supabase `auth.users.id` of the account owner |
| `onboarding_completed` | boolean | Whether setup wizard has been completed |
| `plan` | text | `starter`, `professional`, `enterprise` |
| `status` | text | `active`, `suspended`, `churned` |
| `stripe_customer_id` | text | Stripe Customer ID |
| `stripe_subscription_id` | text | Stripe Subscription ID |
| `stripe_price_id` | text | Currently active Stripe Price ID |
| `subscription_status` | text | Mirror of Stripe subscription status (`trialing`, `active`, `past_due`, `canceled`, etc.) |
| `trial_ends_at` | timestamptz | When the trial period ends |
| `timezone` | text | Shop timezone (default: `Asia/Kuala_Lumpur`) |
| `preferred_language` | text | `en`, `ms`, `zh` |
| `address` | text | Physical address |
| `city` | text | City |
| `state` | text | State |
| `postcode` | text | Postcode |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Access control:** Owners can read/update their own row. Super admins can read all rows.

---

### `branches`
Physical locations belonging to a tenant. Starter plan: 1 branch. Professional: up to 5. Enterprise: unlimited.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `name` | text | Branch display name |
| `code` | text | Short code used in reports (e.g. `KL-01`) |
| `is_hq` | boolean | Whether this is the main/headquarters branch |
| `is_active` | boolean | Soft-delete flag |
| `address` | text | |
| `phone` | text | |
| `email` | text | |
| `operating_hours` | jsonb | `{ mon: { open: "09:00", close: "20:00" }, ... }` |
| `checkin_token` | text UNIQUE | Token for QR code self-check-in URL |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `branch_seats`
Physical barber chairs/workstations within a branch.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `branch_id` | uuid FK → branches | |
| `seat_number` | integer | Display number (1, 2, 3...) |
| `label` | text | Display label (e.g. `Chair 1`, `Seat A`) |
| `staff_profile_id` | uuid FK → staff_profiles | Barber currently assigned to this seat |
| `is_active` | boolean | Whether the seat is in use |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `app_users`
Platform users — anyone who logs into `shop.barberpro.my`. Links Supabase Auth users to tenant roles.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | Null only for super admins |
| `auth_user_id` | uuid | Supabase `auth.users.id` |
| `branch_id` | uuid FK → branches | Default branch for this user |
| `role` | text | `owner`, `manager`, `barber`, `cashier` |
| `full_name` | text | |
| `email` | text | |
| `phone` | text | |
| `is_active` | boolean | Whether the account is active |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Note:** Super admins have no `tenant_id`. The `is_super_admin()` DB function identifies them separately.

---

### `staff_profiles`
Extended barber/staff details. Separate from `app_users` because some staff may not have a login account (owner may manage their profile).

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `app_user_id` | uuid FK → app_users | Nullable — staff without a login |
| `full_name` | text | |
| `phone` | text | |
| `email` | text | |
| `specialty` | text | Primary specialty (e.g. `Fade`, `Beard`) |
| `bio` | text | Short bio for customer-facing profiles |
| `avatar_url` | text | Supabase Storage URL |
| `is_active` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `commission_schemes`
Named commission calculation rules. Each barber can be assigned one scheme.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `name` | text | e.g. `Senior Barber` |
| `payout_model` | text | `percentage`, `per_service`, `per_customer`, `base_plus_target` |
| `percentage_rate` | numeric | % of service revenue (when `payout_model = percentage`) |
| `per_service_amount` | numeric | Fixed amount per service rendered |
| `per_customer_amount` | numeric | Fixed amount per customer served |
| `base_salary` | numeric | Base monthly salary |
| `product_commission_rate` | numeric | % commission on retail product sales |
| `target_bonus_rules` | jsonb | `[{ target: 50, bonus: 200 }, ...]` |
| `deduction_rules` | jsonb | `[{ type: "absence", amount: 50 }, ...]` |
| `is_active` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `staff_commission_assignments`
Links staff to their active commission scheme.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `staff_profile_id` | uuid FK → staff_profiles | |
| `commission_scheme_id` | uuid FK → commission_schemes | |
| `effective_from` | date | When this assignment starts |
| `effective_to` | date | When this assignment ends (null = current) |
| `created_at` | timestamptz | |

---

### `staff_attendance`
Clock-in/out records per staff per day.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `staff_id` | uuid FK → staff_profiles | |
| `branch_id` | uuid FK → branches | |
| `date` | date | Work date |
| `clock_in` | timestamptz | |
| `clock_out` | timestamptz | |
| `status` | text | `present`, `absent`, `late`, `half_day`, `leave` |
| `notes` | text | Manager notes |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Constraint:** `UNIQUE (tenant_id, staff_id, date)` — one record per staff per day.

---

### `service_categories`
Groupings for services (e.g. `Haircut`, `Beard`, `Treatment`).

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `name` | text | |
| `sort_order` | integer | Display ordering |
| `is_active` | boolean | |
| `created_at` | timestamptz | |

---

### `services`
Services offered by the shop (menu items).

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `category_id` | uuid FK → service_categories | |
| `name` | text | e.g. `Classic Cut` |
| `description` | text | |
| `price` | numeric | Base price |
| `duration_minutes` | integer | Estimated service duration |
| `is_active` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `customers`
End customer profiles as seen by the shop (their CRM).

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `branch_id` | uuid FK → branches | Primary branch |
| `full_name` | text | |
| `phone` | text | Primary identifier |
| `email` | text | |
| `date_of_birth` | date | For birthday promotions |
| `preferred_barber_id` | uuid FK → staff_profiles | |
| `loyalty_points` | integer | Current points balance |
| `notes` | text | Manager/barber notes |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Note:** `customers` is the shop's CRM record. Future: link to `customer_accounts` table for portal login.

---

### `queue_tickets`
One ticket per customer visit per day. The central entity for queue management.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `branch_id` | uuid FK → branches | |
| `customer_id` | uuid FK → customers | Nullable (anonymous walk-in) |
| `ticket_number` | integer | Sequential per branch per day (e.g. `42`) |
| `queue_day` | date | The calendar day this ticket belongs to |
| `party_size` | integer | Number of people in the group |
| `status` | text | `waiting`, `serving`, `done`, `paid`, `cancelled`, `no_show` |
| `notes` | text | Special requests |
| `source` | text | `walk_in`, `check_in_kiosk`, `online`, `phone` |
| `checked_in_at` | timestamptz | When customer arrived/checked in |
| `called_at` | timestamptz | When they were called to a seat |
| `served_at` | timestamptz | When service started |
| `completed_at` | timestamptz | When service finished |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Constraint:** `UNIQUE (branch_id, ticket_number, queue_day)` — ticket numbers are unique per branch per day and reset daily.

---

### `queue_ticket_seats`
Maps queue tickets to specific seats/barbers (supports party check-in with multiple seats).

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `queue_ticket_id` | uuid FK → queue_tickets | |
| `branch_seat_id` | uuid FK → branch_seats | Which physical seat |
| `staff_profile_id` | uuid FK → staff_profiles | Which barber is serving |
| `service_ids` | uuid[] | Services for this person in the party |
| `status` | text | `waiting`, `serving`, `done` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `appointments`
Pre-scheduled bookings (vs walk-in queue tickets).

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `branch_id` | uuid FK → branches | |
| `customer_id` | uuid FK → customers | |
| `barber_staff_id` | uuid FK → staff_profiles | Assigned barber |
| `service_id` | uuid FK → services | Primary service |
| `start_at` | timestamptz | |
| `end_at` | timestamptz | |
| `status` | text | `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show` |
| `source` | text | `online`, `walk_in`, `phone` |
| `notes` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `transactions`
POS sales records — one transaction per customer visit payment.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `branch_id` | uuid FK → branches | |
| `customer_id` | uuid FK → customers | Nullable |
| `queue_ticket_id` | uuid FK → queue_tickets | Links payment to queue visit |
| `cashier_user_id` | uuid FK → app_users | Who processed the payment |
| `payment_method` | text | `cash`, `card`, `qr`, `ewallet`, `mixed` |
| `payment_status` | text | `pending`, `paid`, `refunded` |
| `subtotal` | numeric | Before discount and tax |
| `discount_amount` | numeric | |
| `tax_amount` | numeric | SST if applicable |
| `total_amount` | numeric | Final amount paid |
| `paid_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `transaction_items`
Line items within a transaction (services rendered, products sold).

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `transaction_id` | uuid FK → transactions | |
| `item_type` | text | `service`, `product` |
| `service_id` | uuid FK → services | Nullable |
| `inventory_item_id` | uuid FK → inventory_items | Nullable |
| `staff_profile_id` | uuid FK → staff_profiles | Who performed/sold this item |
| `description` | text | Display name at time of sale |
| `unit_price` | numeric | |
| `quantity` | integer | |
| `total_price` | numeric | |
| `created_at` | timestamptz | |

---

### `inventory_items`
Products and supplies tracked in inventory.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `branch_id` | uuid FK → branches | Nullable — shared across branches |
| `supplier_id` | uuid FK → suppliers | |
| `item_type` | text | `product` (retail), `supply` (internal use) |
| `name` | text | |
| `sku` | text | Stock keeping unit |
| `stock_qty` | numeric | Current quantity on hand |
| `unit_cost` | numeric | Cost per unit |
| `sell_price` | numeric | Retail price (for products) |
| `reorder_level` | numeric | Alert when stock falls below this |
| `is_active` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `inventory_movements`
Audit trail for all stock changes.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `inventory_item_id` | uuid FK → inventory_items | |
| `movement_type` | text | `received`, `sold`, `wasted`, `adjusted`, `transferred` |
| `quantity` | numeric | Positive = in, negative = out |
| `reference_id` | uuid | Optional link to transaction or purchase |
| `notes` | text | |
| `created_by` | uuid FK → app_users | |
| `created_at` | timestamptz | |

---

### `suppliers`
Vendors from whom inventory is purchased.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `name` | text | |
| `contact_name` | text | |
| `phone` | text | |
| `email` | text | |
| `address` | text | |
| `notes` | text | |
| `is_active` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `expenses`
Non-inventory business expenses (rent, utilities, equipment, etc.).

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `branch_id` | uuid FK → branches | |
| `supplier_id` | uuid FK → suppliers | |
| `category` | text | `rent`, `utilities`, `supplies`, `equipment`, `marketing`, `other` |
| `vendor` | text | Free-text vendor name if no supplier record |
| `amount` | numeric | |
| `payment_method` | text | |
| `expense_date` | date | |
| `status` | text | `pending`, `paid` |
| `notes` | text | |
| `created_by` | uuid FK → app_users | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `payroll_periods`
Pay period definitions (monthly, bi-weekly, etc.).

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `name` | text | e.g. `March 2026` |
| `period_start` | date | |
| `period_end` | date | |
| `status` | text | `draft`, `approved`, `paid` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `payroll_entries`
Per-staff payroll record for a given period.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `payroll_period_id` | uuid FK → payroll_periods | |
| `staff_profile_id` | uuid FK → staff_profiles | |
| `base_salary` | numeric | |
| `total_service_revenue` | numeric | Revenue generated by this staff in the period |
| `total_customers_served` | integer | |
| `commission_amount` | numeric | Calculated commission |
| `bonus_amount` | numeric | Target bonus if achieved |
| `deductions` | numeric | Absences, fines, etc. |
| `net_pay` | numeric | Final payout amount |
| `attendance_days` | integer | Days present in period |
| `notes` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## Database Functions

| Function | Returns | Description |
|---|---|---|
| `get_my_tenant_id()` | uuid | Returns `tenant_id` for the currently authenticated user via `app_users`. Used in every RLS policy. Cached per transaction. |
| `get_my_owned_tenant_ids()` | uuid[] | Returns array of tenant IDs the current user owns (via `tenants.owner_auth_id`). |
| `is_super_admin()` | boolean | Returns true if the current auth user has super-admin privileges. |
| `current_tenant_id()` | uuid | Alias for `get_my_tenant_id()`. |
| `current_role()` | text | Returns the current user's role from `app_users`. |
| `link_auth_user_by_email(p_email, p_role?, p_tenant_slug?)` | uuid | Links an existing Supabase auth user to an `app_users` row by email. Used during staff invitation flow. |

---

## Realtime Publications

The following tables have Supabase Realtime enabled (via `supabase_realtime` publication):

| Table | Why |
|---|---|
| `queue_tickets` | Queue board live updates |
| `queue_ticket_seats` | Seat assignment live updates |
| `branch_seats` | Seat configuration changes |

---

## Migration Conventions

1. Migration files live in `supabase/migrations/` named `{timestamp}_{description}.sql`
2. Timestamp format: `YYYYMMDDHHMMSS` (e.g. `20260331120000`)
3. **Never edit an existing migration file** — create a new one instead
4. Every new table must have:
   - `id uuid primary key default gen_random_uuid()`
   - `tenant_id uuid not null references public.tenants(id) on delete cascade`
   - `created_at timestamptz not null default now()`
   - `updated_at timestamptz not null default now()`
   - `enable row level security`
   - RLS policies for `select`, `insert`, `update`, `delete` using `get_my_tenant_id()`
5. After every migration: `pnpm supabase gen types typescript --local > apps/web-shop/src/types/database.types.ts`

---

## Required Indexes (Production)

```sql
-- Critical — hit on every middleware request and every RLS policy
create index if not exists idx_app_users_auth_user_id on public.app_users(auth_user_id);
create index if not exists idx_app_users_tenant_active on public.app_users(tenant_id, is_active);

-- Critical — hit on every middleware tenant gate
create index if not exists idx_tenants_owner_auth_id on public.tenants(owner_auth_id);
create index if not exists idx_tenants_slug on public.tenants(slug);

-- Queue board performance
create index if not exists idx_queue_tickets_branch_day on public.queue_tickets(branch_id, queue_day, status);

-- POS and reporting
create index if not exists idx_transactions_branch_paid on public.transactions(branch_id, paid_at);
create index if not exists idx_transaction_items_transaction on public.transaction_items(transaction_id);
create index if not exists idx_transaction_items_staff on public.transaction_items(staff_profile_id);

-- Staff performance queries
create index if not exists idx_staff_attendance_staff_date on public.staff_attendance(staff_id, date);
create index if not exists idx_payroll_entries_period on public.payroll_entries(payroll_period_id, staff_profile_id);
```
