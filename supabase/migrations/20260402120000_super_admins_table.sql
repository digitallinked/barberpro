-- Super admins table — controls who can access the web-admin console.
-- Only rows in this table are granted access; all other authenticated users are denied.

create table if not exists public.super_admins (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- Only the service role can read/write this table (no RLS needed — deny all by default).
alter table public.super_admins enable row level security;

-- Seed the initial super admins.
insert into public.super_admins (email) values
  ('barberpro.my@gmail.com'),
  ('digitallinked.au@gmail.com')
on conflict (email) do nothing;

-- Replace the is_super_admin() function to check this table.
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.super_admins sa
    join auth.users u on lower(u.email) = lower(sa.email)
    where u.id = auth.uid()
  );
$$;

-- Revoke public execute; only authenticated users need it (called via RPC).
revoke execute on function public.is_super_admin() from anon;
grant  execute on function public.is_super_admin() to authenticated;
