-- Security hardening: webhook idempotency + queue board RLS scoping
-- 1. Add processed_webhook_events table for Stripe webhook deduplication
-- 2. Tighten anon RLS policies on queue board tables to active branches only

-- 1. Webhook idempotency table
create table if not exists public.processed_webhook_events (
  id         uuid primary key default gen_random_uuid(),
  event_id   text not null unique,
  event_type text not null,
  created_at timestamptz not null default now()
);

alter table public.processed_webhook_events enable row level security;

-- Only service role (admin client) writes to this table — no authenticated/anon policies needed.
-- Auto-cleanup: events older than 30 days can be purged via cron.

-- 2. Drop overly permissive anon policies and replace with scoped versions

-- queue_tickets
drop policy if exists "public_queue_tickets_board_select" on public.queue_tickets;
create policy "public_queue_tickets_board_select" on public.queue_tickets
  for select to anon
  using (
    branch_id in (select id from public.branches where is_active = true)
  );

-- queue_ticket_seats
drop policy if exists "public_queue_ticket_seats_board_select" on public.queue_ticket_seats;
create policy "public_queue_ticket_seats_board_select" on public.queue_ticket_seats
  for select to anon
  using (
    queue_ticket_id in (
      select qt.id from public.queue_tickets qt
      where qt.branch_id in (select id from public.branches where is_active = true)
    )
  );

-- branch_seats
drop policy if exists "public_branch_seats_board_select" on public.branch_seats;
create policy "public_branch_seats_board_select" on public.branch_seats
  for select to anon
  using (
    branch_id in (select id from public.branches where is_active = true)
  );

-- branches: only allow reading active branches for anon
drop policy if exists "public_branches_board_select" on public.branches;
create policy "public_branches_board_select" on public.branches
  for select to anon
  using (is_active = true);
