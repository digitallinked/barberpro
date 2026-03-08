import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  Download,
  Eye,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  TrendingUp
} from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Total Items", value: "124", icon: Package, iconBg: "bg-blue-500/10", iconColor: "text-blue-400", trend: "+8 this month" },
  { label: "Stock Value", value: "RM 45,280", icon: TrendingUp, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400", trend: "+15% vs last" },
  { label: "Avg Margin", value: "38%", icon: ArrowUpRight, iconBg: "bg-purple-500/10", iconColor: "text-purple-400", trend: "Across all items" }
];

const INVENTORY = [
  { sku: "SKU-2301", name: "Pomade Matte Clay", category: "Retail Product", stock: 2, maxStock: 50, branch: "KL Sentral HQ", supplier: "Mentega Co.", cost: "RM 18.00", sell: "RM 35.00", margin: "47%", status: "critical" },
  { sku: "SKU-2302", name: "Shaving Foam XL", category: "Consumable", stock: 1, maxStock: 30, branch: "KL Sentral HQ", supplier: "Barber Supply MY", cost: "RM 12.00", sell: "-", margin: "-", status: "critical" },
  { sku: "SKU-1204", name: "Hair Wax Strong Hold", category: "Retail Product", stock: 24, maxStock: 50, branch: "Bangsar Branch", supplier: "Mentega Co.", cost: "RM 22.00", sell: "RM 40.00", margin: "45%", status: "ok" },
  { sku: "SKU-3401", name: "Face Towels (White)", category: "Consumable", stock: 5, maxStock: 100, branch: "KL Sentral HQ", supplier: "Linen Supply KL", cost: "RM 3.50", sell: "-", margin: "-", status: "low" },
  { sku: "SKU-1501", name: "Beard Oil Premium", category: "Retail Product", stock: 15, maxStock: 40, branch: "KL Sentral HQ", supplier: "Mentega Co.", cost: "RM 25.00", sell: "RM 55.00", margin: "55%", status: "ok" },
  { sku: "SKU-2205", name: "Disposable Razors", category: "Consumable", stock: 45, maxStock: 200, branch: "All Branches", supplier: "Barber Supply MY", cost: "RM 0.80", sell: "-", margin: "-", status: "ok" }
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

function StockBar({ stock, max, status }: { stock: number; max: number; status: string }) {
  const pct = Math.min((stock / max) * 100, 100);
  const color = status === "critical" ? "bg-red-500" : status === "low" ? "bg-yellow-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-white/5">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold ${status === "critical" ? "text-red-400" : status === "low" ? "text-yellow-400" : "text-emerald-400"}`}>
        {stock}
      </span>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Inventory Management</h2>
          <p className="mt-1 text-sm text-gray-400">Track stock levels, products and supplies</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white transition hover:border-[#D4AF37]/40">
            <Download className="h-4 w-4" /> Export
          </button>
          <button type="button" className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                <span className={`rounded-lg p-2 ${s.iconBg}`}><Icon className={`h-4 w-4 ${s.iconColor}`} /></span>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-white">{s.value}</h3>
              <p className="mt-1 text-xs text-gray-500">{s.trend}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search items, SKU..." className="w-full rounded-lg border border-white/10 bg-[#111] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37]" />
          </div>
          <div className="flex gap-2">
            <button type="button" className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-gray-400 hover:text-white">Category <ChevronDown className="h-3 w-3" /></button>
            <button type="button" className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-gray-400 hover:text-white">Branch <ChevronDown className="h-3 w-3" /></button>
            <button type="button" className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:text-red-300">
              <AlertTriangle className="h-3 w-3" /> Low Stock
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="p-4 text-left">SKU</th>
                <th className="p-4 text-left">Item Name</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Stock Level</th>
                <th className="p-4 text-left">Branch</th>
                <th className="p-4 text-left">Supplier</th>
                <th className="p-4 text-left">Cost Price</th>
                <th className="p-4 text-left">Selling Price</th>
                <th className="p-4 text-left">Margin</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {INVENTORY.map((item) => (
                <tr key={item.sku} className="border-t border-white/[0.04] transition hover:bg-white/[0.02]">
                  <td className="p-4 font-mono text-xs text-gray-500">{item.sku}</td>
                  <td className="p-4 font-medium text-white">{item.name}</td>
                  <td className="p-4 text-gray-300">{item.category}</td>
                  <td className="p-4"><StockBar stock={item.stock} max={item.maxStock} status={item.status} /></td>
                  <td className="p-4 text-gray-300">{item.branch}</td>
                  <td className="p-4 text-gray-300">{item.supplier}</td>
                  <td className="p-4 text-gray-300">{item.cost}</td>
                  <td className="p-4 font-bold text-white">{item.sell}</td>
                  <td className={`p-4 font-medium ${item.margin !== "-" ? "text-emerald-400" : "text-gray-500"}`}>{item.margin}</td>
                  <td className="p-4">
                    <span className={`rounded border px-2 py-0.5 text-xs font-bold ${
                      item.status === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      item.status === "low" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {item.status === "critical" ? "Critical" : item.status === "low" ? "Low" : "In Stock"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button type="button" className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-white"><Eye className="h-4 w-4" /></button>
                      <button type="button" className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></button>
                      <button type="button" className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
