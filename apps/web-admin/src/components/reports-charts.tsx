"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DataPoint = {
  month: string;
  total: number;
  active: number;
};

export function TenantGrowthLineChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
          cursor={{ stroke: "hsl(225 70% 60%)", strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="hsl(225 70% 60%)"
          strokeWidth={2}
          dot={false}
          name="Total tenants"
        />
        <Line
          type="monotone"
          dataKey="active"
          stroke="hsl(142 71% 45%)"
          strokeWidth={2}
          dot={false}
          name="Active tenants"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
