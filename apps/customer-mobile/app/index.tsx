import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  paymentLabels,
  statusLabels,
  type BookingStatus,
  type PaymentMethod,
  type PlaceDetails,
  type PlaceSuggestion,
  type VehicleType,
  vehicleLabels
} from "@loadgo/shared";
import { VehicleCard } from "../components/VehicleCard";
import { apiGet, apiPost } from "../lib/api";
import { useAppPreferences } from "../providers/app-preferences";

type QuoteResponse = {
  quote: {
    estimatedPrice: number;
    distanceKm: number;
    durationMinutes: number;
    baseFare: number;
    perKmRate: number;
  };
};

type BookingItem = {
  id: string;
  pickup: { address: string; landmark?: string; lat: number; lng: number };
  drop: { address: string; landmark?: string; lat: number; lng: number };
  finalPrice: number;
  estimatedPrice: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  vehicleType: VehicleType;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
};

const paymentMethods: PaymentMethod[] = ["upi", "card", "cash"];
const activeStatuses: BookingStatus[] = ["searching", "assigned", "arriving", "in_transit"];

export default function HomeScreen() {
  const router = useRouter();
  const { language, toggleLanguage, darkMode, toggleTheme } = useAppPreferences();
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropQuery, setDropQuery] = useState("");
  const [pickupLocation, setPickupLocation] = useState<PlaceDetails | null>(null);
  const [dropLocation, setDropLocation] = useState<PlaceDetails | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<PlaceSuggestion[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>("mini_truck");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [quote, setQuote] = useState<QuoteResponse["quote"] | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeBooking = useMemo(() => bookings.find((booking) => activeStatuses.includes(booking.status)), [bookings]);

  useEffect(() => {
    void loadBookings();
    const timer = setInterval(() => {
      void loadBookings();
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSuggestions("pickup", pickupQuery, pickupLocation?.address ?? "");
    }, 300);

    return () => clearTimeout(timer);
  }, [pickupQuery, pickupLocation?.address]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSuggestions("drop", dropQuery, dropLocation?.address ?? "");
    }, 300);

    return () => clearTimeout(timer);
  }, [dropQuery, dropLocation?.address]);

  async function loadBookings() {
    try {
      const response = await apiGet<{ bookings: BookingItem[] }>("/v1/bookings");
      setBookings(response.bookings);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load bookings");
    }
  }

  async function loadSuggestions(kind: "pickup" | "drop", query: string, selectedAddress: string) {
    const normalized = query.trim();
    if (normalized.length < 2 || normalized === selectedAddress) {
      if (kind === "pickup") {
        setPickupSuggestions([]);
      } else {
        setDropSuggestions([]);
      }
      return;
    }

    try {
      const response = await apiGet<{ suggestions: PlaceSuggestion[] }>(`/v1/locations/autocomplete?q=${encodeURIComponent(normalized)}`);
      if (kind === "pickup") {
        setPickupSuggestions(response.suggestions);
      } else {
        setDropSuggestions(response.suggestions);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to search locations");
    }
  }

  async function selectPlace(kind: "pickup" | "drop", suggestion: PlaceSuggestion) {
    setBusy(`${kind}-place`);
    setError(null);
    try {
      const response = await apiGet<{ place: PlaceDetails }>(`/v1/locations/place/${encodeURIComponent(suggestion.placeId)}`);
      if (kind === "pickup") {
        setPickupLocation(response.place);
        setPickupQuery(response.place.address);
        setPickupSuggestions([]);
      } else {
        setDropLocation(response.place);
        setDropQuery(response.place.address);
        setDropSuggestions([]);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to select location");
    } finally {
      setBusy(null);
    }
  }

  async function getQuote() {
    if (!pickupLocation || !dropLocation) {
      setError("Select valid pickup and drop suggestions before calculating the fare.");
      return;
    }

    setLoadingQuote(true);
    setError(null);
    setMessage(null);
    try {
      const response = await apiPost<QuoteResponse>("/v1/locations/quote", {
        pickup: { ...pickupLocation, landmark: notes || pickupLocation.landmark },
        drop: { ...dropLocation, landmark: dropLocation.landmark },
        vehicleType: selectedVehicle
      });
      setQuote(response.quote);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to get quote");
    } finally {
      setLoadingQuote(false);
    }
  }

  async function createBooking() {
    if (!pickupLocation || !dropLocation) {
      setError("Select valid pickup and drop suggestions before creating the booking.");
      return;
    }

    setBusy("book");
    setError(null);
    setMessage(null);
    try {
      await apiPost<{ booking: BookingItem }>("/v1/bookings", {
        pickup: { ...pickupLocation, landmark: notes || pickupLocation.landmark },
        drop: { ...dropLocation, landmark: dropLocation.landmark },
        vehicleType: selectedVehicle,
        paymentMethod,
        notes
      });
      setMessage("Booking created. Driver matching has started.");
      await loadBookings();
      router.push("/tracking");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to create booking");
    } finally {
      setBusy(null);
    }
  }

  async function cancelActiveBooking() {
    if (!activeBooking) {
      return;
    }

    setBusy("cancel");
    setError(null);
    try {
      await apiPost(`/v1/bookings/${activeBooking.id}/cancel`, {});
      setMessage("Booking cancelled.");
      await loadBookings();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to cancel booking");
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView className={darkMode ? "flex-1 bg-slate-950" : "flex-1 bg-surface"}>
      <ScrollView className="flex-1 px-5 py-4">
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className={darkMode ? "text-3xl font-semibold text-white" : "text-3xl font-semibold text-ink"}>LoadGo Arunachal</Text>
            <Text className={darkMode ? "text-slate-300" : "text-slate-600"}>Book intra-city cargo vehicles with live pricing and tracking.</Text>
          </View>
          <View className="gap-2">
            <TouchableOpacity className="rounded-full bg-brand px-4 py-2" onPress={toggleLanguage}>
              <Text className="text-sm font-semibold text-white">{language.toUpperCase()}</Text>
            </TouchableOpacity>
            <TouchableOpacity className="rounded-full border border-slate-400 px-4 py-2" onPress={toggleTheme}>
              <Text className={darkMode ? "text-white" : "text-slate-700"}>{darkMode ? "Dark" : "Light"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className={darkMode ? "mb-5 rounded-3xl bg-slate-900 p-4" : "mb-5 rounded-3xl bg-white p-4"}>
          <Text className={darkMode ? "mb-2 text-sm text-slate-300" : "mb-2 text-sm text-slate-500"}>Pickup</Text>
          <TextInput
            value={pickupQuery}
            onChangeText={(value) => {
              setPickupQuery(value);
              setPickupLocation(null);
              setQuote(null);
            }}
            placeholder="Search pickup"
            placeholderTextColor={darkMode ? "#94a3b8" : "#64748b"}
            className={darkMode ? "mb-3 rounded-2xl bg-slate-800 px-4 py-4 text-white" : "mb-3 rounded-2xl bg-slate-100 px-4 py-4 text-slate-900"}
          />
          <SuggestionList suggestions={pickupSuggestions} onSelect={(item) => void selectPlace("pickup", item)} color="emerald" />
          {pickupLocation ? <Text className={darkMode ? "mb-4 text-xs text-emerald-300" : "mb-4 text-xs text-emerald-700"}>Selected: {pickupLocation.address}</Text> : null}

          <Text className={darkMode ? "mb-2 text-sm text-slate-300" : "mb-2 text-sm text-slate-500"}>Drop</Text>
          <TextInput
            value={dropQuery}
            onChangeText={(value) => {
              setDropQuery(value);
              setDropLocation(null);
              setQuote(null);
            }}
            placeholder="Search drop"
            placeholderTextColor={darkMode ? "#94a3b8" : "#64748b"}
            className={darkMode ? "mb-3 rounded-2xl bg-slate-800 px-4 py-4 text-white" : "mb-3 rounded-2xl bg-slate-100 px-4 py-4 text-slate-900"}
          />
          <SuggestionList suggestions={dropSuggestions} onSelect={(item) => void selectPlace("drop", item)} color="amber" />
          {dropLocation ? <Text className={darkMode ? "mb-4 text-xs text-amber-300" : "mb-4 text-xs text-amber-700"}>Selected: {dropLocation.address}</Text> : null}

          <Text className={darkMode ? "mb-2 text-sm text-slate-300" : "mb-2 text-sm text-slate-500"}>Landmark / note</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="Near landmark or shop" placeholderTextColor={darkMode ? "#94a3b8" : "#64748b"} className={darkMode ? "rounded-2xl bg-slate-800 px-4 py-4 text-white" : "rounded-2xl bg-slate-100 px-4 py-4 text-slate-900"} />
          <Text className={darkMode ? "mt-3 text-sm text-slate-400" : "mt-3 text-sm text-slate-600"}>Search through Google Places suggestions, then add a manual landmark if needed.</Text>
        </View>

        <Text className={darkMode ? "mb-3 text-lg font-semibold text-white" : "mb-3 text-lg font-semibold text-ink"}>Choose vehicle</Text>
        <View className="gap-3">
          {(["bike", "mini_truck", "pickup_truck"] as VehicleType[]).map((vehicle) => (
            <VehicleCard
              key={vehicle}
              label={vehicleLabels[vehicle][language]}
              selected={selectedVehicle === vehicle}
              subtitle={vehicle === "bike" ? "Small parcels" : vehicle === "mini_truck" ? "Furniture and crates" : "Bulky goods"}
              onPress={() => setSelectedVehicle(vehicle)}
            />
          ))}
        </View>

        <Text className={darkMode ? "mb-3 mt-6 text-lg font-semibold text-white" : "mb-3 mt-6 text-lg font-semibold text-ink"}>Payment</Text>
        <View className="mb-4 flex-row gap-3">
          {paymentMethods.map((method) => (
            <TouchableOpacity key={method} className={paymentMethod === method ? "rounded-2xl bg-brand px-4 py-3" : darkMode ? "rounded-2xl border border-slate-700 px-4 py-3" : "rounded-2xl border border-slate-300 px-4 py-3"} onPress={() => setPaymentMethod(method)}>
              <Text className={paymentMethod === method ? "font-semibold text-white" : darkMode ? "font-semibold text-white" : "font-semibold text-slate-900"}>{paymentLabels[method]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {quote ? (
          <View className={darkMode ? "rounded-3xl bg-slate-900 p-5" : "rounded-3xl bg-white p-5"}>
            <Text className={darkMode ? "text-sm text-slate-400" : "text-sm text-slate-500"}>Estimated fare</Text>
            <Text className={darkMode ? "mt-2 text-4xl font-semibold text-white" : "mt-2 text-4xl font-semibold text-ink"}>INR {quote.estimatedPrice}</Text>
            <Text className={darkMode ? "mt-2 text-sm text-slate-400" : "mt-2 text-sm text-slate-600"}>{quote.distanceKm} km • {quote.durationMinutes} min • Base {quote.baseFare} + {quote.perKmRate}/km</Text>
          </View>
        ) : null}

        {activeBooking ? (
          <View className={darkMode ? "mt-6 rounded-3xl bg-slate-900 p-5" : "mt-6 rounded-3xl bg-white p-5"}>
            <Text className={darkMode ? "text-sm text-slate-400" : "text-sm text-slate-500"}>Current booking</Text>
            <Text className={darkMode ? "mt-2 text-xl font-semibold text-white" : "mt-2 text-xl font-semibold text-ink"}>{activeBooking.pickup.address} to {activeBooking.drop.address}</Text>
            <Text className={darkMode ? "mt-2 text-sm text-slate-400" : "mt-2 text-sm text-slate-600"}>{statusLabels[activeBooking.status][language]} • {paymentLabels[activeBooking.paymentMethod]} • {activeBooking.paymentStatus}</Text>
            <View className="mt-4 flex-row gap-3">
              <Link href="/tracking" asChild>
                <TouchableOpacity className="flex-1 rounded-2xl bg-brand px-4 py-4">
                  <Text className="text-center font-semibold text-white">Open tracking</Text>
                </TouchableOpacity>
              </Link>
              {["searching", "assigned"].includes(activeBooking.status) ? (
                <TouchableOpacity className="rounded-2xl border border-red-300 px-4 py-4" disabled={busy === "cancel"} onPress={() => void cancelActiveBooking()}>
                  <Text className="font-semibold text-red-600">Cancel</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {message ? <Text className="mt-4 text-sm font-medium text-emerald-700">{message}</Text> : null}
        {error ? <Text className="mt-4 text-sm font-medium text-red-600">{error}</Text> : null}

        <View className="mt-6 flex-row gap-3">
          <TouchableOpacity className="flex-1 rounded-2xl bg-accent px-4 py-4" disabled={loadingQuote || busy === "pickup-place" || busy === "drop-place"} onPress={() => void getQuote()}>
            <Text className="text-center text-base font-semibold text-slate-900">{loadingQuote ? "Calculating..." : "Get fare"}</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 rounded-2xl bg-brand px-4 py-4" disabled={busy === "book"} onPress={() => void createBooking()}>
            <Text className="text-center text-base font-semibold text-white">{busy === "book" ? "Booking..." : "Book now"}</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 flex-row gap-3">
          <Link href="/tracking" asChild>
            <TouchableOpacity className={darkMode ? "flex-1 rounded-2xl border border-slate-700 px-4 py-4" : "flex-1 rounded-2xl border border-slate-300 px-4 py-4"}>
              <Text className={darkMode ? "text-center font-semibold text-white" : "text-center font-semibold text-slate-900"}>Live tracking</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/history" asChild>
            <TouchableOpacity className={darkMode ? "flex-1 rounded-2xl border border-slate-700 px-4 py-4" : "flex-1 rounded-2xl border border-slate-300 px-4 py-4"}>
              <Text className={darkMode ? "text-center font-semibold text-white" : "text-center font-semibold text-slate-900"}>History</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SuggestionList(props: {
  suggestions: PlaceSuggestion[];
  onSelect: (item: PlaceSuggestion) => void;
  color: "emerald" | "amber";
}) {
  if (!props.suggestions.length) {
    return null;
  }

  const classes = props.color === "emerald"
    ? { background: "bg-emerald-100", text: "text-emerald-900" }
    : { background: "bg-amber-100", text: "text-amber-900" };

  return (
    <View className="mb-4 gap-2">
      {props.suggestions.slice(0, 4).map((item) => (
        <TouchableOpacity key={item.placeId} className={`rounded-2xl px-3 py-3 ${classes.background}`} onPress={() => props.onSelect(item)}>
          <Text className={`text-sm font-semibold ${classes.text}`}>{item.primaryText}</Text>
          <Text className={`mt-1 text-xs ${classes.text}`}>{item.secondaryText || item.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
