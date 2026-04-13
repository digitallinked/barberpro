import { View, Text } from "react-native";
import { Card } from "./card";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
};

export function StatCard({ title, value, subtitle, className = "" }: StatCardProps) {
  return (
    <Card className={className}>
      <Text className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
        {title}
      </Text>
      <Text className="text-white text-3xl font-bold mb-1">{value}</Text>
      {subtitle && (
        <Text className="text-white/50 text-sm">{subtitle}</Text>
      )}
    </Card>
  );
}
