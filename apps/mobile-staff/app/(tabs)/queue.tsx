import { View, Text, ScrollView } from "react-native";

export default function QueueScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>Queue</Text>
      <Text style={{ color: "#666", marginTop: 4 }}>Current queue for your branch</Text>

      <View style={{ marginTop: 40, alignItems: "center" }}>
        <Text style={{ color: "#999", fontSize: 16 }}>No customers in queue</Text>
      </View>
    </ScrollView>
  );
}
