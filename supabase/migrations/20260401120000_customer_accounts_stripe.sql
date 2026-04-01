-- Stripe subscription mirror for consumer accounts (barberpro.my).

alter table public.customer_accounts
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists subscription_status text,
  add column if not exists subscription_plan text,
  add column if not exists trial_ends_at timestamptz;

create index if not exists idx_customer_accounts_stripe_customer
  on public.customer_accounts (stripe_customer_id)
  where stripe_customer_id is not null;
