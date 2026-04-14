-- Add avatar_url column to app_users for profile photos
alter table public.app_users
  add column if not exists avatar_url text null;
