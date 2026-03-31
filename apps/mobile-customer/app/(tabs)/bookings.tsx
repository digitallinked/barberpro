import { View, Text, ScrollView } from "react-native";

export default function BookingsScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>Bookings</Text>
      <Text style={{ color: "#666", marginTop: 4 }}>Your upcoming appointments</Text>

      <View style={{ marginTop: 40, alignItems: "center" }}>
        <Text style={{ color: "#999", fontSize: 16 }}>No upcoming bookings</Text>
        <Text style={{ color: "#999", marginTop: 4 }}>Book a barber to get started!</Text>
      </View>
    </ScrollView>
  );
}
