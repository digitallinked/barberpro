import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

const uuid = z.string().uuid("Invalid ID format");
const optionalUuid = z.string().uuid("Invalid ID format").nullable().optional();
const trimmedString = (max = 255) => z.string().trim().min(1).max(max);
const optionalString = (max = 255) =>
  z.string().trim().max(max).nullable().optional().transform((v) => v || null);
const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)");
const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
  .nullable()
  .optional()
  .transform((v) => v || null);
const nonNegative = z.coerce.number().min(0);
const positiveAmount = z.coerce.number().positive("Amount must be greater than 0");

export const PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "e_wallet",
  "duitnow_qr",
  "split",
] as const;

export const STAFF_ROLES = ["owner", "manager", "barber", "cashier"] as const;
export const INVITABLE_ROLES = ["manager", "barber", "cashier"] as const;

export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export const QUEUE_STATUSES = [
  "waiting",
  "in_service",
  "completed",
  "cancelled",
  "paid",
] as const;

export const ATTENDANCE_STATUSES = ["present", "absent", "late", "half_day"] as const;

export const INVENTORY_TYPES = ["product", "supply"] as const;

export const INVENTORY_MOVEMENT_TYPES = [
  "in",
  "out",
  "restock",
  "adjustment_in",
  "adjustment_out",
  "sale",
] as const;

export const EXPENSE_CATEGORIES = [
  "rent",
  "utilities",
  "salary",
  "employer_statutory",
  "supplies",
  "marketing",
  "equipment",
  "maintenance",
  "other",
] as const;

export const PAYOUT_MODELS = [
  "percentage",
  "per_customer",
  "per_service",
  "base_only",
  "tiered",
] as const;

export const APPOINTMENT_SOURCES = ["manual", "online", "walkin"] as const;

// ─── Customer ─────────────────────────────────────────────────────────────────

export const customerSchema = z.object({
  full_name: trimmedString(100),
  phone: z.string().trim().min(1, "Phone is required").max(30),
  email: z.string().trim().email("Invalid email").max(255).nullable().optional().transform((v) => v || null),
  date_of_birth: optionalDate,
  notes: optionalString(1000),
});

export type CustomerInput = z.infer<typeof customerSchema>;

// ─── Branch ───────────────────────────────────────────────────────────────────

export const branchSchema = z.object({
  name: trimmedString(100),
  code: trimmedString(20),
  phone: optionalString(30),
  email: z.string().trim().email("Invalid email").max(255).nullable().optional().transform((v) => v || null),
  address: optionalString(500),
  operating_hours: z
    .string()
    .trim()
    .optional()
    .transform((v) => {
      if (!v) return {};
      try {
        return JSON.parse(v) as Record<string, unknown>;
      } catch {
        return {};
      }
    }),
  is_hq: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === "true" || v === "1"),
  latitude: z.coerce
    .number()
    .min(-90)
    .max(90)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  longitude: z.coerce
    .number()
    .min(-180)
    .max(180)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

export type BranchInput = z.infer<typeof branchSchema>;

// ─── Commission scheme ────────────────────────────────────────────────────────

const jsonField = z
  .string()
  .optional()
  .transform((v) => {
    if (!v) return {};
    try {
      return JSON.parse(v) as Record<string, unknown>;
    } catch {
      return {};
    }
  });

export const commissionSchemeSchema = z.object({
  name: trimmedString(100),
  payout_model: z.enum(PAYOUT_MODELS, { errorMap: () => ({ message: "Invalid payout model" }) }),
  base_salary: nonNegative,
  per_customer_amount: nonNegative,
  per_service_amount: nonNegative,
  percentage_rate: z.coerce.number().min(0).max(100),
  product_commission_rate: z.coerce.number().min(0).max(100),
  target_bonus_rules: jsonField,
  deduction_rules: jsonField,
});

export type CommissionSchemeInput = z.infer<typeof commissionSchemeSchema>;

export const commissionAssignmentSchema = z.object({
  scheme_id: uuid,
  staff_id: uuid,
  effective_from: dateString,
  effective_to: optionalDate,
});

export type CommissionAssignmentInput = z.infer<typeof commissionAssignmentSchema>;

// ─── Catalog (services) ───────────────────────────────────────────────────────

export const serviceSchema = z.object({
  name: trimmedString(100),
  duration_min: nonNegative,
  price: nonNegative,
  category_id: optionalUuid,
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export const serviceCategorySchema = z.object({
  name: trimmedString(100),
});

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventoryItemSchema = z.object({
  name: trimmedString(100),
  sku: optionalString(50),
  item_type: z.enum(INVENTORY_TYPES, { errorMap: () => ({ message: "Invalid item type" }) }),
  unit_cost: nonNegative,
  sell_price: z.coerce.number().min(0).nullable().optional().transform((v) => v ?? null),
  stock_qty: nonNegative,
  reorder_level: nonNegative,
  supplier_id: optionalUuid,
  branch_id: optionalUuid,
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;

export const stockAdjustmentSchema = z.object({
  quantity: z.number().positive("Quantity must be greater than 0"),
  movementType: z.enum(INVENTORY_MOVEMENT_TYPES, {
    errorMap: () => ({ message: "Invalid movement type" }),
  }),
  reason: z.string().trim().max(500).optional().transform((v) => v || null),
});

// ─── Expense ──────────────────────────────────────────────────────────────────

export const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES, { errorMap: () => ({ message: "Invalid category" }) }),
  vendor: optionalString(100),
  amount: positiveAmount,
  payment_method: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: "Invalid payment method" }),
  }),
  expense_date: dateString,
  notes: optionalString(1000),
  branch_id: optionalUuid,
  receipt_url: optionalString(1000),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

