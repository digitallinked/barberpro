import { View, ScrollView, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  className?: string;
};

export function Screen({ children, scrollable = false, className = "" }: ScreenProps) {
  if (scrollable) {
    return (
      <SafeAreaView className="flex-1 bg-brand-dark">
        <ScrollView
          className={`flex-1 ${className}`}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className={`flex-1 ${className}`}>{children}</View>
    </SafeAreaView>
  );
}
