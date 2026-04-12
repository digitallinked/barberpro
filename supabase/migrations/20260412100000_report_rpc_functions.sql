-- Report RPC functions for SQL-side aggregation
-- Replaces JavaScript reduce/filter patterns in service layer

-- ─── Revenue summary ─────────────────────────────────────────────────────────
-- Used by getDashboardStats: total revenue, unique customers, transaction count

create or replace function report_revenue_summary(
  p_tenant_id   uuid,
  p_branch_id   uuid,
  p_start       timestamptz,
  p_end         timestamptz
)
returns table (
  total_revenue       numeric,
  total_customers     bigint,
  total_transactions  bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(t.total_amount), 0)            as total_revenue,
    count(distinct t.customer_id)               as total_customers,
    count(*)                                    as total_transactions
  from transactions t
  where
    t.tenant_id  = p_tenant_id
    and t.branch_id = coalesce(p_branch_id, t.branch_id)
    and t.created_at >= p_start
    and t.created_at <= p_end
    and t.payment_status = 'paid';
$$;

-- Allow authenticated users to call this RPC
grant execute on function report_revenue_summary(uuid, uuid, timestamptz, timestamptz)
  to authenticated;


-- ─── Daily revenue buckets (Malaysia UTC+8) ──────────────────────────────────
-- Replaces JS grouping in getDailyRevenue

create or replace function report_daily_revenue(
  p_tenant_id   uuid,
  p_branch_id   uuid,
  p_start       timestamptz,
  p_end         timestamptz
)
returns table (
  day_label text,
  revenue   numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    to_char(t.created_at at time zone 'Asia/Kuala_Lumpur', 'YYYY-MM-DD') as day_label,
    coalesce(sum(t.total_amount), 0)                                       as revenue
  from transactions t
  where
    t.tenant_id  = p_tenant_id
    and t.branch_id = coalesce(p_branch_id, t.branch_id)
    and t.created_at >= p_start
    and t.created_at <= p_end
    and t.payment_status = 'paid'
  group by 1
  order by 1;
$$;

grant execute on function report_daily_revenue(uuid, uuid, timestamptz, timestamptz)
  to authenticated;


-- ─── Expense totals ───────────────────────────────────────────────────────────
-- Replaces TypeScript reduce in getExpenseStats

create or replace function report_expense_totals(
  p_tenant_id   uuid,
  p_branch_id   uuid,
  p_start       date,
  p_end         date
)
returns table (
  total      numeric,
  this_month numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(e.amount) filter (where true),                      0) as total,
    coalesce(sum(e.amount) filter (
      where e.expense_date >= p_start
        and e.expense_date <= p_end
    ), 0) as this_month
  from expenses e
  where
    e.tenant_id = p_tenant_id
    and e.branch_id = coalesce(p_branch_id, e.branch_id)
    and e.status    = 'paid';
$$;

grant execute on function report_expense_totals(uuid, uuid, date, date)
  to authenticated;


-- ─── Attendance summary rollup ───────────────────────────────────────────────
-- Replaces TypeScript groupBy in getAttendanceSummaries

create or replace function report_attendance_summary(
  p_tenant_id   uuid,
  p_date_from   date,
  p_date_to     date
)
returns table (
  staff_id  uuid,
  present   bigint,
  absent    bigint,
  late      bigint,
  half_day  bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.staff_id,
    count(*) filter (where a.status = 'present')  as present,
    count(*) filter (where a.status = 'absent')   as absent,
    count(*) filter (where a.status = 'late')     as late,
    count(*) filter (where a.status = 'half_day') as half_day
  from staff_attendance a
  where
    a.tenant_id = p_tenant_id
    and a.date >= p_date_from
    and a.date <= p_date_to
  group by a.staff_id;
$$;

grant execute on function report_attendance_summary(uuid, date, date)
  to authenticated;


-- ─── Customer visit stats ────────────────────────────────────────────────────
-- Replaces useCustomerVisitStats JS Map iteration (loads all tenant transactions)

create or replace function report_customer_visits(
  p_tenant_id uuid
)
returns table (
  customer_id  uuid,
  visit_count  bigint,
  last_visit   timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.customer_id,
    count(*)      as visit_count,
    max(t.created_at) as last_visit
  from transactions t
  where
    t.tenant_id   = p_tenant_id
    and t.customer_id is not null
    and t.payment_status = 'paid'
  group by t.customer_id;
$$;

grant execute on function report_customer_visits(uuid)
  to authenticated;


-- ─── Low stock count ─────────────────────────────────────────────────────────
-- Replaces JS .filter() in getInventoryStats lowStock path

create or replace function report_low_stock_count(
  p_tenant_id uuid,
  p_branch_id uuid
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from inventory_items i
  where
    i.tenant_id  = p_tenant_id
    and i.branch_id = coalesce(p_branch_id, i.branch_id)
    and i.is_active = true
    and i.stock_qty <= i.reorder_level;
$$;

grant execute on function report_low_stock_count(uuid, uuid)
  to authenticated;
