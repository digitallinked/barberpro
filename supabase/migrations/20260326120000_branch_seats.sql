-- Branch seats: physical barber chairs/stations in a shop.
-- Each seat can be assigned to a barber and linked to a queue ticket when service starts.

create table if not exists public.branch_seats (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  branch_id        uuid not null references public.branches(id) on delete cascade,
  seat_number      integer not null,
  label            text not null default '',
  staff_profile_id uuid references public.staff_profiles(id) on delete set null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (branch_id, seat_number)
);

alter table public.branch_seats enable row level security;

-- Authenticated staff can read/write their own tenant's seats.
create policy "tenant_branch_seats_select" on public.branch_seats
  for select to authenticated
  using (
    tenant_id = (
      select au.tenant_id from public.app_users au
      where au.auth_user_id = auth.uid() and au.is_active = true
      limit 1
    )
  );

create policy "tenant_branch_seats_insert" on public.branch_seats
  for insert to authenticated
  with check (
    tenant_id = (
      select au.tenant_id from public.app_users au
      where au.auth_user_id = auth.uid() and au.is_active = true
      limit 1
    )
  );

create policy "tenant_branch_seats_update" on public.branch_seats
  for update to authenticated
  using (
    tenant_id = (
      select au.tenant_id from public.app_users au
      where au.auth_user_id = auth.uid() and au.is_active = true
      limit 1
    )
  );

create policy "tenant_branch_seats_delete" on public.branch_seats
  for delete to authenticated
  using (
    tenant_id = (
      select au.tenant_id from public.app_users au
      where au.auth_user_id = auth.uid() and au.is_active = true
      limit 1
    )
  );

-- Allow anon to read seats (needed for customer check-in page to show seat label).
create policy "anon_read_branch_seats" on public.branch_seats
  for select to anon
  using (true);

-- Add seat reference to queue tickets.
alter table public.queue_tickets
  add column if not exists seat_id uuid references public.branch_seats(id) on delete set null;

-- Allow anon to read queue tickets by branch (needed for realtime customer page).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'queue_tickets'
      and policyname = 'anon_read_queue_tickets'
  ) then
    execute $policy$
      create policy "anon_read_queue_tickets" on public.queue_tickets
        for select to anon
        using (true)
    $policy$;
  end if;
end $$;

-- Enable realtime for live customer page updates.
alter publication supabase_realtime add table public.queue_tickets;
alter publication supabase_realtime add table public.branch_seats;
