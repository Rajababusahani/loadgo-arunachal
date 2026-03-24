import { useEffect, useMemo, useState } from "react";
import { Link } from "expo-router";
import { SafeAreaView, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { demoLocations, statusLabels, type BookingStatus, type VehicleType, vehicleLabels } from "@loadgo/shared";
import { apiGet, apiPost, openGoogleMapsNavigation } from "../lib/api";

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

type DriverOffer = {
  _id: string;
  pickup: { address: string; landmark?: string; point?: { coordinates: [number, number] } };
  drop: { address: string; landmark?: string; point?: { coordinates: [number, number] } };
  vehicleType: VehicleType;
  estimatedPrice: number;
  status: BookingStatus;
};

type DriverProfile = {
  _id: string;
  approvalStatus: string;
  availability: "offline" | "online" | "busy";
  earningsToday: number;
  totalEarnings: number;
  vehicleType: VehicleType;
  currentAddress?: string;
};

type MeResponse = {
  user: { name: string; phone: string };
  driverProfile: DriverProfile | null;
};

const activeStatuses: BookingStatus[] = ["assigned", "arriving", "in_transit"];

export default function DriverHomeScreen() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [offers, setOffers] = useState<DriverOffer[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeBooking = useMemo(() => bookings.find((booking) => activeStatuses.includes(booking.status)), [bookings]);
  const online = me?.driverProfile?.availability === "online" || me?.driverProfile?.availability === "busy";

  useEffect(() => {
    void loadDriverState();
    const timer = setInterval(() => {
      void loadDriverState();
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  async function loadDriverState() {
    try {
      const [meResponse, offersResponse, bookingsResponse] = await Promise.all([
        apiGet<MeResponse>("/v1/me"),
        apiGet<{ offers: DriverOffer[] }>("/v1/drivers/bookings/offers"),
        apiGet<{ bookings: BookingItem[] }>("/v1/bookings")
      ]);
      setMe(meResponse);
      setOffers(offersResponse.offers);
      setBookings(bookingsResponse.bookings);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load driver state");
    }
  }

  async function updateAvailability(nextOnline: boolean) {
    setBusy("availability");
    setError(null);
    try {
      const location = demoLocations[0];
      await apiPost("/v1/drivers/availability", {
        availability: nextOnline ? "online" : "offline",
        location: {
          lat: location.lat,
          lng: location.lng,
          address: location.address
        }
      });
      await loadDriverState();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to update availability");
    } finally {
      setBusy(null);
    }
  }

  async function handleOfferAction(bookingId: string, action: "accept" | "reject") {
    setBusy(`${action}-${bookingId}`);
    setError(null);
    try {
      await apiPost(`/v1/drivers/bookings/${bookingId}/${action}`, {});
      await loadDriverState();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : `Failed to ${action} offer`);
    } finally {
      setBusy(null);
    }
  }

  async function handleRideAction(action: "arrive" | "start" | "complete") {
    if (!activeBooking) {
      return;
    }

    setBusy(action);
    setError(null);
    try {
      await apiPost(`/v1/drivers/bookings/${activeBooking.id}/${action}`, {});
      await loadDriverState();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : `Failed to ${action} ride`);
    } finally {
      setBusy(null);
    }
  }

  async function sendTrackingPing() {
    if (!activeBooking) {
      return;
    }

    setBusy("tracking");
    setError(null);
    try {
      const location = getTrackingPoint(activeBooking.status);
      await apiPost("/v1/drivers/tracking", {
        bookingId: activeBooking.id,
        lat: location.lat,
        lng: location.lng,
        accuracy: 12,
        speed: activeBooking.status === "in_transit" ? 18 : 6,
        heading: 90
      });
      await loadDriverState();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to send tracking update");
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-5 py-6">
      <ScrollView>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-semibold text-white">Driver console</Text>
            <Text className="text-slate-400">Live offers, ride state, and earnings for the mock driver</Text>
          </View>
          <View className="items-center">
            <Switch value={online} onValueChange={(value) => void updateAvailability(value)} disabled={busy === "availability"} />
            <Text className="mt-1 text-xs text-slate-400">{me?.driverProfile?.availability ?? "offline"}</Text>
          </View>
        </View>

        <View className="mt-6 rounded-3xl bg-brand p-5">
          <Text className="text-sm text-amber-50">Today earnings</Text>
          <Text className="mt-2 text-4xl font-semibold text-white">INR {me?.driverProfile?.earningsToday ?? 0}</Text>
          <Text className="mt-1 text-amber-50">Total: INR {me?.driverProfile?.totalEarnings ?? 0}</Text>
        </View>

        <View className="mt-6 rounded-3xl bg-slate-900 p-5">
          <Text className="text-sm text-slate-400">Profile status</Text>
          <Text className="mt-2 text-xl font-semibold text-white">{me?.user.name ?? "Driver"}</Text>
          <Text className="mt-1 text-slate-300">{me?.driverProfile ? `${vehicleLabels[me.driverProfile.vehicleType].en} • ${me.driverProfile.approvalStatus}` : "Create your driver profile in KYC"}</Text>
        </View>

        {activeBooking ? (
          <View className="mt-6 rounded-3xl bg-slate-900 p-5">
            <Text className="text-sm text-slate-400">Current ride</Text>
            <Text className="mt-2 text-xl font-semibold text-white">{activeBooking.pickup.address} to {activeBooking.drop.address}</Text>
            <Text className="mt-2 text-slate-300">{statusLabels[activeBooking.status].en} • INR {activeBooking.finalPrice}</Text>
            <View className="mt-4 flex-row flex-wrap gap-3">
              {activeBooking.status === "assigned" ? <TouchableOpacity className="rounded-2xl bg-accent px-4 py-3" disabled={busy === "arrive"} onPress={() => void handleRideAction("arrive")}><Text className="font-semibold text-slate-900">Mark arriving</Text></TouchableOpacity> : null}
              {activeBooking.status === "arriving" ? <TouchableOpacity className="rounded-2xl bg-accent px-4 py-3" disabled={busy === "start"} onPress={() => void handleRideAction("start")}><Text className="font-semibold text-slate-900">Start ride</Text></TouchableOpacity> : null}
              {activeBooking.status === "in_transit" ? <TouchableOpacity className="rounded-2xl bg-accent px-4 py-3" disabled={busy === "complete"} onPress={() => void handleRideAction("complete")}><Text className="font-semibold text-slate-900">Complete ride</Text></TouchableOpacity> : null}
              <TouchableOpacity className="rounded-2xl border border-slate-700 px-4 py-3" disabled={busy === "tracking"} onPress={() => void sendTrackingPing()}>
                <Text className="font-semibold text-white">Send tracking ping</Text>
              </TouchableOpacity>
              <TouchableOpacity className="rounded-2xl border border-slate-700 px-4 py-3" onPress={() => void openGoogleMapsNavigation(activeBooking.drop.lat, activeBooking.drop.lng)}>
                <Text className="font-semibold text-white">Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <Text className="mt-6 text-xl font-semibold text-white">Ride offers</Text>
        <View className="mt-3 gap-3">
          {offers.length ? offers.map((offer) => (
            <View key={offer._id} className="rounded-3xl bg-slate-900 p-4">
              <Text className="text-lg font-semibold text-white">{offer.pickup.address} to {offer.drop.address}</Text>
              <Text className="mt-1 text-slate-400">{vehicleLabels[offer.vehicleType].en}</Text>
              <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-2xl font-semibold text-amber-300">INR {offer.estimatedPrice}</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity className="rounded-2xl border border-slate-700 px-4 py-3" disabled={busy === `reject-${offer._id}`} onPress={() => void handleOfferAction(offer._id, "reject")}>
                    <Text className="text-white">Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="rounded-2xl bg-accent px-4 py-3" disabled={busy === `accept-${offer._id}`} onPress={() => void handleOfferAction(offer._id, "accept")}>
                    <Text className="font-semibold text-slate-900">Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )) : <View className="rounded-3xl bg-slate-900 p-4"><Text className="text-slate-300">No pending offers. Seed demo data or set the driver online.</Text></View>}
        </View>

        <View className="mt-6 flex-row gap-3">
          <Link href="/earnings" asChild>
            <TouchableOpacity className="flex-1 rounded-2xl bg-slate-800 px-4 py-4">
              <Text className="text-center font-semibold text-white">Earnings</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/profile" asChild>
            <TouchableOpacity className="flex-1 rounded-2xl bg-slate-800 px-4 py-4">
              <Text className="text-center font-semibold text-white">KYC</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {error ? <Text className="mt-4 text-sm font-medium text-red-400">{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function getTrackingPoint(status: BookingStatus) {
  if (status === "assigned") {
    return demoLocations[0];
  }

  if (status === "arriving") {
    return { ...demoLocations[0], lat: 27.098, lng: 93.664 };
  }

  return { ...demoLocations[1], lat: 27.0905, lng: 93.642 };
}
