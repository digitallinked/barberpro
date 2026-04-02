"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlyDataPoint = {
  month: string;
  count: number;
};

type PlanDataPoint = {
  name: string;
  value: number;
  color: string;
};

export function TenantGrowthChart({ data }: { data: MonthlyDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 22%)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "hsl(215 13% 60%)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(215 13% 60%)" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(222 15% 10%)",
            border: "1px solid hsl(220 10% 22%)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "hsl(210 20% 96%)",
          }}
          cursor={{ fill: "hsl(225 70% 60% / 0.08)" }}
          labelStyle={{ color: "hsl(215 13% 60%)" }}
        />
        <Bar dataKey="count" fill="hsl(225 70% 60%)" radius={[4, 4, 0, 0]} name="New tenants" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const RADIAN = Math.PI / 180;

type CustomLabelProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
};

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomLabelProps) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function PlanDistributionChart({ data }: { data: PlanDataPoint[] }) {
  if (data.every((d) => d.value === 0)) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
        No subscription data yet
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data.filter((d) => d.value > 0)}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel as (props: unknown) => React.ReactElement | null}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(222 15% 10%)",
              border: "1px solid hsl(220 10% 22%)",
              borderRadius: "6px",
              fontSize: "12px",
              color: "hsl(210 20% 96%)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-sm" style={{ background: item.color }} />
            <span className="capitalize text-muted-foreground">{item.name}</span>
            <span className="ml-auto font-semibold tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
