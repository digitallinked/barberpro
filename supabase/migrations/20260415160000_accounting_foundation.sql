-- Accounting Foundation: chart of accounts, journal entries, accounting periods,
-- and the core double-entry ledger infrastructure.


-- ─── Accounting Periods ─────────────────────────────────────────────────────
-- Periods can be closed to prevent further postings.

create table if not exists public.accounting_periods (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  name          text not null,
  period_start  date not null,
  period_end    date not null,
  status        text not null default 'open'
                check (status in ('open', 'closed', 'locked')),
  closed_at     timestamptz,
  closed_by     uuid references public.app_users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(tenant_id, period_start, period_end)
);

alter table public.accounting_periods enable row level security;

create policy "accounting_periods_tenant_rls"
  on public.accounting_periods
  for all to authenticated
  using (tenant_id = (select tenant_id from public.app_users where auth_user_id = auth.uid()))
  with check (tenant_id = (select tenant_id from public.app_users where auth_user_id = auth.uid()));

create index if not exists idx_accounting_periods_tenant
  on public.accounting_periods(tenant_id, period_start);


-- ─── Chart of Accounts ──────────────────────────────────────────────────────
-- Standard account categories for a barbershop business.

create table if not exists public.chart_of_accounts (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  code          text not null,
  name          text not null,
  account_type  text not null
                check (account_type in ('asset', 'liability', 'equity', 'revenue', 'expense', 'contra_revenue')),
  parent_id     uuid references public.chart_of_accounts(id),
  is_active     boolean not null default true,
  is_system     boolean not null default false,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(tenant_id, code)
);

alter table public.chart_of_accounts enable row level security;

create policy "chart_of_accounts_tenant_rls"
  on public.chart_of_accounts
  for all to authenticated
  using (tenant_id = (select tenant_id from public.app_users where auth_user_id = auth.uid()))
  with check (tenant_id = (select tenant_id from public.app_users where auth_user_id = auth.uid()));

create index if not exists idx_chart_of_accounts_tenant
  on public.chart_of_accounts(tenant_id, code);


-- ─── Journal Entries ────────────────────────────────────────────────────────
-- Every financial event is recorded as a balanced journal entry.

