import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";

import { supabase } from "../../lib/supabase";

type Shop = {
  id: string;
  name: string;
  slug: string;
  branches: { city: string | null }[];
};

export default function DiscoverScreen() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShops() {
      const { data } = await supabase
        .from("tenants")
        .select("id, name, slug, branches(city)")
        .eq("status", "active")
        .in("subscription_status", ["active", "trialing"])
        .order("name");

      setShops((data as Shop[]) ?? []);
      setLoading(false);
    }
    fetchShops();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold" }}>Discover</Text>
        <Text style={{ color: "#666", marginTop: 4 }}>{shops.length} barbershops</Text>
      </View>

      <FlatList
        data={shops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 16, marginBottom: 8 }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.name}</Text>
            {item.branches?.[0]?.city && (
              <Text style={{ color: "#666", marginTop: 2 }}>{item.branches[0].city}</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#999", marginTop: 40 }}>No shops found</Text>
        }
      />
    </View>
  );
}
