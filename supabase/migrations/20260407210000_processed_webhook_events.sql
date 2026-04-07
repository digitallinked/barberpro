CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS processed_webhook_events_created_at_idx
  ON public.processed_webhook_events (created_at);

ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