// ─── Payroll ──────────────────────────────────────────────────────────────────

export const payrollPeriodSchema = z
  .object({
    period_start: dateString,
    period_end: dateString,
    branch_id: optionalUuid,
  })
  .refine((d) => d.period_end >= d.period_start, {
    message: "Period end must be on or after period start",
    path: ["period_end"],
  });

export type PayrollPeriodInput = z.infer<typeof payrollPeriodSchema>;

export const PAYROLL_STATUSES = ["draft", "approved", "paid"] as const;

export const payrollStatusSchema = z.enum(PAYROLL_STATUSES, {
  errorMap: () => ({ message: "Invalid payroll status" }),
});

export const payrollEntrySchema = z.object({
  payroll_period_id: uuid,
  staff_id: uuid,
  base_salary: nonNegative,
  service_commission: nonNegative,
  product_commission: nonNegative,
  bonuses: nonNegative,
  deductions: nonNegative,
  advances: nonNegative,
  notes: optionalString(1000),
  days_worked: z.coerce.number().min(0).nullable().optional().transform((v) => v ?? null),
  total_working_days: z.coerce.number().min(0).nullable().optional().transform((v) => v ?? null),
  service_revenue: z.coerce.number().min(0).nullable().optional().transform((v) => v ?? null),
  product_revenue: z.coerce.number().min(0).nullable().optional().transform((v) => v ?? null),
  services_count: z.coerce.number().int().min(0).nullable().optional().transform((v) => v ?? null),
  customers_served: z.coerce.number().int().min(0).nullable().optional().transform((v) => v ?? null),
});

export type PayrollEntryInput = z.infer<typeof payrollEntrySchema>;

// ─── Appointment ──────────────────────────────────────────────────────────────

export const appointmentSchema = z.object({
  customer_id: uuid,
  service_id: uuid,
  barber_staff_id: optionalUuid,
  branch_id: uuid,
  start_at: z.string().trim().min(1, "Start time is required"),
  end_at: z.string().trim().nullable().optional().transform((v) => v || null),
  source: z.enum(APPOINTMENT_SOURCES).default("manual"),
  notes: optionalString(1000),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES, {
  errorMap: () => ({ message: "Invalid appointment status" }),
});

// ─── Queue ────────────────────────────────────────────────────────────────────

export const createQueueTicketSchema = z.object({
  branch_id: optionalUuid,
  customer_id: optionalUuid,
  service_id: optionalUuid,
  preferred_staff_id: optionalUuid,
  party_size: z.coerce.number().int().min(1).max(20).default(1),
});

export type CreateQueueTicketInput = z.infer<typeof createQueueTicketSchema>;

export const queueStatusSchema = z.enum(QUEUE_STATUSES, {
  errorMap: () => ({ message: "Invalid queue status" }),
});

export const queuePaymentSchema = z.object({
  ticket_id: uuid,
  payment_method: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: "Invalid payment method" }),
  }),
  amount_due: positiveAmount,
  amount_received: z.coerce.number().positive("Amount received must be greater than 0"),
  proof_storage_path: z.string().trim().nullable().optional().transform((v) => v || null),
});

// ─── POS transaction ──────────────────────────────────────────────────────────

