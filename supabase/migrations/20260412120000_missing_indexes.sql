-- Missing indexes migration
-- Adds composite indexes for common filter patterns and FK indexes
-- that were not covered by earlier migrations.

-- ─── (tenant_id, branch_id) composites ───────────────────────────────────────
-- These columns are always queried together when RLS scopes by tenant and the
-- app filters by branch.

create index if not exists idx_branch_seats_tenant_branch
  on public.branch_seats(tenant_id, branch_id);

create index if not exists idx_staff_attendance_tenant_branch
  on public.staff_attendance(tenant_id, branch_id);

create index if not exists idx_branch_images_tenant_branch
  on public.branch_images(tenant_id, branch_id);


-- ─── FK columns without dedicated indexes (child-side) ───────────────────────
-- Without these, lookups from the parent side (e.g. finding all seats for a
-- ticket) require a sequential scan on queue_ticket_seats.

create index if not exists idx_queue_ticket_seats_ticket_id
  on public.queue_ticket_seats(ticket_id);

create index if not exists idx_queue_ticket_seats_seat_id
  on public.queue_ticket_seats(seat_id);

create index if not exists idx_queue_ticket_seats_staff_id
  on public.queue_ticket_seats(staff_id);


-- ─── Customer lookup paths ────────────────────────────────────────────────────
-- Customers are looked up by (tenant_id, phone) in web-customer checkin,
-- queue join, and review eligibility checks.

create index if not exists idx_customers_tenant_phone
  on public.customers(tenant_id, phone);


-- ─── Appointments by date and status ─────────────────────────────────────────
-- Appointments are almost always filtered by branch + time range + status.
-- The partial on status values covers the "upcoming / pending" query pattern.

create index if not exists idx_appointments_branch_start
  on public.appointments(branch_id, start_at, status);


-- ─── Expenses by date and payroll period ─────────────────────────────────────
-- Expenses report queries filter by branch and expense_date range.
-- The partial index covers the payroll-linked expense lookup without scanning
-- all expenses (most rows have payroll_period_id = null).

create index if not exists idx_expenses_branch_date
  on public.expenses(branch_id, expense_date);

create index if not exists idx_expenses_payroll_period
  on public.expenses(payroll_period_id)
  where payroll_period_id is not null;


-- ─── Transactions by tenant + date (dashboard / reports RPC) ─────────────────
-- report_revenue_summary and report_daily_revenue filter by tenant + created_at.
-- The RPC now does this aggregation in SQL; the index makes it fast.

create index if not exists idx_transactions_tenant_created
  on public.transactions(tenant_id, created_at)
  where payment_status = 'paid';
