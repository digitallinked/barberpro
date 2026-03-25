-- Run in Supabase SQL editor or via CLI.
-- party_size: number of people in one queue entry (QR / walk-in).
alter table public.queue_tickets
  add column if not exists party_size integer not null default 1;

alter table public.queue_tickets drop constraint if exists queue_tickets_party_size_positive;

alter table public.queue_tickets
  add constraint queue_tickets_party_size_positive check (party_size >= 1 and party_size <= 20);

-- Non-guessable token for customer self check-in (shown as QR to staff only).
alter table public.branches
  add column if not exists checkin_token uuid;

create unique index if not exists branches_checkin_token_key on public.branches (checkin_token)
  where checkin_token is not null;

update public.branches
set checkin_token = gen_random_uuid()
where checkin_token is null;
