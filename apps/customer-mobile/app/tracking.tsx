import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { paymentLabels, statusLabels, type BookingStatus, type VehicleType, vehicleLabels } from "@loadgo/shared";
import { apiGet, apiPost } from "../lib/api";
import { useAppPreferences } from "../providers/app-preferences";

type BookingItem = {
  id: string;
  pickup: { address: string; landmark?: string; lat: number; lng: number };
  drop: { address: string; landmark?: string; lat: number; lng: number };
  finalPrice: number;
  estimatedPrice: number;
  paymentMethod: "upi" | "card" | "cash";
  paymentStatus: string;
  vehicleType: VehicleType;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
};

const activeStatuses: BookingStatus[] = ["searching", "assigned", "arriving", "in_transit"];

export default function TrackingScreen() {
  const { darkMode, language } = useAppPreferences();
  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadActiveBooking();
    const timer = setInterval(() => {
      void loadActiveBooking();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  async function loadActiveBooking() {
    try {
      const response = await apiGet<{ bookings: BookingItem[] }>("/v1/bookings");
      const nextBooking = response.bookings.find((item) => activeStatuses.includes(item.status)) ?? null;
      setBooking(nextBooking);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load active booking");
    }
  }

  async function cancelBooking() {
    if (!booking) {
      return;
    }

    try {
      await apiPost(`/v1/bookings/${booking.id}/cancel`, {});
      await loadActiveBooking();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to cancel booking");
    }
  }

  const freshness = useMemo(() => {
    if (!booking) {
      return null;
    }

    const updated = new Date(booking.updatedAt).getTime();
    const seconds = Math.max(0, Math.round((Date.now() - updated) / 1000));
    return `${seconds}s ago`;
  }, [booking]);

  return (
    <SafeAreaView className={darkMode ? "flex-1 bg-slate-950 px-5 py-6" : "flex-1 bg-surface px-5 py-6"}>
      <Text className={darkMode ? "text-3xl font-semibold text-white" : "text-3xl font-semibold text-ink"}>Live tracking</Text>
      {booking ? (
        <View className={darkMode ? "mt-5 rounded-[28px] bg-slate-900 p-5" : "mt-5 rounded-[28px] bg-white p-5"}>
          <View className={darkMode ? "h-56 rounded-3xl bg-slate-800 p-5" : "h-56 rounded-3xl bg-emerald-50 p-5"}>
            <Text className={darkMode ? "text-sm text-slate-400" : "text-sm text-slate-600"}>Route</Text>
            <Text className={darkMode ? "mt-2 text-xl font-semibold text-white" : "mt-2 text-xl font-semibold text-ink"}>{booking.pickup.address}</Text>
            <Text className={darkMode ? "mt-1 text-slate-400" : "mt-1 text-slate-600"}>to</Text>
            <Text className={darkMode ? "mt-1 text-xl font-semibold text-white" : "mt-1 text-xl font-semibold text-ink"}>{booking.drop.address}</Text>
            <Text className={darkMode ? "mt-4 text-slate-400" : "mt-4 text-slate-600"}>Vehicle: {vehicleLabels[booking.vehicleType][language]}</Text>
            <Text className={darkMode ? "mt-1 text-slate-400" : "mt-1 text-slate-600"}>Payment: {paymentLabels[booking.paymentMethod]} • {booking.paymentStatus}</Text>
          </View>
          <Text className={darkMode ? "mt-4 text-lg font-semibold text-white" : "mt-4 text-lg font-semibold text-ink"}>{statusLabels[booking.status][language]}</Text>
          <Text className={darkMode ? "mt-2 text-slate-400" : "mt-2 text-slate-600"}>Last booking update {freshness}. Driver position appears here after the driver app sends tracking pings.</Text>
          <View className="mt-4 rounded-2xl bg-slate-100 p-4">
            <Text className="text-sm text-slate-500">Support</Text>
            <Text className="mt-1 text-base font-semibold text-slate-900">Driver contact and richer realtime hooks can be enabled once Firebase Auth and notification flows are configured.</Text>
          </View>
          {["searching", "assigned"].includes(booking.status) ? (
            <TouchableOpacity className="mt-4 rounded-2xl border border-red-300 px-4 py-4" onPress={() => void cancelBooking()}>
              <Text className="text-center font-semibold text-red-600">Cancel booking</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View className={darkMode ? "mt-5 rounded-3xl bg-slate-900 p-5" : "mt-5 rounded-3xl bg-white p-5"}>
          <Text className={darkMode ? "text-lg font-semibold text-white" : "text-lg font-semibold text-ink"}>No active booking</Text>
          <Text className={darkMode ? "mt-2 text-slate-400" : "mt-2 text-slate-600"}>Create a booking from the home screen to start tracking your driver.</Text>
          <Link href="/" asChild>
            <TouchableOpacity className="mt-4 rounded-2xl bg-brand px-4 py-4">
              <Text className="text-center font-semibold text-white">Back to booking</Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}
      {error ? <Text className="mt-4 text-sm font-medium text-red-600">{error}</Text> : null}
    </SafeAreaView>
  );
}

