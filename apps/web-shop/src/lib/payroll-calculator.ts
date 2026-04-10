import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export type CommissionMetrics = {
  serviceRevenue: number;
  productRevenue: number;
  servicesCount: number;
  customersServed: number;
};

export type SchemeRates = {
  percentage_rate: number;
  per_service_amount: number;
  per_customer_amount: number;
  product_commission_rate: number;
  is_active?: boolean;
} | null;

export function commissionAmountsFromScheme(
  scheme: SchemeRates,
  m: CommissionMetrics
): { serviceCommission: number; productCommission: number } {
  if (!scheme || scheme.is_active === false) {
    return { serviceCommission: 0, productCommission: 0 };
  }
  const serviceCommission =
    (scheme.percentage_rate / 100) * m.serviceRevenue +
    scheme.per_service_amount * m.servicesCount +
    scheme.per_customer_amount * m.customersServed;
  const productCommission = (scheme.product_commission_rate / 100) * m.productRevenue;
  return {
    serviceCommission: Math.round(serviceCommission * 100) / 100,
    productCommission: Math.round(productCommission * 100) / 100,
  };
}

export type CommissionCalculation = {
  serviceCommission: number;
  productCommission: number;
  serviceRevenue: number;
  productRevenue: number;
  servicesCount: number;
  customersServed: number;
  schemeName: string | null;
  schemeDetails: {
    percentageRate: number;
    perServiceAmount: number;
    perCustomerAmount: number;
    productCommissionRate: number;
    payoutModel: string;
  } | null;
};

export type StaffPayrollSummary = {
  staffId: string;
  staffName: string;
  baseSalary: number;
  commission: CommissionCalculation;
  attendance: {
    daysWorked: number;
    totalWorkingDays: number;
  };
};

export async function calculateStaffCommission(
  client: Client,
  tenantId: string,
  staffId: string,
  periodStart: string,
  periodEnd: string
): Promise<CommissionCalculation> {
  const empty: CommissionCalculation = {
    serviceCommission: 0,
    productCommission: 0,
    serviceRevenue: 0,
    productRevenue: 0,
    servicesCount: 0,
    customersServed: 0,
    schemeName: null,
    schemeDetails: null,
  };

  const [transResult, schemeResult] = await Promise.all([
    client
      .from("transaction_items")
      .select(
        `
        id,
        item_type,
        line_total,
        staff_id,
        service_id,
        inventory_item_id,
        quantity,
        transactions!inner (id, paid_at, customer_id, payment_status)
      `
      )
      .eq("tenant_id", tenantId)
      .eq("staff_id", staffId)
      .eq("transactions.payment_status", "paid")
      .gte("transactions.paid_at", `${periodStart}T00:00:00Z`)
      .lte("transactions.paid_at", `${periodEnd}T23:59:59Z`),

    client
      .from("staff_commission_assignments")
      .select(
        `
        id,
        scheme_id,
        effective_from,
        effective_to,
        commission_schemes (
          id, name, payout_model, percentage_rate, per_service_amount,
          per_customer_amount, product_commission_rate, base_salary,
          is_active
        )
      `
      )
      .eq("tenant_id", tenantId)
      .eq("staff_id", staffId)
      .lte("effective_from", periodEnd)
      .or(`effective_to.is.null,effective_to.gte.${periodStart}`)
      .order("effective_from", { ascending: false })
      .limit(1),
  ]);

  if (transResult.error || !transResult.data) return empty;

  const items = transResult.data as Array<Record<string, unknown>>;

  let serviceRevenue = 0;
  let productRevenue = 0;
  let servicesCount = 0;
  const customerIds = new Set<string>();

  for (const item of items) {
    const tx = item.transactions as Record<string, unknown> | null;
    if (!tx || tx.payment_status !== "paid") continue;

    const lineTotal = (item.line_total as number) || 0;
    const itemType = item.item_type as string;
    const qty = (item.quantity as number) || 1;
    const customerId = tx.customer_id as string | null;

    if (itemType === "service") {
      serviceRevenue += lineTotal;
      servicesCount += qty;
    } else if (itemType === "product") {
      productRevenue += lineTotal;
    } else {
      serviceRevenue += lineTotal;
      servicesCount += qty;
    }

    if (customerId) customerIds.add(customerId);
  }

  const customersServed = customerIds.size;

  const assignments = (schemeResult.data ?? []) as Array<Record<string, unknown>>;
  const assignment = assignments[0];
  const schemeRaw = assignment?.commission_schemes as Record<string, unknown> | null;

  if (!schemeRaw || schemeRaw.is_active === false) {
    return {
      ...empty,
      serviceRevenue,
      productRevenue,
      servicesCount,
      customersServed,
    };
  }

  const percentageRate = (schemeRaw.percentage_rate as number) || 0;
  const perServiceAmount = (schemeRaw.per_service_amount as number) || 0;
  const perCustomerAmount = (schemeRaw.per_customer_amount as number) || 0;
  const productCommissionRate = (schemeRaw.product_commission_rate as number) || 0;

  const { serviceCommission, productCommission } = commissionAmountsFromScheme(
    {
      percentage_rate: percentageRate,
      per_service_amount: perServiceAmount,
      per_customer_amount: perCustomerAmount,
      product_commission_rate: productCommissionRate,
      is_active: schemeRaw.is_active as boolean,
    },
    { serviceRevenue, productRevenue, servicesCount, customersServed }
  );

  return {
    serviceCommission,
    productCommission,
    serviceRevenue: Math.round(serviceRevenue * 100) / 100,
    productRevenue: Math.round(productRevenue * 100) / 100,
    servicesCount,
    customersServed,
    schemeName: (schemeRaw.name as string) || null,
    schemeDetails: {
      percentageRate,
      perServiceAmount,
      perCustomerAmount,
      productCommissionRate,
      payoutModel: (schemeRaw.payout_model as string) || "unknown",
    },
  };
}

export async function getAttendanceSummaryForPeriod(
  client: Client,
  tenantId: string,
  staffId: string,
  periodStart: string,
  periodEnd: string
): Promise<{ daysWorked: number; totalWorkingDays: number }> {
  const { data } = await client
    .from("staff_attendance")
    .select("id, date, status")
    .eq("tenant_id", tenantId)
    .eq("staff_id", staffId)
    .gte("date", periodStart)
    .lte("date", periodEnd);

  const records = data ?? [];
  const daysWorked = records.filter(
    (r) => r.status === "present" || r.status === "late" || r.status === "half_day"
  ).length;

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  let totalWorkingDays = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) totalWorkingDays++;
    cur.setDate(cur.getDate() + 1);
  }

  return { daysWorked, totalWorkingDays };
}

export async function calculateAllStaffPayroll(
  client: Client,
  tenantId: string,
  periodStart: string,
  periodEnd: string,
  staffList: Array<{ id: string; staff_profile_id: string; full_name: string; base_salary: number }>
): Promise<StaffPayrollSummary[]> {
  const results = await Promise.all(
    staffList.map(async (staff) => {
      const [commission, attendance] = await Promise.all([
        calculateStaffCommission(client, tenantId, staff.staff_profile_id, periodStart, periodEnd),
        getAttendanceSummaryForPeriod(client, tenantId, staff.staff_profile_id, periodStart, periodEnd),
      ]);

      return {
        staffId: staff.staff_profile_id,
        staffName: staff.full_name,
        baseSalary: staff.base_salary,
        commission,
        attendance,
      };
    })
  );

  return results;
}