create table if not exists public.journal_entries (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  entry_date         date not null,
  description        text not null,
  source_type        text not null,
  source_id          uuid,
  accounting_period_id uuid references public.accounting_periods(id),
  is_reversal        boolean not null default false,
  reversal_of        uuid references public.journal_entries(id),
  posted_by          uuid references public.app_users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.journal_entries enable row level security;

create policy "journal_entries_tenant_rls"
  on public.journal_entries
  for all to authenticated
  using (tenant_id = (select tenant_id from public.app_users where auth_user_id = auth.uid()))
  with check (tenant_id = (select tenant_id from public.app_users where auth_user_id = auth.uid()));

create index if not exists idx_journal_entries_tenant_date
  on public.journal_entries(tenant_id, entry_date);

create index if not exists idx_journal_entries_source
  on public.journal_entries(source_type, source_id)
  where source_id is not null;


-- ─── Journal Lines ──────────────────────────────────────────────────────────
-- Each line debits or credits a single account. Entry must balance (sum = 0).

create table if not exists public.journal_lines (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  journal_entry_id  uuid not null references public.journal_entries(id) on delete cascade,
  account_id        uuid not null references public.chart_of_accounts(id),
  debit_amount      numeric not null default 0 check (debit_amount >= 0),
  credit_amount     numeric not null default 0 check (credit_amount >= 0),
  description       text,
  created_at        timestamptz not null default now(),
  constraint journal_line_nonzero check (debit_amount > 0 or credit_amount > 0),
  constraint journal_line_one_side check (not (debit_amount > 0 and credit_amount > 0))
);

alter table public.journal_lines enable row level security;

create policy "journal_lines_tenant_rls"
  on public.journal_lines
  for all to authenticated
  using (tenant_id = (select tenant_id from public.app_users where auth_user_id = auth.uid()))
  with check (tenant_id = (select tenant_id from public.app_users where auth_user_id = auth.uid()));

create index if not exists idx_journal_lines_entry
  on public.journal_lines(journal_entry_id);

create index if not exists idx_journal_lines_account
  on public.journal_lines(account_id);


-- ─── Balance validation trigger ─────────────────────────────────────────────
-- Ensures every journal entry is balanced (total debits = total credits).

create or replace function check_journal_entry_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_debits numeric;
  total_credits numeric;
begin
  select
    coalesce(sum(debit_amount), 0),
    coalesce(sum(credit_amount), 0)
  into total_debits, total_credits
  from journal_lines
  where journal_entry_id = coalesce(new.journal_entry_id, old.journal_entry_id);

  if abs(total_debits - total_credits) > 0.01 then
    raise exception 'Journal entry is not balanced: debits=%, credits=%',
      total_debits, total_credits;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace trigger trg_check_journal_balance
  after insert or update or delete on public.journal_lines
  for each row
  execute function check_journal_entry_balance();


-- ─── Closed period protection ───────────────────────────────────────────────
-- Prevents posting journal entries to closed accounting periods.

create or replace function prevent_closed_period_posting()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  period_status text;
begin
  if new.accounting_period_id is not null then
    select status into period_status
    from accounting_periods
    where id = new.accounting_period_id;

    if period_status in ('closed', 'locked') then
      raise exception 'Cannot post to closed or locked accounting period';
    end if;
  end if;

  return new;
end;
$$;

create or replace trigger trg_prevent_closed_period
  before insert or update on public.journal_entries
  for each row
  execute function prevent_closed_period_posting();


-- ─── Default chart of accounts seeder ───────────────────────────────────────
-- Creates a standard barbershop chart of accounts for a tenant.

create or replace function seed_default_chart_of_accounts(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Assets
  insert into chart_of_accounts (tenant_id, code, name, account_type, is_system, description) values
    (p_tenant_id, '1000', 'Cash', 'asset', true, 'Physical cash on hand'),
    (p_tenant_id, '1010', 'Bank Account', 'asset', true, 'Business bank account'),
    (p_tenant_id, '1020', 'E-Wallet / QR Clearing', 'asset', true, 'DuitNow QR and e-wallet receivable'),
    (p_tenant_id, '1030', 'Card Clearing', 'asset', true, 'Credit/debit card settlement receivable'),
    (p_tenant_id, '1100', 'Inventory', 'asset', true, 'Products held for sale')
  on conflict (tenant_id, code) do nothing;

  -- Liabilities
  insert into chart_of_accounts (tenant_id, code, name, account_type, is_system, description) values
    (p_tenant_id, '2000', 'SST Payable', 'liability', true, 'Service tax collected, payable to RMCD'),
    (p_tenant_id, '2010', 'EPF Payable', 'liability', true, 'Employee + employer EPF contributions'),
    (p_tenant_id, '2020', 'SOCSO Payable', 'liability', true, 'SOCSO contributions payable'),
    (p_tenant_id, '2030', 'EIS Payable', 'liability', true, 'EIS contributions payable'),
    (p_tenant_id, '2040', 'PCB/MTD Payable', 'liability', true, 'Employee income tax withholding'),
    (p_tenant_id, '2050', 'Wages Payable', 'liability', true, 'Staff wages accrued but not yet paid')
  on conflict (tenant_id, code) do nothing;

  -- Revenue
  insert into chart_of_accounts (tenant_id, code, name, account_type, is_system, description) values
    (p_tenant_id, '4000', 'Service Revenue', 'revenue', true, 'Revenue from haircuts and services'),
    (p_tenant_id, '4010', 'Product Revenue', 'revenue', true, 'Revenue from retail product sales'),
    (p_tenant_id, '4900', 'Discounts Given', 'contra_revenue', true, 'Discounts applied to sales')
  on conflict (tenant_id, code) do nothing;

  -- Cost of Goods Sold
  insert into chart_of_accounts (tenant_id, code, name, account_type, is_system, description) values
    (p_tenant_id, '5000', 'Cost of Goods Sold', 'expense', true, 'Cost of products sold')
  on conflict (tenant_id, code) do nothing;

  -- Operating Expenses
  insert into chart_of_accounts (tenant_id, code, name, account_type, is_system, description) values
    (p_tenant_id, '6000', 'Salary Expense', 'expense', true, 'Staff base salaries'),
    (p_tenant_id, '6010', 'Commission Expense', 'expense', true, 'Staff commissions'),
    (p_tenant_id, '6020', 'Bonus Expense', 'expense', true, 'Staff bonuses'),
    (p_tenant_id, '6030', 'Employer EPF', 'expense', true, 'Employer EPF contributions'),
    (p_tenant_id, '6040', 'Employer SOCSO', 'expense', true, 'Employer SOCSO contributions'),
    (p_tenant_id, '6050', 'Employer EIS', 'expense', true, 'Employer EIS contributions'),
    (p_tenant_id, '6100', 'Rent', 'expense', true, 'Shop rental'),
    (p_tenant_id, '6110', 'Utilities', 'expense', true, 'Electricity, water, internet'),
    (p_tenant_id, '6120', 'Supplies', 'expense', true, 'Consumable supplies'),
    (p_tenant_id, '6130', 'Equipment', 'expense', true, 'Equipment purchases'),
    (p_tenant_id, '6140', 'Marketing', 'expense', true, 'Advertising and promotions'),
    (p_tenant_id, '6900', 'Other Expenses', 'expense', true, 'Miscellaneous expenses')
  on conflict (tenant_id, code) do nothing;

  -- Equity
  insert into chart_of_accounts (tenant_id, code, name, account_type, is_system, description) values
    (p_tenant_id, '3000', 'Owner Equity', 'equity', true, 'Owner capital and retained earnings')
  on conflict (tenant_id, code) do nothing;
end;
$$;

grant execute on function seed_default_chart_of_accounts(uuid) to authenticated;


-- ─── Trial Balance RPC ──────────────────────────────────────────────────────

create or replace function report_trial_balance(
  p_tenant_id uuid,
  p_as_of     date default current_date
)
returns table (
  account_id    uuid,
  account_code  text,
  account_name  text,
  account_type  text,
  total_debit   numeric,
  total_credit  numeric,
  balance       numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id              as account_id,
    a.code            as account_code,
    a.name            as account_name,
    a.account_type,
    coalesce(sum(jl.debit_amount), 0)  as total_debit,
    coalesce(sum(jl.credit_amount), 0) as total_credit,
    coalesce(sum(jl.debit_amount), 0) - coalesce(sum(jl.credit_amount), 0) as balance
  from chart_of_accounts a
  left join journal_lines jl on jl.account_id = a.id
    and jl.tenant_id = p_tenant_id
  left join journal_entries je on je.id = jl.journal_entry_id
    and je.entry_date <= p_as_of
  where a.tenant_id = p_tenant_id
    and a.is_active = true
  group by a.id, a.code, a.name, a.account_type
  having coalesce(sum(jl.debit_amount), 0) != 0
    or coalesce(sum(jl.credit_amount), 0) != 0
  order by a.code;
$$;

grant execute on function report_trial_balance(uuid, date) to authenticated;


-- ─── P&L from ledger ────────────────────────────────────────────────────────

create or replace function report_pnl_from_ledger(
  p_tenant_id uuid,
  p_start     date,
  p_end       date
)
returns table (
  account_id    uuid,
  account_code  text,
  account_name  text,
  account_type  text,
  total_amount  numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id              as account_id,
    a.code            as account_code,
    a.name            as account_name,
    a.account_type,
    case
      when a.account_type in ('revenue') then
        coalesce(sum(jl.credit_amount), 0) - coalesce(sum(jl.debit_amount), 0)
      when a.account_type in ('contra_revenue') then
        coalesce(sum(jl.debit_amount), 0) - coalesce(sum(jl.credit_amount), 0)
      else
        coalesce(sum(jl.debit_amount), 0) - coalesce(sum(jl.credit_amount), 0)
    end as total_amount
  from chart_of_accounts a
  join journal_lines jl on jl.account_id = a.id and jl.tenant_id = p_tenant_id
  join journal_entries je on je.id = jl.journal_entry_id
  where a.tenant_id = p_tenant_id
    and a.account_type in ('revenue', 'expense', 'contra_revenue')
    and je.entry_date >= p_start
    and je.entry_date <= p_end
  group by a.id, a.code, a.name, a.account_type
  order by a.code;
$$;

grant execute on function report_pnl_from_ledger(uuid, date, date) to authenticated;
