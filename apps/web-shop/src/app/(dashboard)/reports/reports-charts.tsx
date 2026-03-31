"use client";

import type { TooltipProps } from "recharts";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const GOLD = "#D4AF37";
const MUTED = "#9ca3af";
const GRID = "rgba(255,255,255,0.06)";

const PIE_COLORS = [
  "#D4AF37",
  "#34d399",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#fbbf24",
  "#22d3ee",
  "#fb923c",
  "#94a3b8",
  "#4ade80",
];

function ChartShell({
  title,
  subtitle,
  children,
  empty,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#1a1a1a]">
      <div className="border-b border-white/5 px-5 py-4">
        <h3 className="font-bold text-white">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p> : null}
      </div>
      <div className="p-4 pb-5">
        {empty ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-gray-500">No data for chart</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function DarkTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#252525] px-3 py-2 text-xs shadow-xl">
      {label != null && label !== "" && <p className="mb-1 font-medium text-white">{label}</p>}
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="tabular-nums text-gray-300">
          <span style={{ color: p.color }}>{p.name}: </span>
          {typeof p.value === "number" ? `RM ${p.value.toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  );
}

const axisTick = { fill: MUTED, fontSize: 11 };

export function RevenueTrendChart(props: {
  data: { label: string; revenue: number; txs: number }[];
}) {
  const { data } = props;
  const empty = data.length === 0;
  return (
    <ChartShell title="Revenue trend" subtitle="Totals over the selected period" empty={empty}>
      <div className="h-[260px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="reportsRevFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis
              dataKey="label"
              tick={axisTick}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <Tooltip content={<DarkTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={GOLD}
              strokeWidth={2}
              fill="url(#reportsRevFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

export function PaymentMixChart(props: { data: { name: string; value: number }[] }) {
  const { data } = props;
  const empty = data.length === 0 || data.every((d) => d.value <= 0);
  return (
    <ChartShell title="Payment mix" subtitle="Share of revenue by method" empty={empty}>
      <div className="h-[280px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgba(0,0,0,0.2)" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const p = payload[0].payload as { name: string; value: number };
                const total = data.reduce((s, d) => s + d.value, 0);
                const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
                return (
                  <div className="rounded-lg border border-white/10 bg-[#252525] px-3 py-2 text-xs shadow-xl">
                    <p className="font-medium text-white">{p.name}</p>
                    <p className="text-gray-300">RM {p.value.toFixed(2)}</p>
                    <p className="text-gray-500">{pct}%</p>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => <span className="text-gray-400">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

export function ServiceProductDonut(props: { service: number; product: number }) {
  const { service, product } = props;
  const data = [
    { name: "Services", value: service },
    { name: "Products", value: product },
  ];
  const empty = service <= 0 && product <= 0;
  return (
    <ChartShell title="Service vs product" subtitle="Line revenue split" empty={empty}>
      <div className="h-[240px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={2}
            >
              <Cell fill="#34d399" />
              <Cell fill="#60a5fa" />
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const p = payload[0].payload as { name: string; value: number };
                const t = service + product;
                const pct = t > 0 ? ((p.value / t) * 100).toFixed(1) : "0";
                return (
                  <div className="rounded-lg border border-white/10 bg-[#252525] px-3 py-2 text-xs shadow-xl">
                    <p className="font-medium text-white">{p.name}</p>
                    <p className="text-gray-300">RM {p.value.toFixed(2)}</p>
                    <p className="text-gray-500">{pct}%</p>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => <span className="text-gray-400">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

export function TopServicesBarChart(props: { data: { name: string; revenue: number }[] }) {
  const chartData = [...props.data]
    .sort((a, b) => a.revenue - b.revenue)
    .map((r) => ({
      name: r.name.length > 22 ? `${r.name.slice(0, 20)}…` : r.name,
      revenue: r.revenue,
    }));
  const empty = chartData.length === 0;
  const h = Math.max(200, chartData.length * 36);
  return (
    <ChartShell title="Top services" subtitle="Revenue by service line" empty={empty}>
      <div className="w-full min-w-0" style={{ height: h }}>
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
            <XAxis
              type="number"
              tick={axisTick}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="revenue" name="Revenue" fill="#34d399" radius={[0, 4, 4, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

export function StaffRevenueBarChart(props: { data: { name: string; revenue: number }[] }) {
  const chartData = [...props.data]
    .filter((d) => d.revenue > 0)
    .sort((a, b) => a.revenue - b.revenue)
    .slice(-10)
    .map((r) => ({
      name: r.name.length > 18 ? `${r.name.slice(0, 16)}…` : r.name,
      revenue: r.revenue,
    }));
  const empty = chartData.length === 0;
  const h = Math.max(200, chartData.length * 40);
  return (
    <ChartShell title="Attributed revenue" subtitle="Top staff by line revenue" empty={empty}>
      <div className="w-full min-w-0">
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
            <XAxis
              type="number"
              tick={axisTick}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <YAxis type="category" dataKey="name" width={92} tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="revenue" name="Revenue" fill={GOLD} radius={[0, 4, 4, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

export function CustomerSpendBarChart(props: { data: { name: string; spend: number }[] }) {
  const chartData = props.data.slice(0, 10).map((c) => ({
    name: c.name.length > 14 ? `${c.name.slice(0, 12)}…` : c.name,
    spend: c.spend,
  }));
  const empty = chartData.length === 0;
  return (
    <ChartShell title="Top customers" subtitle="Spend in selected period" empty={empty}>
      <div className="h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis
              dataKey="name"
              tick={axisTick}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={false}
              angle={-35}
              textAnchor="end"
              height={56}
              interval={0}
            />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="spend" name="Spend" fill="#a78bfa" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

export function InventoryValueChart(props: { cost: number; retail: number }) {
  const { cost, retail } = props;
  const data = [
    { name: "At cost", value: cost },
    { name: "At retail", value: retail },
  ];
  const empty = cost <= 0 && retail <= 0;
  return (
    <ChartShell title="Stock valuation" subtitle="Total inventory value" empty={empty}>
      <div className="h-[260px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} tickLine={false} />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]} maxBarSize={64}>
              <Cell fill="#94a3b8" />
              <Cell fill={GOLD} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

export function ExpenseCategoryChart(props: { data: { category: string; total: number }[] }) {
  const chartData = props.data.slice(0, 10).map((r) => ({
    name: r.category.length > 16 ? `${r.category.slice(0, 14)}…` : r.category,
    value: r.total,
  }));
  const empty = chartData.length === 0;
  return (
    <ChartShell title="Expenses by category" subtitle="Distribution in selected period" empty={empty}>
      <div className="h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={96}
              paddingAngle={1}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgba(0,0,0,0.15)" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const p = payload[0].payload as { name: string; value: number };
                return (
                  <div className="rounded-lg border border-white/10 bg-[#252525] px-3 py-2 text-xs shadow-xl">
                    <p className="font-medium text-white">{p.name}</p>
                    <p className="text-gray-300">RM {p.value.toFixed(2)}</p>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 12 }}
              formatter={(value) => <span className="text-gray-400">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

export function PlTrendChart(props: {
  data: { label: string; revenue: number; expenses: number; payroll: number; profit: number }[];
}) {
  const { data } = props;
  const empty = data.length === 0;
  return (
    <ChartShell title="P&L trend" subtitle="Year-to-date by month" empty={empty}>
      <div className="h-[320px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} tickLine={false} />
            <YAxis
              yAxisId="left"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <Tooltip content={<DarkTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => <span className="text-gray-400">{value}</span>}
            />
            <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill={GOLD} radius={[2, 2, 0, 0]} maxBarSize={28} />
            <Bar yAxisId="left" dataKey="expenses" name="Expenses" fill="#f87171" radius={[2, 2, 0, 0]} maxBarSize={28} />
            <Bar yAxisId="left" dataKey="payroll" name="Payroll" fill="#fb923c" radius={[2, 2, 0, 0]} maxBarSize={28} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="profit"
              name="Gross profit"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 3, fill: "#34d399" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

export function AnnualTaxSummaryChart(props: {
  grossRevenue: number;
  expenses: number;
  netIncome: number;
}) {
  const { grossRevenue, expenses, netIncome } = props;
  const data = [
    { name: "Gross receipts", value: grossRevenue },
    { name: "Expenses", value: expenses },
    { name: "Net (app est.)", value: netIncome },
  ];
  const empty = grossRevenue <= 0 && expenses <= 0;
  return (
    <ChartShell title="Tax year snapshot" subtitle="High-level comparison (calendar year)" empty={empty}>
      <div className="h-[280px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} tickLine={false} />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]} maxBarSize={72}>
              <Cell fill={GOLD} />
              <Cell fill="#f87171" />
              <Cell fill="#34d399" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

export function EmployerStatutoryBar(props: { epf: number; socso: number; eis: number }) {
  const { epf, socso, eis } = props;
  const data = [
    { name: "EPF (er.)", value: epf },
    { name: "SOCSO (er.)", value: socso },
    { name: "EIS (er.)", value: eis },
  ];
  const empty = epf + socso + eis <= 0;
  return (
    <ChartShell title="Employer levies" subtitle="Estimated employer contributions" empty={empty}>
      <div className="h-[240px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
            <XAxis
              type="number"
              tick={axisTick}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <YAxis type="category" dataKey="name" width={88} tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="value" name="Amount" fill="#fb923c" radius={[0, 4, 4, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}
