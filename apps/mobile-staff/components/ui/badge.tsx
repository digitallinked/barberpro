import { View, Text } from "react-native";

type BadgeVariant =
  | "waiting"
  | "in_service"
  | "completed"
  | "no_show"
  | "booked"
  | "confirmed"
  | "cancelled"
  | "low_stock"
  | "default";

const variantConfig: Record<BadgeVariant, { container: string; text: string; label?: string }> = {
  waiting: { container: "bg-yellow-500/20 border border-yellow-500/30", text: "text-yellow-400", label: "Waiting" },
  in_service: { container: "bg-blue-500/20 border border-blue-500/30", text: "text-blue-400", label: "In Service" },
  completed: { container: "bg-emerald-500/20 border border-emerald-500/30", text: "text-emerald-400", label: "Completed" },
  no_show: { container: "bg-gray-500/20 border border-gray-500/30", text: "text-gray-400", label: "No Show" },
  booked: { container: "bg-blue-500/20 border border-blue-500/30", text: "text-blue-400", label: "Booked" },
  confirmed: { container: "bg-emerald-500/20 border border-emerald-500/30", text: "text-emerald-400", label: "Confirmed" },
  cancelled: { container: "bg-red-500/20 border border-red-500/30", text: "text-red-400", label: "Cancelled" },
  low_stock: { container: "bg-orange-500/20 border border-orange-500/30", text: "text-orange-400", label: "Low Stock" },
  default: { container: "bg-white/10 border border-white/10", text: "text-white/70" },
};

type BadgeProps = {
  status: string;
  label?: string;
  className?: string;
};

export function Badge({ status, label, className = "" }: BadgeProps) {
  const config = variantConfig[status as BadgeVariant] ?? variantConfig.default;
  const displayLabel = label ?? config.label ?? status;

  return (
    <View className={`rounded-full px-2.5 py-0.5 ${config.container} ${className}`}>
      <Text className={`text-xs font-medium ${config.text}`}>{displayLabel}</Text>
    </View>
  );
}
