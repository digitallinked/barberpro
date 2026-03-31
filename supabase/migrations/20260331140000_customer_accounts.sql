-- Customer accounts for the customer portal and mobile app.
-- Separate from app_users (which are shop staff/owners).

create table if not exists public.customer_accounts (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid not null unique references auth.users(id) on delete cascade,
  full_name        text not null default '',
  email            text,
  phone            text,
  avatar_url       text,
  expo_push_token  text,
  loyalty_points   integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.customer_accounts enable row level security;

create policy "customers_select_own" on public.customer_accounts
  for select to authenticated
  using (auth_user_id = auth.uid());

create policy "customers_update_own" on public.customer_accounts
  for update to authenticated
  using (auth_user_id = auth.uid());

create policy "customers_insert_own" on public.customer_accounts
  for insert to authenticated
  with check (auth_user_id = auth.uid());

create index if not exists idx_customer_accounts_auth_user on public.customer_accounts(auth_user_id);
