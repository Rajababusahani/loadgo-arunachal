import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { paymentLabels, statusLabels, type BookingStatus, type VehicleType, vehicleLabels } from "@loadgo/shared";
import { apiGet } from "../lib/api";
import { useAppPreferences } from "../providers/app-preferences";

type BookingItem = {
  id: string;
  pickup: { address: string };
  drop: { address: string };
  finalPrice: number;
  paymentMethod: "upi" | "card" | "cash";
  paymentStatus: string;
  vehicleType: VehicleType;
  status: BookingStatus;
};

export default function HistoryScreen() {
  const { darkMode, language } = useAppPreferences();
  const [history, setHistory] = useState<BookingItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const response = await apiGet<{ bookings: BookingItem[] }>("/v1/bookings");
      setHistory(response.bookings);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load booking history");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="px-5 py-6">
        <Text className="mb-5 text-3xl font-semibold text-white">Booking history</Text>
        <View className="gap-3">
          {history.length ? history.map((item) => (
            <View key={item.id} className="rounded-3xl bg-slate-900 p-4">
              <Text className="text-lg font-semibold text-white">{item.pickup.address} to {item.drop.address}</Text>
              <Text className="mt-1 text-slate-400">{item.id} • {vehicleLabels[item.vehicleType][language]}</Text>
              <View className="mt-3 gap-2">
                <Text className="text-2xl font-semibold text-amber-300">INR {item.finalPrice}</Text>
                <Text className="text-slate-300">{statusLabels[item.status][language]} • {paymentLabels[item.paymentMethod]} • {item.paymentStatus}</Text>
              </View>
            </View>
          )) : <View className="rounded-3xl bg-slate-900 p-4"><Text className="text-slate-300">No bookings yet.</Text></View>}
        </View>
        {error ? <Text className="mt-4 text-sm font-medium text-red-400">{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
