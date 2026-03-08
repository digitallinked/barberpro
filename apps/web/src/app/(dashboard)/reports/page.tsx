"use client";

import {
  Download,
  DollarSign,
  Package,
  Receipt,
  Users
} from "lucide-react";
import { useState, useMemo } from "react";

import {
  useTransactions,
  useStaffMembers,
  useCustomers,
  useCustomerStats,
  useInventoryItems,
  useInventoryStats,
  useExpenses,
  useExpenseStats
} from "@/hooks";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>
  );
}

function formatAmount(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

const TABS = [
  { id: "revenue", label: "Revenue", icon: DollarSign },
  { id: "staff", label: "Staff Performance", icon: Users },
  { id: "customers", label: "Customers", icon: Users },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "expenses", label: "Expenses", icon: Receipt }
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("revenue");

  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions(200);
  const { data: staffData, isLoading: staffLoading } = useStaffMembers();
  const { data: customersData, isLoading: customersLoading } = useCustomers();
  const { data: customerStatsData } = useCustomerStats();
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryItems();
  const { data: inventoryStatsData } = useInventoryStats();
  const { data: expensesData, isLoading: expensesLoading } = useExpenses();
  const { data: expenseStatsData } = useExpenseStats();

  const transactions = transactionsData?.data ?? [];
  const staffMembers = staffData?.data ?? [];
  const customers = customersData?.data ?? [];
  const customerStats = customerStatsData?.data ?? { total: 0, newThisMonth: 0 };
  const inventoryItems = inventoryData?.data ?? [];
  const inventoryStats = inventoryStatsData?.data ?? { totalItems: 0, lowStock: 0 };
  const expenses = expensesData?.data ?? [];
  const expenseStats = expenseStatsData?.data ?? { total: 0, thisMonth: 0 };

  // Revenue tab: compute this month stats from transactions
  const revenueStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthTx = transactions.filter((t) => {
      const d = new Date(t.created_at);
      return d >= startOfMonth && d <= endOfMonth;
    });

    const totalRevenue = monthTx.reduce((sum, t) => sum + t.total_amount, 0);
    const count = monthTx.length;
    const avg = count > 0 ? totalRevenue / count : 0;

    // Group by date for breakdown
    const byDate = monthTx.reduce<Record<string, { total: number; count: number }>>((acc, t) => {
      const key = t.created_at.split("T")[0] ?? "";
      if (!acc[key]) acc[key] = { total: 0, count: 0 };
      acc[key]!.total += t.total_amount;
      acc[key]!.count += 1;
      return acc;
    }, {});

    const breakdown = Object.entries(byDate)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14);

    return { totalRevenue, count, avg, breakdown };
  }, [transactions]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const cat = e.category ?? "Uncategorized";
      map.set(cat, (map.get(cat) ?? 0) + (e.amount ?? 0));
    }
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const lowStockItems = inventoryItems.filter(
    (i) => i.stock_qty != null && i.reorder_level != null && i.stock_qty <= i.reorder_level
  );

  const isLoading =
    transactionsLoading ||
    staffLoading ||
    customersLoading ||
    inventoryLoading ||
    expensesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Reports &amp; Analytics</h2>
          <p className="mt-1 text-sm text-gray-400">
            Business insights, revenue analytics and performance reports
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white hover:border-[#D4AF37]/40"
        >
          <Download className="h-4 w-4" /> Export Reports
        </button>
      </div>

      {/* Tab selector */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-white/5 bg-[#1a1a1a] p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-[#2a2a2a] text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Revenue tab */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Total Revenue (This Month)
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                {formatAmount(revenueStats.totalRevenue)}
              </h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Transaction Count
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">{revenueStats.count}</h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Average Transaction Value
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                {formatAmount(revenueStats.avg)}
              </h3>
            </Card>
          </div>
          <Card>
            <div className="border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Revenue Breakdown by Date</h3>
              <p className="mt-0.5 text-sm text-gray-500">This month</p>
            </div>
            {revenueStats.breakdown.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">No data yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">Date</th>
                      <th className="p-4 text-left">Transactions</th>
                      <th className="p-4 text-left">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueStats.breakdown.map((row) => (
                      <tr
                        key={row.date}
                        className="border-t border-white/[0.04] hover:bg-white/[0.02]"
                      >
                        <td className="p-4 font-medium text-white">
                          {formatDate(row.date + "T12:00:00")}
                        </td>
                        <td className="p-4 text-gray-300">{row.count}</td>
                        <td className="p-4 font-bold text-[#D4AF37]">
                          {formatAmount(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Staff Performance tab */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Total Staff
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">{staffMembers.length}</h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Barbers
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                {staffMembers.filter((s) => /barber/i.test(s.role ?? "")).length}
              </h3>
            </Card>
          </div>
          <Card>
            <div className="border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Staff List</h3>
              <p className="mt-0.5 text-sm text-gray-500">Performance stats coming soon</p>
            </div>
            {staffMembers.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">No data yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Role</th>
                      <th className="p-4 text-left">Branch</th>
                      <th className="p-4 text-left">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffMembers.map((s) => (
                      <tr
                        key={s.id}
                        className="border-t border-white/[0.04] hover:bg-white/[0.02]"
                      >
                        <td className="p-4 font-medium text-white">{s.full_name}</td>
                        <td className="p-4 text-gray-300">{s.role}</td>
                        <td className="p-4 text-gray-300">—</td>
                        <td className="p-4 text-gray-400">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Customers tab */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Total Customers
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">{customerStats.total}</h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                New This Month
              </p>
              <h3 className="mt-2 text-2xl font-bold text-[#D4AF37]">
                {customerStats.newThisMonth}
              </h3>
            </Card>
          </div>
          <Card>
            <div className="border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Recent Customers</h3>
            </div>
            {customers.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">No data yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Phone</th>
                      <th className="p-4 text-left">Email</th>
                      <th className="p-4 text-left">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.slice(0, 20).map((c) => (
                      <tr
                        key={c.id}
                        className="border-t border-white/[0.04] hover:bg-white/[0.02]"
                      >
                        <td className="p-4 font-medium text-white">{c.full_name}</td>
                        <td className="p-4 text-gray-300">{c.phone ?? "—"}</td>
                        <td className="p-4 text-gray-300">{c.email ?? "—"}</td>
                        <td className="p-4 text-gray-500">
                          {formatDate(c.created_at + "T12:00:00")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Inventory tab */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Total Items
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                {inventoryStats.totalItems}
              </h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Low Stock Items
              </p>
              <h3 className="mt-2 text-2xl font-bold text-red-400">{inventoryStats.lowStock}</h3>
            </Card>
          </div>
          <Card>
            <div className="border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Low Stock Alerts</h3>
            </div>
            {lowStockItems.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">
                No low stock items
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">Item</th>
                      <th className="p-4 text-left">Stock</th>
                      <th className="p-4 text-left">Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-white/[0.04] hover:bg-white/[0.02]"
                      >
                        <td className="p-4 font-medium text-white">{item.name}</td>
                        <td className="p-4 text-red-400">{item.stock_qty ?? 0}</td>
                        <td className="p-4 text-gray-300">{item.reorder_level ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Expenses tab */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Total Expenses (All Time)
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                {formatAmount(expenseStats.total)}
              </h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                This Month
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                {formatAmount(expenseStats.thisMonth)}
              </h3>
            </Card>
          </div>
          <Card>
            <div className="border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Breakdown by Category</h3>
            </div>
            {expensesByCategory.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">No data yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">Category</th>
                      <th className="p-4 text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expensesByCategory.map((row) => (
                      <tr
                        key={row.category}
                        className="border-t border-white/[0.04] hover:bg-white/[0.02]"
                      >
                        <td className="p-4 font-medium text-white">{row.category}</td>
                        <td className="p-4 font-bold text-white">
                          {formatAmount(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
