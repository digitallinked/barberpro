-- Server-side reporting RPCs — replaces client-side aggregation from
-- useTransactions(5000) with authoritative SQL aggregates.
-- All revenue RPCs filter on payment_status = 'paid' for consistency.


-- ─── Revenue summary with branch-aware scope ────────────────────────────────
-- Replaces the client-side revenueStats computation in reports/page.tsx.
-- Returns subtotal, tax, total, count, avg ticket, and service/product split.

create or replace function report_revenue_detail(
  p_tenant_id   uuid,
  p_branch_id   uuid,
  p_start       timestamptz,
  p_end         timestamptz
)
returns table (
  total_revenue       numeric,
  total_subtotal      numeric,
  total_tax           numeric,
  total_discount      numeric,
  tx_count            bigint,
  avg_ticket          numeric,
  service_revenue     numeric,
  product_revenue     numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with paid_tx as (
    select t.id, t.total_amount, t.subtotal, t.tax_amount, t.discount_amount
    from transactions t
    where t.tenant_id = p_tenant_id
      and t.branch_id = coalesce(p_branch_id, t.branch_id)
      and t.paid_at >= p_start
      and t.paid_at <= p_end
      and t.payment_status = 'paid'
  ),
  item_sums as (
    select
      coalesce(sum(case when ti.item_type = 'service' then ti.line_total else 0 end), 0) as svc,
      coalesce(sum(case when ti.item_type in ('product', 'retail') then ti.line_total else 0 end), 0) as prod
    from transaction_items ti
    join paid_tx pt on pt.id = ti.transaction_id
  )
  select
    coalesce(sum(pt.total_amount), 0)     as total_revenue,
    coalesce(sum(pt.subtotal), 0)         as total_subtotal,
    coalesce(sum(pt.tax_amount), 0)       as total_tax,
    coalesce(sum(pt.discount_amount), 0)  as total_discount,
    count(*)                              as tx_count,
    case when count(*) > 0
      then round(sum(pt.total_amount) / count(*), 2)
      else 0
    end                                   as avg_ticket,
    (select svc from item_sums)           as service_revenue,
    (select prod from item_sums)          as product_revenue
  from paid_tx pt;
$$;

grant execute on function report_revenue_detail(uuid, uuid, timestamptz, timestamptz)
  to authenticated;


-- ─── Payment method mix ─────────────────────────────────────────────────────

create or replace function report_payment_mix(
  p_tenant_id   uuid,
  p_branch_id   uuid,
  p_start       timestamptz,
  p_end         timestamptz
)
returns table (
  payment_method  text,
  amount          numeric,
  tx_count        bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.payment_method,
    coalesce(sum(t.total_amount), 0)  as amount,
    count(*)                          as tx_count
  from transactions t
  where
    t.tenant_id = p_tenant_id
    and t.branch_id = coalesce(p_branch_id, t.branch_id)
    and t.paid_at >= p_start
    and t.paid_at <= p_end
    and t.payment_status = 'paid'
  group by t.payment_method
  order by amount desc;
$$;

grant execute on function report_payment_mix(uuid, uuid, timestamptz, timestamptz)
  to authenticated;


-- ─── Staff performance attribution ──────────────────────────────────────────

create or replace function report_staff_performance(
  p_tenant_id   uuid,
  p_branch_id   uuid,
  p_start       timestamptz,
  p_end         timestamptz
)
returns table (
  staff_id         uuid,
  service_revenue  numeric,
  product_revenue  numeric,
  total_revenue    numeric,
  services_count   bigint,
  customers_served bigint,
  tx_count         bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ti.staff_id,
    coalesce(sum(case when ti.item_type = 'service' then ti.line_total else 0 end), 0)  as service_revenue,
    coalesce(sum(case when ti.item_type in ('product', 'retail') then ti.line_total else 0 end), 0) as product_revenue,
    coalesce(sum(ti.line_total), 0) as total_revenue,
    coalesce(sum(case when ti.item_type = 'service' then ti.quantity else 0 end), 0) as services_count,
    count(distinct t.customer_id) as customers_served,
    count(distinct t.id) as tx_count
  from transaction_items ti
  join transactions t on t.id = ti.transaction_id
  where
    t.tenant_id = p_tenant_id
    and t.branch_id = coalesce(p_branch_id, t.branch_id)
    and t.paid_at >= p_start
    and t.paid_at <= p_end
    and t.payment_status = 'paid'
    and ti.staff_id is not null
  group by ti.staff_id;
$$;

grant execute on function report_staff_performance(uuid, uuid, timestamptz, timestamptz)
  to authenticated;


-- ─── Top services breakdown ─────────────────────────────────────────────────

create or replace function report_top_services(
  p_tenant_id   uuid,
  p_branch_id   uuid,
  p_start       timestamptz,
  p_end         timestamptz,
  p_limit       integer default 10
)
returns table (
  service_name   text,
  total_qty      bigint,
  total_revenue  numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ti.name                          as service_name,
    coalesce(sum(ti.quantity), 0)    as total_qty,
    coalesce(sum(ti.line_total), 0) as total_revenue
  from transaction_items ti
  join transactions t on t.id = ti.transaction_id
  where
    t.tenant_id = p_tenant_id
    and t.branch_id = coalesce(p_branch_id, t.branch_id)
    and t.paid_at >= p_start
    and t.paid_at <= p_end
    and t.payment_status = 'paid'
    and ti.item_type = 'service'
  group by ti.name
  order by total_revenue desc
  limit p_limit;
$$;

grant execute on function report_top_services(uuid, uuid, timestamptz, timestamptz, integer)
  to authenticated;


-- ─── Revenue time series (daily or monthly) ─────────────────────────────────
-- Uses paid_at in MY timezone for consistent bucketing.

create or replace function report_revenue_timeseries(
  p_tenant_id   uuid,
  p_branch_id   uuid,
  p_start       timestamptz,
  p_end         timestamptz,
  p_granularity text default 'day'
)
returns table (
  bucket_label text,
  revenue      numeric,
  tx_count     bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when p_granularity = 'hour' then
        to_char(t.paid_at at time zone 'Asia/Kuala_Lumpur', 'YYYY-MM-DD"T"HH24')
      when p_granularity = 'month' then
        to_char(t.paid_at at time zone 'Asia/Kuala_Lumpur', 'YYYY-MM')
      else
        to_char(t.paid_at at time zone 'Asia/Kuala_Lumpur', 'YYYY-MM-DD')
    end as bucket_label,
    coalesce(sum(t.total_amount), 0) as revenue,
    count(*) as tx_count
  from transactions t
  where
    t.tenant_id = p_tenant_id
    and t.branch_id = coalesce(p_branch_id, t.branch_id)
    and t.paid_at >= p_start
    and t.paid_at <= p_end
    and t.payment_status = 'paid'
  group by 1
  order by 1;
$$;

grant execute on function report_revenue_timeseries(uuid, uuid, timestamptz, timestamptz, text)
  to authenticated;


-- ─── Expense summary (branch-aware, date-ranged) ───────────────────────────
-- Replaces the tenant-wide report_expense_totals with branch-aware + ranged version.

create or replace function report_expense_summary(
  p_tenant_id   uuid,
  p_branch_id   uuid,
  p_start       date,
  p_end         date
)
returns table (
  category       text,
  total_amount   numeric,
  expense_count  bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.category,
    coalesce(sum(e.amount), 0)  as total_amount,
    count(*)                    as expense_count
  from expenses e
  where
    e.tenant_id = p_tenant_id
    and e.branch_id = coalesce(p_branch_id, e.branch_id)
    and e.status = 'paid'
    and e.expense_date >= p_start
    and e.expense_date <= p_end
  group by e.category
  order by total_amount desc;
$$;

grant execute on function report_expense_summary(uuid, uuid, date, date)
  to authenticated;


-- ─── Payroll cost summary (period-based, not created_at) ────────────────────
-- Sums payroll by period dates for correct P&L allocation.

create or replace function report_payroll_summary(
  p_tenant_id  uuid,
  p_start      date,
  p_end        date
)
returns table (
  month_label       text,
  total_base        numeric,
  total_commission  numeric,
  total_bonuses     numeric,
  total_deductions  numeric,
  total_net_payout  numeric,
  entry_count       bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    to_char(pp.period_end, 'YYYY-MM') as month_label,
    coalesce(sum(pe.base_salary), 0)  as total_base,
    coalesce(sum(pe.service_commission + pe.product_commission), 0) as total_commission,
    coalesce(sum(pe.bonuses), 0)      as total_bonuses,
    coalesce(sum(pe.deductions + pe.advances), 0) as total_deductions,
    coalesce(sum(pe.net_payout), 0)   as total_net_payout,
    count(*)                          as entry_count
  from payroll_entries pe
  join payroll_periods pp on pp.id = pe.payroll_period_id
  where
    pe.tenant_id = p_tenant_id
    and pp.period_end >= p_start
    and pp.period_start <= p_end
  group by to_char(pp.period_end, 'YYYY-MM')
  order by 1;
$$;

grant execute on function report_payroll_summary(uuid, date, date)
  to authenticated;


-- ─── Tax collection summary ─────────────────────────────────────────────────

create or replace function report_tax_collection(
  p_tenant_id  uuid,
  p_branch_id  uuid,
  p_start      timestamptz,
  p_end        timestamptz
)
returns table (
  gross_revenue    numeric,
  total_subtotal   numeric,
  total_tax        numeric,
  total_discount   numeric,
  tx_count         bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(t.total_amount), 0)     as gross_revenue,
    coalesce(sum(t.subtotal), 0)         as total_subtotal,
    coalesce(sum(t.tax_amount), 0)       as total_tax,
    coalesce(sum(t.discount_amount), 0)  as total_discount,
    count(*)                             as tx_count
  from transactions t
  where
    t.tenant_id = p_tenant_id
    and t.branch_id = coalesce(p_branch_id, t.branch_id)
    and t.paid_at >= p_start
    and t.paid_at <= p_end
    and t.payment_status = 'paid';
$$;

grant execute on function report_tax_collection(uuid, uuid, timestamptz, timestamptz)
  to authenticated;


-- ─── Customer spend ranking (branch-aware) ──────────────────────────────────

create or replace function report_customer_spend(
  p_tenant_id  uuid,
  p_branch_id  uuid,
  p_start      timestamptz,
  p_end        timestamptz,
  p_limit      integer default 25
)
returns table (
  customer_id   uuid,
  visit_count   bigint,
  total_spend   numeric,
  last_visit    timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.customer_id,
    count(*)                       as visit_count,
    coalesce(sum(t.total_amount), 0) as total_spend,
    max(t.paid_at)                 as last_visit
  from transactions t
  where
    t.tenant_id = p_tenant_id
    and t.branch_id = coalesce(p_branch_id, t.branch_id)
    and t.paid_at >= p_start
    and t.paid_at <= p_end
    and t.payment_status = 'paid'
    and t.customer_id is not null
  group by t.customer_id
  order by total_spend desc
  limit p_limit;
$$;

grant execute on function report_customer_spend(uuid, uuid, timestamptz, timestamptz, integer)
  to authenticated;


-- ─── P&L summary (uses paid_at for revenue, expense_date for expenses,
--     period_end for payroll) ────────────────────────────────────────────────

create or replace function report_pnl_monthly(
  p_tenant_id  uuid,
  p_branch_id  uuid,
  p_year       integer
)
returns table (
  month_num       integer,
  month_label     text,
  revenue         numeric,
  expenses        numeric,
  payroll         numeric,
  gross_profit    numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with months as (
    select generate_series(1, 12) as m
  ),
  rev as (
    select
      extract(month from t.paid_at at time zone 'Asia/Kuala_Lumpur')::integer as m,
      coalesce(sum(t.total_amount), 0) as total
    from transactions t
    where t.tenant_id = p_tenant_id
      and t.branch_id = coalesce(p_branch_id, t.branch_id)
      and t.payment_status = 'paid'
      and extract(year from t.paid_at at time zone 'Asia/Kuala_Lumpur') = p_year
    group by 1
  ),
  exp as (
    select
      extract(month from e.expense_date)::integer as m,
      coalesce(sum(e.amount), 0) as total
    from expenses e
    where e.tenant_id = p_tenant_id
      and e.branch_id = coalesce(p_branch_id, e.branch_id)
      and e.status = 'paid'
      and extract(year from e.expense_date) = p_year
    group by 1
  ),
  pay as (
    select
      extract(month from pp.period_end)::integer as m,
      coalesce(sum(pe.net_payout), 0) as total
    from payroll_entries pe
    join payroll_periods pp on pp.id = pe.payroll_period_id
    where pe.tenant_id = p_tenant_id
      and extract(year from pp.period_end) = p_year
    group by 1
  )
  select
    months.m                                    as month_num,
    to_char(make_date(p_year, months.m, 1), 'Mon') as month_label,
    coalesce(rev.total, 0)                      as revenue,
    coalesce(exp.total, 0)                      as expenses,
    coalesce(pay.total, 0)                      as payroll,
    coalesce(rev.total, 0) - coalesce(exp.total, 0) - coalesce(pay.total, 0) as gross_profit
  from months
  left join rev on rev.m = months.m
  left join exp on exp.m = months.m
  left join pay on pay.m = months.m
  order by months.m;
$$;

grant execute on function report_pnl_monthly(uuid, uuid, integer)
  to authenticated;


-- ─── Customer stats (branch-aware variant) ──────────────────────────────────

create or replace function report_customer_stats(
  p_tenant_id  uuid,
  p_branch_id  uuid
)
returns table (
  total_customers   bigint,
  new_this_month    bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) as total_customers,
    count(*) filter (
      where c.created_at >= date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur') at time zone 'Asia/Kuala_Lumpur'
    ) as new_this_month
  from customers c
  where
    c.tenant_id = p_tenant_id
    and c.branch_id = coalesce(p_branch_id, c.branch_id);
$$;

grant execute on function report_customer_stats(uuid, uuid)
  to authenticated;
