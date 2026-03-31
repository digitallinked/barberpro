-- Performance: critical indexes + migrate inline RLS subqueries to get_my_tenant_id()
-- Indexes eliminate full table scans on auth/middleware/RLS hot paths.
-- Switching RLS policies to get_my_tenant_id() lets Postgres cache the result per transaction.

-- ============================================================================
-- 1. Critical indexes
-- ============================================================================

create index if not exists idx_app_users_auth_user_id on public.app_users(auth_user_id);
create index if not exists idx_app_users_tenant_active on public.app_users(tenant_id, is_active);
create index if not exists idx_tenants_owner_auth_id on public.tenants(owner_auth_id);
create index if not exists idx_tenants_slug on public.tenants(slug);
create index if not exists idx_queue_tickets_branch_day on public.queue_tickets(branch_id, queue_day, status);
create index if not exists idx_transactions_branch_paid on public.transactions(branch_id, paid_at);
create index if not exists idx_transaction_items_transaction on public.transaction_items(transaction_id);
create index if not exists idx_transaction_items_staff on public.transaction_items(staff_profile_id);
create index if not exists idx_staff_attendance_staff_date on public.staff_attendance(staff_id, date);
create index if not exists idx_payroll_entries_period on public.payroll_entries(payroll_period_id, staff_profile_id);

-- ============================================================================
-- 2. Migrate branch_seats RLS policies to use get_my_tenant_id()
-- ============================================================================

drop policy if exists "tenant_branch_seats_select" on public.branch_seats;
create policy "tenant_branch_seats_select" on public.branch_seats
  for select to authenticated
  using (tenant_id = get_my_tenant_id());

drop policy if exists "tenant_branch_seats_insert" on public.branch_seats;
create policy "tenant_branch_seats_insert" on public.branch_seats
  for insert to authenticated
  with check (tenant_id = get_my_tenant_id());

drop policy if exists "tenant_branch_seats_update" on public.branch_seats;
create policy "tenant_branch_seats_update" on public.branch_seats
  for update to authenticated
  using (tenant_id = get_my_tenant_id());

drop policy if exists "tenant_branch_seats_delete" on public.branch_seats;
create policy "tenant_branch_seats_delete" on public.branch_seats
  for delete to authenticated
  using (tenant_id = get_my_tenant_id());

-- ============================================================================
-- 3. Migrate queue_ticket_seats RLS policies to use get_my_tenant_id()
-- ============================================================================

drop policy if exists "tenant_queue_ticket_seats_select" on public.queue_ticket_seats;
create policy "tenant_queue_ticket_seats_select" on public.queue_ticket_seats
  for select to authenticated
  using (tenant_id = get_my_tenant_id());

drop policy if exists "tenant_queue_ticket_seats_insert" on public.queue_ticket_seats;
create policy "tenant_queue_ticket_seats_insert" on public.queue_ticket_seats
  for insert to authenticated
  with check (tenant_id = get_my_tenant_id());

drop policy if exists "tenant_queue_ticket_seats_update" on public.queue_ticket_seats;
create policy "tenant_queue_ticket_seats_update" on public.queue_ticket_seats
  for update to authenticated
  using (tenant_id = get_my_tenant_id());

drop policy if exists "tenant_queue_ticket_seats_delete" on public.queue_ticket_seats;
create policy "tenant_queue_ticket_seats_delete" on public.queue_ticket_seats
  for delete to authenticated
  using (tenant_id = get_my_tenant_id());

-- ============================================================================
-- 4. Migrate staff_attendance RLS policies to use get_my_tenant_id()
-- ============================================================================

drop policy if exists "tenant_staff_attendance_select" on public.staff_attendance;
create policy "tenant_staff_attendance_select" on public.staff_attendance
  for select to authenticated
  using (tenant_id = get_my_tenant_id());

drop policy if exists "tenant_staff_attendance_insert" on public.staff_attendance;
create policy "tenant_staff_attendance_insert" on public.staff_attendance
  for insert to authenticated
  with check (tenant_id = get_my_tenant_id());

drop policy if exists "tenant_staff_attendance_update" on public.staff_attendance;
create policy "tenant_staff_attendance_update" on public.staff_attendance
  for update to authenticated
  using (tenant_id = get_my_tenant_id());

drop policy if exists "tenant_staff_attendance_delete" on public.staff_attendance;
create policy "tenant_staff_attendance_delete" on public.staff_attendance
  for delete to authenticated
  using (tenant_id = get_my_tenant_id());

-- ============================================================================
-- 5. Drop the old overly-permissive anon policies created in branch_seats migration
--    (the security_hardening migration already created properly scoped replacements)
-- ============================================================================

drop policy if exists "anon_read_branch_seats" on public.branch_seats;
drop policy if exists "anon_read_queue_tickets" on public.queue_tickets;
