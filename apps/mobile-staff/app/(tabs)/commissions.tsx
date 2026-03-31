import { View, Text, ScrollView } from "react-native";

export default function CommissionsScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>Earnings</Text>
      <Text style={{ color: "#666", marginTop: 4 }}>Your commission breakdown</Text>

      <View style={{ backgroundColor: "#f8f9fa", borderRadius: 12, padding: 20, marginTop: 24, alignItems: "center" }}>
        <Text style={{ fontSize: 14, color: "#666" }}>Today</Text>
        <Text style={{ fontSize: 36, fontWeight: "bold", marginTop: 4 }}>RM 0.00</Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
        <View style={{ flex: 1, backgroundColor: "#f8f9fa", borderRadius: 12, padding: 16, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: "#666" }}>This Week</Text>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 4 }}>RM 0.00</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: "#f8f9fa", borderRadius: 12, padding: 16, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: "#666" }}>This Month</Text>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 4 }}>RM 0.00</Text>
        </View>
      </View>
    </ScrollView>
  );
}
