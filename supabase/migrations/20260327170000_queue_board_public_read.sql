-- Queue board public read access
-- The queue board is a public display screen shown in the barbershop lobby.
-- Walk-in customers (unauthenticated) need to read live queue/seat data.
-- These are SELECT-only policies with no write access.

-- queue_tickets: allow anon SELECT so the board can read today's queue
create policy "public_queue_tickets_board_select" on public.queue_tickets
  for select to anon
  using (true);

-- queue_ticket_seats: allow anon SELECT so the board can match seats to queue numbers
create policy "public_queue_ticket_seats_board_select" on public.queue_ticket_seats
  for select to anon
  using (true);

-- branch_seats: allow anon SELECT so the board can list all chairs
create policy "public_branch_seats_board_select" on public.branch_seats
  for select to anon
  using (true);

-- branches: allow anon SELECT so the board can display the branch name
create policy "public_branches_board_select" on public.branches
  for select to anon
  using (true);

-- Enable realtime for queue_tickets so the board gets instant updates
-- (queue_ticket_seats is already in the publication from a previous migration)
alter publication supabase_realtime add table public.queue_tickets;
alter publication supabase_realtime add table public.branch_seats;
