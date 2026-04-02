-- Admin staff RBAC — replaces hardcoded email allowlist with a DB-driven role system.
-- Roles control which pages each admin staff member can access.

create type public.admin_role as enum (
  'super_admin', 'accounts', 'support', 'reports_viewer'
);

create table public.admin_staff (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text not null,
  role        public.admin_role not null default 'support',
  is_active   boolean not null default true,
  invited_by  uuid references public.admin_staff(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.admin_staff enable row level security;

-- Seed existing super admins from super_admins table.
insert into public.admin_staff (email, name, role)
select email, email, 'super_admin'::public.admin_role
from public.super_admins
on conflict (email) do nothing;

-- Returns the admin_role of the currently authenticated user (null if not an admin staff member).
create or replace function public.get_admin_role()
returns text
language sql
security definer
stable
as $$
  select sa.role::text
  from public.admin_staff sa
  join auth.users u on lower(u.email) = lower(sa.email)
  where u.id = auth.uid()
    and sa.is_active = true
  limit 1;
$$;

revoke execute on function public.get_admin_role() from anon;
grant  execute on function public.get_admin_role() to authenticated;

-- Update is_super_admin() to use admin_staff table.
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.admin_staff sa
    join auth.users u on lower(u.email) = lower(sa.email)
    where u.id = auth.uid()
      and sa.role = 'super_admin'::public.admin_role
      and sa.is_active = true
  );
$$;
