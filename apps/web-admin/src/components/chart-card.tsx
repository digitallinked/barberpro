import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function ChartCard({ title, description, children, action, className }: ChartCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-5", className)}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
