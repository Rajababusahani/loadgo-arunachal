import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { statusLabels, type BookingStatus } from "@loadgo/shared";
import { apiGet } from "../lib/api";

type DriverProfile = {
  earningsToday: number;
  totalEarnings: number;
};

type MeResponse = {
  driverProfile: DriverProfile | null;
};

type BookingItem = {
  id: string;
  finalPrice: number;
  status: BookingStatus;
  pickup: { address: string };
  drop: { address: string };
};

export default function EarningsScreen() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);

  useEffect(() => {
    void loadEarnings();
  }, []);

  async function loadEarnings() {
    const [meResponse, bookingResponse] = await Promise.all([
      apiGet<MeResponse>("/v1/me"),
      apiGet<{ bookings: BookingItem[] }>("/v1/bookings")
    ]);

    setProfile(meResponse.driverProfile);
    setBookings(bookingResponse.bookings);
  }

  const completedTrips = useMemo(() => bookings.filter((booking) => booking.status === "completed"), [bookings]);
  const monthlyEstimate = useMemo(() => completedTrips.reduce((sum, booking) => sum + booking.finalPrice, 0), [completedTrips]);

  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-5 py-6">
      <ScrollView>
        <Text className="text-3xl font-semibold text-white">Earnings</Text>
        <View className="mt-5 gap-3">
          <View className="rounded-3xl bg-slate-900 p-4">
            <Text className="text-slate-400">Today</Text>
            <Text className="mt-1 text-3xl font-semibold text-white">INR {profile?.earningsToday ?? 0}</Text>
          </View>
          <View className="rounded-3xl bg-slate-900 p-4">
            <Text className="text-slate-400">Total</Text>
            <Text className="mt-1 text-3xl font-semibold text-white">INR {profile?.totalEarnings ?? 0}</Text>
          </View>
          <View className="rounded-3xl bg-slate-900 p-4">
            <Text className="text-slate-400">Completed rides</Text>
            <Text className="mt-1 text-3xl font-semibold text-white">{completedTrips.length}</Text>
          </View>
          <View className="rounded-3xl bg-slate-900 p-4">
            <Text className="text-slate-400">Loaded booking revenue</Text>
            <Text className="mt-1 text-3xl font-semibold text-white">INR {monthlyEstimate}</Text>
          </View>
        </View>

        <Text className="mt-6 text-xl font-semibold text-white">Recent trips</Text>
        <View className="mt-3 gap-3">
          {bookings.length ? bookings.map((booking) => (
            <View key={booking.id} className="rounded-3xl bg-slate-900 p-4">
              <Text className="text-lg font-semibold text-white">{booking.pickup.address} to {booking.drop.address}</Text>
              <Text className="mt-1 text-slate-400">{statusLabels[booking.status].en}</Text>
              <Text className="mt-3 text-xl font-semibold text-amber-300">INR {booking.finalPrice}</Text>
            </View>
          )) : <View className="rounded-3xl bg-slate-900 p-4"><Text className="text-slate-300">No rides yet.</Text></View>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
