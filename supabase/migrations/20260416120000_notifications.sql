-- Notification system: shared across web-shop, web-customer, and mobile-staff.
-- Audience is identified by auth_user_id (auth.users.id) — works for both
-- app_users (shop staff/owners) and customer_accounts (end customers).

-- ─── notifications ────────────────────────────────────────────────────────────
-- One row per notification per recipient.
-- Inserted server-side after every business event; Realtime delivers it to
-- online clients automatically once added to the publication.

create table if not exists public.notifications (
  id           uuid        primary key default gen_random_uuid(),
  auth_user_id uuid        not null references auth.users(id) on delete cascade,
  tenant_id    uuid        references public.tenants(id) on delete cascade,
  title        text        not null,
  body         text        not null,
  data         jsonb,
  action_url   text,
  category     text        not null default 'general'
                           check (category in ('queue_alert','booking','payment','reminder','general')),
  is_read      boolean     not null default false,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Users can only read and update their own notifications.
create policy "notifications_select_own" on public.notifications
  for select to authenticated
  using (auth_user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (auth_user_id = auth.uid());

create index if not exists idx_notifications_auth_user_unread
  on public.notifications(auth_user_id, is_read, created_at desc);

-- Add to Realtime publication so the badge counter updates live.
alter publication supabase_realtime add table public.notifications;

-- ─── push_subscriptions ───────────────────────────────────────────────────────
-- Browser Web Push subscriptions (VAPID). One row per browser instance.
-- Cleared automatically when the user unsubscribes or the endpoint expires.

create table if not exists public.push_subscriptions (
  id           uuid  primary key default gen_random_uuid(),
  auth_user_id uuid  not null references auth.users(id) on delete cascade,
  endpoint     text  not null,
  p256dh       text  not null,
  auth_secret  text  not null,
  app_surface  text  not null check (app_surface in ('shop', 'customer')),
  created_at   timestamptz not null default now(),
  unique (auth_user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select to authenticated
  using (auth_user_id = auth.uid());

create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert to authenticated
  with check (auth_user_id = auth.uid());

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete to authenticated
  using (auth_user_id = auth.uid());

create index if not exists idx_push_subscriptions_user
  on public.push_subscriptions(auth_user_id);

-- ─── mobile_push_tokens ───────────────────────────────────────────────────────
-- Normalized Expo push tokens for mobile-staff and mobile-customer.
-- Bridges the existing scattered expo_push_token columns on customer_accounts
-- and staff_profiles — new registrations write here; old columns become legacy.

create table if not exists public.mobile_push_tokens (
  id           uuid  primary key default gen_random_uuid(),
  auth_user_id uuid  not null references auth.users(id) on delete cascade,
  token        text  not null,
  platform     text  not null default 'expo',
  created_at   timestamptz not null default now(),
  unique (auth_user_id, token)
);

alter table public.mobile_push_tokens enable row level security;

create policy "mobile_push_tokens_select_own" on public.mobile_push_tokens
  for select to authenticated
  using (auth_user_id = auth.uid());

create policy "mobile_push_tokens_insert_own" on public.mobile_push_tokens
  for insert to authenticated
  with check (auth_user_id = auth.uid());

create policy "mobile_push_tokens_delete_own" on public.mobile_push_tokens
  for delete to authenticated
  using (auth_user_id = auth.uid());

create index if not exists idx_mobile_push_tokens_user
  on public.mobile_push_tokens(auth_user_id);

-- ─── notification_preferences ─────────────────────────────────────────────────
-- Per-user channel and category opt-in/out preferences.
-- Row is created on first notification (upsert pattern). Missing row = all defaults.

create table if not exists public.notification_preferences (
  id               uuid        primary key default gen_random_uuid(),
  auth_user_id     uuid        not null unique references auth.users(id) on delete cascade,
  queue_alerts     boolean     not null default true,
  booking_updates  boolean     not null default true,
  payment_alerts   boolean     not null default true,
  reminders        boolean     not null default true,
  marketing        boolean     not null default false,
  channel_in_app   boolean     not null default true,
  channel_push     boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "notification_preferences_select_own" on public.notification_preferences
  for select to authenticated
  using (auth_user_id = auth.uid());

create policy "notification_preferences_upsert_own" on public.notification_preferences
  for insert to authenticated
  with check (auth_user_id = auth.uid());

create policy "notification_preferences_update_own" on public.notification_preferences
  for update to authenticated
  using (auth_user_id = auth.uid());

-- Trigger to keep updated_at fresh.
create or replace function public.touch_notification_preferences_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute procedure public.touch_notification_preferences_updated_at();
