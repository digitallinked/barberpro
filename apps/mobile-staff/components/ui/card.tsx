import { View } from "react-native";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <View
      className={`bg-brand-darkcard border border-brand-border rounded-2xl p-4 ${className}`}
    >
      {children}
    </View>
  );
}
