export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-500/10 text-green-400",
    trialing: "bg-blue-500/10 text-blue-400",
    past_due: "bg-yellow-500/10 text-yellow-400",
    canceled: "bg-red-500/10 text-red-400",
    suspended: "bg-red-500/10 text-red-400",
    unpaid: "bg-red-500/10 text-red-400",
    churned: "bg-muted text-muted-foreground",
    none: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
