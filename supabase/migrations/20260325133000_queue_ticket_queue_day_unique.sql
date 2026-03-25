-- Allow queue_number to repeat each shop day (Malaysia calendar date).
-- Replaces UNIQUE (tenant_id, branch_id, queue_number) with uniqueness per day.

alter table public.queue_tickets
  add column if not exists queue_day date;

update public.queue_tickets
set queue_day = (timezone('Asia/Kuala_Lumpur', created_at))::date
where queue_day is null;

alter table public.queue_tickets
  alter column queue_day set default (timezone('Asia/Kuala_Lumpur', now()))::date;

alter table public.queue_tickets
  alter column queue_day set not null;

alter table public.queue_tickets
  drop constraint if exists queue_tickets_tenant_id_branch_id_queue_number_key;

alter table public.queue_tickets
  add constraint queue_tickets_branch_day_number_unique
  unique (tenant_id, branch_id, queue_day, queue_number);
