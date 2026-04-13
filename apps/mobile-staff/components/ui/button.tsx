import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from "react-native";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: ViewStyle;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand-gold",
  secondary: "bg-brand-border",
  danger: "bg-red-700",
  ghost: "bg-transparent border border-brand-border",
};

const labelStyles: Record<ButtonVariant, string> = {
  primary: "text-brand-dark font-bold",
  secondary: "text-white font-semibold",
  danger: "text-white font-semibold",
  ghost: "text-white font-semibold",
};

export function Button({
  onPress,
  label,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      className={`rounded-xl py-3 px-4 items-center justify-center flex-row gap-2 ${variantStyles[variant]} ${disabled || loading ? "opacity-50" : ""} ${className}`}
      activeOpacity={0.75}
    >
      {loading && <ActivityIndicator size="small" color={variant === "primary" ? "#121212" : "#fff"} />}
      <Text className={`text-base ${labelStyles[variant]}`}>{label}</Text>
    </TouchableOpacity>
  );
}
