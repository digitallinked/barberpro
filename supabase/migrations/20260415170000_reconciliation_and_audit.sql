-- Reconciliation and audit infrastructure: anomaly detection views,
-- audit log table, and reconciliation check functions.


-- ─── Finance Audit Log ──────────────────────────────────────────────────────
-- Records sensitive finance actions for after-the-fact review.

create table if not exists public.finance_audit_log (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  action_type   text not null,
  entity_type   text not null,
  entity_id     uuid,
  actor_id      uuid references public.app_users(id),
  details       jsonb,
  ip_address    text,
  created_at    timestamptz not null default now()
);

alter table public.finance_audit_log enable row level security;

create policy "finance_audit_log_tenant_rls"
  on public.finance_audit_log
  for all to authenticated
  using (tenant_id = (select tenant_id from public.app_users where auth_user_id = auth.uid()))
  with check (tenant_id = (select tenant_id from public.app_users where auth_user_id = auth.uid()));

create index if not exists idx_finance_audit_log_tenant_date
  on public.finance_audit_log(tenant_id, created_at desc);

create index if not exists idx_finance_audit_log_entity
  on public.finance_audit_log(entity_type, entity_id);


-- ─── Anomaly: Transaction header vs line sum mismatch ───────────────────────

create or replace function check_transaction_integrity(
  p_tenant_id uuid
)
returns table (
  transaction_id    uuid,
  header_subtotal   numeric,
  header_total      numeric,
  lines_sum         numeric,
  difference        numeric,
  paid_at           timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id                 as transaction_id,
    t.subtotal           as header_subtotal,
    t.total_amount       as header_total,
    coalesce(sum(ti.line_total), 0) as lines_sum,
    t.subtotal - coalesce(sum(ti.line_total), 0) as difference,
    t.paid_at
  from transactions t
  left join transaction_items ti on ti.transaction_id = t.id
  where t.tenant_id = p_tenant_id
    and t.payment_status = 'paid'
  group by t.id, t.subtotal, t.total_amount, t.paid_at
  having abs(t.subtotal - coalesce(sum(ti.line_total), 0)) > 0.02
  order by t.paid_at desc;
$$;

grant execute on function check_transaction_integrity(uuid) to authenticated;


-- ─── Anomaly: Duplicate queue-to-transaction links ──────────────────────────

create or replace function check_duplicate_queue_payments(
  p_tenant_id uuid
)
returns table (
  queue_ticket_id   uuid,
  payment_count     bigint,
  transaction_ids   uuid[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.queue_ticket_id,
    count(*) as payment_count,
    array_agg(t.id) as transaction_ids
  from transactions t
  where t.tenant_id = p_tenant_id
    and t.queue_ticket_id is not null
    and t.payment_status = 'paid'
  group by t.queue_ticket_id
  having count(*) > 1
  order by max(t.paid_at) desc;
$$;

grant execute on function check_duplicate_queue_payments(uuid) to authenticated;


-- ─── Anomaly: Negative margin sales ────────────────────────────────────────

create or replace function check_negative_margin_sales(
  p_tenant_id uuid
)
returns table (
  transaction_id  uuid,
  revenue         numeric,
  cogs            numeric,
  margin          numeric,
  paid_at         timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id as transaction_id,
    t.total_amount as revenue,
    coalesce(sum(m.quantity * coalesce(m.unit_cost_at_time, 0)), 0) as cogs,
    t.total_amount - coalesce(sum(m.quantity * coalesce(m.unit_cost_at_time, 0)), 0) as margin,
    t.paid_at
  from transactions t
  left join inventory_movements m on m.reference_id = t.id
    and m.movement_type = 'sale'
    and m.tenant_id = p_tenant_id
  where t.tenant_id = p_tenant_id
    and t.payment_status = 'paid'
  group by t.id, t.total_amount, t.paid_at
  having t.total_amount < coalesce(sum(m.quantity * coalesce(m.unit_cost_at_time, 0)), 0)
  order by t.paid_at desc;
$$;

grant execute on function check_negative_margin_sales(uuid) to authenticated;


-- ─── Anomaly: Stock below zero ──────────────────────────────────────────────

create or replace function check_negative_stock(
  p_tenant_id uuid
)
returns table (
  item_id    uuid,
  item_name  text,
  stock_qty  integer,
  branch_id  uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.id as item_id,
    i.name as item_name,
    i.stock_qty,
    i.branch_id
  from inventory_items i
  where i.tenant_id = p_tenant_id
    and i.stock_qty < 0
    and i.is_active = true;
$$;

grant execute on function check_negative_stock(uuid) to authenticated;


-- ─── Anomaly: Payroll entries outside their period ──────────────────────────

create or replace function check_payroll_period_integrity(
  p_tenant_id uuid
)
returns table (
  entry_id        uuid,
  period_id       uuid,
  period_start    date,
  period_end      date,
  entry_created   timestamptz,
  staff_id        uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pe.id           as entry_id,
    pp.id           as period_id,
    pp.period_start,
    pp.period_end,
    pe.created_at   as entry_created,
    pe.staff_id
  from payroll_entries pe
  join payroll_periods pp on pp.id = pe.payroll_period_id
  where pe.tenant_id = p_tenant_id
    and (
      pe.created_at < pp.period_start::timestamptz - interval '7 days'
      or pe.created_at > pp.period_end::timestamptz + interval '30 days'
    );
$$;

grant execute on function check_payroll_period_integrity(uuid) to authenticated;


-- ─── Anomaly: Orphan transactions without items ─────────────────────────────

create or replace function check_orphan_transactions(
  p_tenant_id uuid
)
returns table (
  transaction_id   uuid,
  total_amount     numeric,
  paid_at          timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id             as transaction_id,
    t.total_amount,
    t.paid_at
  from transactions t
  left join transaction_items ti on ti.transaction_id = t.id
  where t.tenant_id = p_tenant_id
    and t.payment_status = 'paid'
    and ti.id is null
  order by t.paid_at desc;
$$;

grant execute on function check_orphan_transactions(uuid) to authenticated;


-- ─── Inventory stock vs movements reconciliation ────────────────────────────
-- Compares current stock_qty against the net of all recorded movements.

create or replace function check_inventory_stock_reconciliation(
  p_tenant_id uuid
)
returns table (
  item_id         uuid,
  item_name       text,
  current_stock   integer,
  movement_net    bigint,
  discrepancy     bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with movement_sums as (
    select
      m.inventory_item_id,
      sum(case
        when m.movement_type in ('in', 'restock', 'adjustment_in', 'transfer_in') then m.quantity
        when m.movement_type in ('out', 'sale', 'adjustment_out', 'write_off', 'transfer_out') then -m.quantity
        else 0
      end) as net_movement
    from inventory_movements m
    where m.tenant_id = p_tenant_id
    group by m.inventory_item_id
  )
  select
    i.id          as item_id,
    i.name        as item_name,
    i.stock_qty   as current_stock,
    coalesce(ms.net_movement, 0) as movement_net,
    i.stock_qty - coalesce(ms.net_movement, 0) as discrepancy
  from inventory_items i
  left join movement_sums ms on ms.inventory_item_id = i.id
  where i.tenant_id = p_tenant_id
    and i.is_active = true
    and i.stock_qty != coalesce(ms.net_movement, 0)
  order by abs(i.stock_qty - coalesce(ms.net_movement, 0)) desc;
$$;

grant execute on function check_inventory_stock_reconciliation(uuid) to authenticated;


-- ─── Daily cash reconciliation helper ───────────────────────────────────────

create or replace function report_daily_settlement(
  p_tenant_id  uuid,
  p_branch_id  uuid,
  p_date       date
)
returns table (
  payment_method  text,
  total_amount    numeric,
  tx_count        bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.payment_method,
    coalesce(sum(t.total_amount), 0) as total_amount,
    count(*) as tx_count
  from transactions t
  where t.tenant_id = p_tenant_id
    and t.branch_id = coalesce(p_branch_id, t.branch_id)
    and t.payment_status = 'paid'
    and (t.paid_at at time zone 'Asia/Kuala_Lumpur')::date = p_date
  group by t.payment_method
  order by total_amount desc;
$$;

grant execute on function report_daily_settlement(uuid, uuid, date)
  to authenticated;
