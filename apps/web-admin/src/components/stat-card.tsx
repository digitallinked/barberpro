import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type TrendDirection = "up" | "down" | "neutral";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: string;
    direction: TrendDirection;
    label?: string;
  };
  accent?: "default" | "success" | "warning" | "destructive" | "info";
  className?: string;
};

const accentStyles: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "text-primary",
  success: "text-green-400",
  warning: "text-yellow-400",
  destructive: "text-red-400",
  info: "text-blue-400",
};

const accentBg: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "bg-primary/10",
  success: "bg-green-500/10",
  warning: "bg-yellow-500/10",
  destructive: "bg-red-500/10",
  info: "bg-blue-500/10",
};

const trendStyles: Record<TrendDirection, string> = {
  up: "text-green-400",
  down: "text-red-400",
  neutral: "text-muted-foreground",
};

export function StatCard({ label, value, icon: Icon, trend, accent = "default", className }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-5", className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && (
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", accentBg[accent])}>
            <Icon className={cn("h-4 w-4", accentStyles[accent])} />
          </div>
        )}
      </div>
      <p className={cn("mt-3 text-3xl font-bold tabular-nums", accentStyles[accent])}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {trend && (
        <p className={cn("mt-1 text-xs", trendStyles[trend.direction])}>
          {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}{" "}
          {trend.value}
          {trend.label && <span className="ml-1 text-muted-foreground">{trend.label}</span>}
        </p>
      )}
    </div>
  );
}
