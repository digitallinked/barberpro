import { StatusBar } from "expo-status-bar";
import { SafeAreaView, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          padding: 24
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#0f172a" }}>
          BarberPro Mobile
        </Text>
        <Text style={{ fontSize: 14, color: "#475569", textAlign: "center" }}>
          Expo foundation is ready. Mobile modules will be added in the next
          steps.
        </Text>
        <StatusBar style="dark" />
      </View>
    </SafeAreaView>
  );
}
