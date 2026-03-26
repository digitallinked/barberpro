-- queue_ticket_seats: individual seat/barber/service assignments within a group queue ticket.
-- Each row = one person in the party (parent, child, friend) getting their cut.
-- This allows a single Q-number (party) to flow through different seats/barbers
-- as they become available, with commission tracked per barber per cut.

create table if not exists public.queue_ticket_seats (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  ticket_id    uuid not null references public.queue_tickets(id) on delete cascade,
  seat_id      uuid references public.branch_seats(id) on delete set null,
  staff_id     uuid references public.staff_profiles(id) on delete set null,
  service_id   uuid references public.services(id) on delete set null,
  status       text not null default 'in_service'
               check (status in ('in_service', 'completed', 'cancelled')),
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.queue_ticket_seats enable row level security;

create policy "tenant_queue_ticket_seats_select" on public.queue_ticket_seats
  for select to authenticated
  using (
    tenant_id = (
      select au.tenant_id from public.app_users au
      where au.auth_user_id = auth.uid() and au.is_active = true limit 1
    )
  );

create policy "tenant_queue_ticket_seats_insert" on public.queue_ticket_seats
  for insert to authenticated
  with check (
    tenant_id = (
      select au.tenant_id from public.app_users au
      where au.auth_user_id = auth.uid() and au.is_active = true limit 1
    )
  );

create policy "tenant_queue_ticket_seats_update" on public.queue_ticket_seats
  for update to authenticated
  using (
    tenant_id = (
      select au.tenant_id from public.app_users au
      where au.auth_user_id = auth.uid() and au.is_active = true limit 1
    )
  );

create policy "tenant_queue_ticket_seats_delete" on public.queue_ticket_seats
  for delete to authenticated
  using (
    tenant_id = (
      select au.tenant_id from public.app_users au
      where au.auth_user_id = auth.uid() and au.is_active = true limit 1
    )
  );

-- Enable realtime so the queue page updates live when a member is seated.
alter publication supabase_realtime add table public.queue_ticket_seats;
