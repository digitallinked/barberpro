-- Allow 'paid' as a valid queue_tickets status.
-- The createTransaction server action updates status → 'paid' when a POS
-- payment is recorded, but the old constraint only allowed:
--   waiting | assigned | in_service | completed | cancelled
-- which caused the update to fail silently.

ALTER TABLE public.queue_tickets
  DROP CONSTRAINT IF EXISTS queue_tickets_status_check;

ALTER TABLE public.queue_tickets
  ADD CONSTRAINT queue_tickets_status_check
  CHECK (status = ANY (ARRAY[
    'waiting'::text,
    'assigned'::text,
    'in_service'::text,
    'completed'::text,
    'cancelled'::text,
    'paid'::text
  ]));
