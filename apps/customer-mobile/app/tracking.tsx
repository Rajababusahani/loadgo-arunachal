import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import database from "@react-native-firebase/database";
import { paymentLabels, statusLabels, type BookingStatus, type TrackingEvent, type VehicleType, vehicleLabels } from "@loadgo/shared";
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
  lastTrackingAt?: string | null;
  lastKnownDriverLocation?: {
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    recordedAt: string;
  } | null;
};

type StatusEvent = {
  status?: BookingStatus;
  updatedAt?: string;
};

const activeStatuses: BookingStatus[] = ["searching", "assigned", "arriving", "in_transit"];

export default function TrackingScreen() {
  const { darkMode, language } = useAppPreferences();
  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [liveTracking, setLiveTracking] = useState<TrackingEvent | null>(null);
  const [liveStatus, setLiveStatus] = useState<StatusEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadActiveBooking();
    const timer = setInterval(() => {
      void loadActiveBooking();
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!booking?.id) {
      setLiveTracking(null);
      setLiveStatus(null);
      return;
    }

    const trackingRef = database().ref(`bookingTracking/${booking.id}`);
    const statusRef = database().ref(`bookingStatus/${booking.id}`);

    const handleTracking = trackingRef.on("value", (snapshot) => {
      const value = snapshot.val() as TrackingEvent | null;
      setLiveTracking(value ?? null);
    });

    const handleStatus = statusRef.on("value", (snapshot) => {
      const value = snapshot.val() as StatusEvent | null;
      setLiveStatus(value ?? null);
    });

    return () => {
      trackingRef.off("value", handleTracking);
      statusRef.off("value", handleStatus);
    };
  }, [booking?.id]);

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

  const driverLocation = useMemo(() => {
    if (liveTracking) {
      return {
        lat: liveTracking.lat,
        lng: liveTracking.lng,
        recordedAt: liveTracking.recordedAt,
        accuracy: liveTracking.accuracy,
        speed: liveTracking.speed
      };
    }

    return booking?.lastKnownDriverLocation ?? null;
  }, [booking?.lastKnownDriverLocation, liveTracking]);

  const displayedStatus = liveStatus?.status ?? booking?.status ?? null;
  const statusTimestamp = liveStatus?.updatedAt ?? booking?.updatedAt ?? null;

  const freshness = useMemo(() => {
    const timestamp = driverLocation?.recordedAt ?? statusTimestamp;
    if (!timestamp) {
      return null;
    }

    const updated = new Date(timestamp).getTime();
    const seconds = Math.max(0, Math.round((Date.now() - updated) / 1000));
    return `${seconds}s ago`;
  }, [driverLocation?.recordedAt, statusTimestamp]);

  const mapRegion = useMemo(() => {
    if (!booking) {
      return null;
    }

    const lats = [booking.pickup.lat, booking.drop.lat, driverLocation?.lat].filter((value): value is number => typeof value === "number");
    const lngs = [booking.pickup.lng, booking.drop.lng, driverLocation?.lng].filter((value): value is number => typeof value === "number");
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.8),
      longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.8)
    };
  }, [booking, driverLocation?.lat, driverLocation?.lng]);

  const routeCoordinates = useMemo(() => {
    if (!booking) {
      return [] as { latitude: number; longitude: number }[];
    }

    const points = [
      { latitude: booking.pickup.lat, longitude: booking.pickup.lng },
      ...(driverLocation ? [{ latitude: driverLocation.lat, longitude: driverLocation.lng }] : []),
      { latitude: booking.drop.lat, longitude: booking.drop.lng }
    ];

    return points;
  }, [booking, driverLocation]);

  return (
    <SafeAreaView className={darkMode ? "flex-1 bg-slate-950 px-5 py-6" : "flex-1 bg-surface px-5 py-6"}>
      <Text className={darkMode ? "text-3xl font-semibold text-white" : "text-3xl font-semibold text-ink"}>Live tracking</Text>
      {booking ? (
        <ScrollView className="mt-5 flex-1">
          <View className={darkMode ? "rounded-[28px] bg-slate-900 p-5" : "rounded-[28px] bg-white p-5"}>
            {mapRegion ? (
              <MapView
                style={{ height: 260, borderRadius: 24 }}
                initialRegion={mapRegion}
                region={mapRegion}
              >
                <Marker coordinate={{ latitude: booking.pickup.lat, longitude: booking.pickup.lng }} title="Pickup" description={booking.pickup.address} pinColor="green" />
                <Marker coordinate={{ latitude: booking.drop.lat, longitude: booking.drop.lng }} title="Drop" description={booking.drop.address} pinColor="red" />
                {driverLocation ? (
                  <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }} title="Driver" description={`Updated ${freshness ?? "just now"}`} pinColor="#2563eb" />
                ) : null}
                {routeCoordinates.length >= 2 ? (
                  <Polyline coordinates={routeCoordinates} strokeColor="#0f766e" strokeWidth={4} />
                ) : null}
              </MapView>
            ) : null}

            <Text className={darkMode ? "mt-4 text-lg font-semibold text-white" : "mt-4 text-lg font-semibold text-ink"}>{booking.pickup.address}</Text>
            <Text className={darkMode ? "mt-1 text-slate-400" : "mt-1 text-slate-600"}>to</Text>
            <Text className={darkMode ? "mt-1 text-lg font-semibold text-white" : "mt-1 text-lg font-semibold text-ink"}>{booking.drop.address}</Text>
            <Text className={darkMode ? "mt-4 text-slate-300" : "mt-4 text-slate-700"}>Vehicle: {vehicleLabels[booking.vehicleType][language]}</Text>
            <Text className={darkMode ? "mt-1 text-slate-300" : "mt-1 text-slate-700"}>Payment: {paymentLabels[booking.paymentMethod]} • {booking.paymentStatus}</Text>
            <Text className={darkMode ? "mt-1 text-slate-300" : "mt-1 text-slate-700"}>Status: {displayedStatus ? statusLabels[displayedStatus][language] : "Unknown"}</Text>
            <Text className={darkMode ? "mt-2 text-slate-400" : "mt-2 text-slate-600"}>Last realtime update {freshness ?? "not yet received"}. If mobile data drops, the app falls back to the last backend-tracked driver location.</Text>

            {driverLocation ? (
              <View className="mt-4 rounded-2xl bg-slate-100 p-4">
                <Text className="text-sm text-slate-500">Driver location</Text>
                <Text className="mt-1 text-base font-semibold text-slate-900">{driverLocation.lat.toFixed(5)}, {driverLocation.lng.toFixed(5)}</Text>
                <Text className="mt-1 text-sm text-slate-600">Accuracy {Math.round(driverLocation.accuracy ?? 0)} m{typeof driverLocation.speed === "number" ? ` • Speed ${Math.round(driverLocation.speed)} m/s` : ""}</Text>
              </View>
            ) : (
              <View className="mt-4 rounded-2xl bg-slate-100 p-4">
                <Text className="text-sm text-slate-500">Driver location</Text>
                <Text className="mt-1 text-base font-semibold text-slate-900">Waiting for the driver app to send live location.</Text>
              </View>
            )}

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
        </ScrollView>
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