export const posTransactionItemSchema = z.object({
  itemType: z.enum(["service", "product"], {
    errorMap: () => ({ message: "Invalid item type" }),
  }),
  serviceId: optionalUuid,
  inventoryItemId: optionalUuid,
  staffId: optionalUuid,
  name: trimmedString(200),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unitPrice: nonNegative,
  lineTotal: nonNegative,
});

export const posTransactionSchema = z.object({
  branchId: uuid,
  customerId: optionalUuid,
  queueTicketId: optionalUuid,
  paymentMethod: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: "Invalid payment method" }),
  }),
  items: z.array(posTransactionItemSchema).min(1, "At least one item is required"),
  subtotal: nonNegative,
  discountAmount: nonNegative,
  taxAmount: nonNegative,
  totalAmount: positiveAmount,
  proofStoragePath: z.string().trim().nullable().optional().transform((v) => v || null),
});

export type PosTransactionInput = z.infer<typeof posTransactionSchema>;

export const linkedQueueCheckoutSchema = z.object({
  queueTicketId: uuid,
  paymentMethod: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: "Invalid payment method" }),
  }),
  products: z.array(
    z.object({
      inventoryItemId: uuid,
      name: trimmedString(200),
      quantity: z.number().int().positive(),
      unitPrice: nonNegative,
      lineTotal: nonNegative,
    })
  ),
  subtotal: nonNegative,
  discountAmount: nonNegative,
  taxAmount: nonNegative,
  totalAmount: positiveAmount,
  proofStoragePath: z.string().trim().nullable().optional().transform((v) => v || null),
});

// ─── Staff ────────────────────────────────────────────────────────────────────

export const staffMemberSchema = z.object({
  full_name: trimmedString(100),
  email: z.string().trim().email("Invalid email").max(255).nullable().optional().transform((v) => v || null),
  phone: optionalString(30),
  role: z.enum(STAFF_ROLES, { errorMap: () => ({ message: "Invalid role" }) }),
  branch_id: optionalUuid,
  employment_type: z
    .enum(["full_time", "part_time", "contract"])
    .optional()
    .default("full_time"),
  base_salary: nonNegative.optional().default(0),
  employee_code: optionalString(50),
  joined_at: optionalDate,
  nric_number: optionalString(20),
  date_of_birth: optionalDate,
  gender: optionalString(20),
  nationality: optionalString(50),
  marital_status: optionalString(20),
  num_dependents: z.coerce.number().int().min(0).nullable().optional().transform((v) => v ?? null),
  address_line1: optionalString(200),
  address_line2: optionalString(200),
  city: optionalString(100),
  state: optionalString(100),
  postcode: optionalString(10),
  epf_number: optionalString(50),
  epf_enabled: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true"),
  socso_number: optionalString(50),
  socso_enabled: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true"),
  eis_number: optionalString(50),
  tax_ref_number: optionalString(50),
  bank_name: optionalString(100),
  bank_account_number: optionalString(50),
  emergency_contact_name: optionalString(100),
  emergency_contact_phone: optionalString(30),
  notes: optionalString(1000),
});

export type StaffMemberInput = z.infer<typeof staffMemberSchema>;

export const staffInviteSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  full_name: trimmedString(100),
  role: z.enum(INVITABLE_ROLES, { errorMap: () => ({ message: "Invalid role" }) }),
  branch_id: uuid,
});

export type StaffInviteInput = z.infer<typeof staffInviteSchema>;

// ─── Attendance ───────────────────────────────────────────────────────────────

export const attendanceSchema = z.object({
  staff_id: uuid,
  date: dateString,
  status: z.enum(ATTENDANCE_STATUSES).default("present"),
  clock_in: z.string().trim().nullable().optional().transform((v) => v || null),
  clock_out: z.string().trim().nullable().optional().transform((v) => v || null),
  branch_id: optionalUuid,
  notes: optionalString(500),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;

export const bulkAttendanceRecordSchema = z.object({
  staff_id: uuid,
  date: dateString,
  status: z.enum(ATTENDANCE_STATUSES),
  branch_id: z.string().uuid().optional(),
});

// ─── Settings ─────────────────────────────────────────────────────────────────

export const tenantProfileSchema = z.object({
  name: trimmedString(100).optional(),
  email: z.string().trim().email("Invalid email").max(255).optional(),
  phone: optionalString(30),
  address_line1: optionalString(200),
  city: optionalString(100),
  postcode: optionalString(10),
  state: optionalString(100),
  registration_number: optionalString(50),
});

export const changePasswordSchema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
