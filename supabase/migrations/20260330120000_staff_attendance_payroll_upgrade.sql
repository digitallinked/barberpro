-- Staff attendance tracking + payroll entries upgrade.
-- Adds clock-in/out attendance records per staff per day,
-- and extends payroll_entries with revenue/attendance metadata
-- so commissions can be auto-calculated from transaction data.

-- 1. staff_attendance table
create table if not exists public.staff_attendance (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  staff_id     uuid not null references public.staff_profiles(id) on delete cascade,
  branch_id    uuid references public.branches(id) on delete set null,
  date         date not null,
  clock_in     timestamptz,
  clock_out    timestamptz,
  status       text not null default 'present'
               check (status in ('present', 'absent', 'late', 'half_day', 'leave')),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint uq_staff_attendance_day unique (tenant_id, staff_id, date)
);

alter table public.staff_attendance enable row level security;

create policy "tenant_staff_attendance_select" on public.staff_attendance
  for select to authenticated
  using (
    tenant_id = (
      select au.tenant_id from public.app_users au
      where au.auth_user_id = auth.uid() and au.is_active = true limit 1
    )
  );

create policy "tenant_staff_attendance_insert" on public.staff_attendance
  for insert to authenticated
  with check (
    tenant_id = (
      select au.tenant_id from public.app_users au
      where au.auth_user_id = auth.uid() and au.is_active = true limit 1
    )
  );

create policy "tenant_staff_attendance_update" on public.staff_attendance
  for update to authenticated
  using (
    tenant_id = (
      select au.tenant_id from public.app_users au
      where au.auth_user_id = auth.uid() and au.is_active = true limit 1
    )
  );

create policy "tenant_staff_attendance_delete" on public.staff_attendance
  for delete to authenticated
  using (
    tenant_id = (
      select au.tenant_id from public.app_users au
      where au.auth_user_id = auth.uid() and au.is_active = true limit 1
    )
  );

-- 2. Extend payroll_entries with revenue/attendance metadata
alter table public.payroll_entries
  add column if not exists days_worked integer,
  add column if not exists total_working_days integer,
  add column if not exists service_revenue numeric default 0,
  add column if not exists product_revenue numeric default 0,
  add column if not exists services_count integer default 0,
  add column if not exists customers_served integer default 0;
