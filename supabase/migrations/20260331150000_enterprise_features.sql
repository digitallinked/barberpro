-- Enterprise features: cross-branch product catalog, analytics views

-- Shared product catalog across branches within a tenant
create table if not exists public.product_catalog (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  sku         text,
  price       numeric(10,2) not null default 0,
  category    text not null default 'general',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.product_catalog enable row level security;

create policy "tenant_product_catalog_select" on public.product_catalog
  for select to authenticated
  using (tenant_id = get_my_tenant_id());

create policy "tenant_product_catalog_insert" on public.product_catalog
  for insert to authenticated
  with check (tenant_id = get_my_tenant_id());

create policy "tenant_product_catalog_update" on public.product_catalog
  for update to authenticated
  using (tenant_id = get_my_tenant_id());

create policy "tenant_product_catalog_delete" on public.product_catalog
  for delete to authenticated
  using (tenant_id = get_my_tenant_id());

-- Indexes for analytics queries
create index if not exists idx_transactions_tenant_date on public.transactions(tenant_id, paid_at);
create index if not exists idx_appointments_tenant_date on public.appointments(tenant_id, start_at);
create index if not exists idx_queue_tickets_tenant_day on public.queue_tickets(tenant_id, queue_day);
