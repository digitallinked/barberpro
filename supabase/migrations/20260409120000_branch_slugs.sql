-- Migration: Add slug column to branches table
-- Slugs are URL-safe identifiers unique per tenant, auto-generated from branch name.

-- Helper: generate a URL-safe slug from a name, unique within a tenant
create or replace function public.generate_branch_slug(p_name text, p_tenant_id uuid)
returns text
language plpgsql
as $$
declare
  base_slug text;
  candidate text;
  counter   int := 0;
begin
  -- Lowercase, replace non-alphanumeric with hyphens, collapse multiples, trim edges
  base_slug := lower(trim(both '-' from regexp_replace(
    regexp_replace(p_name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '[\s-]+', '-', 'g'
  )));
  if base_slug = '' then
    base_slug := 'branch';
  end if;

  candidate := base_slug;
  loop
    if not exists (
      select 1 from public.branches
      where tenant_id = p_tenant_id and slug = candidate
    ) then
      return candidate;
    end if;
    counter := counter + 1;
    candidate := base_slug || '-' || counter;
  end loop;
end;
$$;

-- Add the column (nullable first for backfill)
alter table public.branches add column if not exists slug text;

-- Backfill existing rows
update public.branches
set slug = public.generate_branch_slug(name, tenant_id)
where slug is null;

-- Now make it NOT NULL
alter table public.branches alter column slug set not null;

-- Unique per tenant
alter table public.branches
  add constraint branches_tenant_slug_unique unique (tenant_id, slug);

-- Auto-generate slug on insert when not provided
create or replace function public.branches_set_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.generate_branch_slug(new.name, new.tenant_id);
  end if;
  return new;
end;
$$;

create trigger trg_branches_set_slug
  before insert on public.branches
  for each row
  execute function public.branches_set_slug();
