-- Add member_services JSONB column to queue_tickets.
-- Stores per-member service preferences selected by the customer during self check-in.
-- Format: [{"member_index": 0, "service_id": "uuid", "service_name": "Haircut", "service_price": 25.00}]
alter table public.queue_tickets
  add column if not exists member_services jsonb not null default '[]'::jsonb;
