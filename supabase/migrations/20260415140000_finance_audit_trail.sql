-- Finance audit trail: inventory movements for sales, reference tracking,
-- and COGS cost capture at time of movement.

-- Add reference_id and unit_cost_at_time to inventory_movements for full audit trail
alter table public.inventory_movements
  add column if not exists reference_id uuid,
  add column if not exists unit_cost_at_time numeric;

comment on column public.inventory_movements.reference_id is
  'FK to the source document (transaction_id, expense_id, etc.) that caused this movement';
comment on column public.inventory_movements.unit_cost_at_time is
  'Unit cost at the time of movement, for COGS calculation';

-- Index for tracing movements back to source transactions
create index if not exists idx_inventory_movements_reference
  on public.inventory_movements(reference_id)
  where reference_id is not null;

-- Index for movement type filtering (e.g. all sales)
create index if not exists idx_inventory_movements_type
  on public.inventory_movements(tenant_id, movement_type, created_at);


-- ─── Inventory valuation view ───────────────────────────────────────────────
-- Provides current stock valuation by item at cost and retail.

create or replace function report_inventory_valuation(
  p_tenant_id uuid,
  p_branch_id uuid
)
returns table (
  item_id        uuid,
  item_name      text,
  sku            text,
  branch_id      uuid,
  stock_qty      integer,
  unit_cost      numeric,
  sell_price     numeric,
  cost_value     numeric,
  retail_value   numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.id                              as item_id,
    i.name                            as item_name,
    i.sku,
    i.branch_id,
    i.stock_qty,
    i.unit_cost,
    i.sell_price,
    coalesce(i.stock_qty * i.unit_cost, 0)   as cost_value,
    coalesce(i.stock_qty * i.sell_price, 0)  as retail_value
  from inventory_items i
  where
    i.tenant_id = p_tenant_id
    and i.branch_id = coalesce(p_branch_id, i.branch_id)
    and i.is_active = true
  order by i.name;
$$;

grant execute on function report_inventory_valuation(uuid, uuid)
  to authenticated;


-- ─── COGS summary for a date range ──────────────────────────────────────────
-- Sums cost of goods sold from inventory movements of type 'sale'.

create or replace function report_cogs_summary(
  p_tenant_id uuid,
  p_branch_id uuid,
  p_start     timestamptz,
  p_end       timestamptz
)
returns table (
  total_cogs   numeric,
  total_units  bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(m.quantity * coalesce(m.unit_cost_at_time, 0)), 0) as total_cogs,
    coalesce(sum(m.quantity), 0)                                    as total_units
  from inventory_movements m
  where
    m.tenant_id     = p_tenant_id
    and m.branch_id = coalesce(p_branch_id, m.branch_id)
    and m.movement_type = 'sale'
    and m.created_at >= p_start
    and m.created_at <= p_end;
$$;

grant execute on function report_cogs_summary(uuid, uuid, timestamptz, timestamptz)
  to authenticated;


-- ─── Inventory movement history ─────────────────────────────────────────────
-- Supports audit trail queries for a specific item.

create or replace function report_inventory_movements(
  p_tenant_id      uuid,
  p_inventory_item uuid,
  p_limit          integer default 100
)
returns table (
  movement_id     uuid,
  movement_type   text,
  quantity         integer,
  unit_cost_at_time numeric,
  reason          text,
  reference_id    uuid,
  created_by      uuid,
  created_at      timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id            as movement_id,
    m.movement_type,
    m.quantity,
    m.unit_cost_at_time,
    m.reason,
    m.reference_id,
    m.created_by,
    m.created_at
  from inventory_movements m
  where
    m.tenant_id         = p_tenant_id
    and m.inventory_item_id = p_inventory_item
  order by m.created_at desc
  limit p_limit;
$$;

grant execute on function report_inventory_movements(uuid, uuid, integer)
  to authenticated;
