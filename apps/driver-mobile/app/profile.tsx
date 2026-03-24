import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { DOCUMENT_KINDS, VEHICLE_TYPES, type DocumentKind, type VehicleType, vehicleLabels } from "@loadgo/shared";
import { apiGet, apiPatch, apiPost } from "../lib/api";

type DriverProfile = {
  approvalStatus: string;
  vehicleType: VehicleType;
  currentAddress?: string;
};

type MeResponse = {
  user: { name: string; phone: string };
  driverProfile: DriverProfile | null;
};

export default function ProfileScreen() {
  const [vehicleType, setVehicleType] = useState<VehicleType>("mini_truck");
  const [licenseUrl, setLicenseUrl] = useState("https://example.com/license.jpg");
  const [vehicleRcUrl, setVehicleRcUrl] = useState("https://example.com/rc.jpg");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("https://example.com/profile.jpg");
  const [currentAddress, setCurrentAddress] = useState("Naharlagun market");
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await apiGet<MeResponse>("/v1/me");
      setProfile(response.driverProfile);
      if (response.driverProfile) {
        setVehicleType(response.driverProfile.vehicleType);
        setCurrentAddress(response.driverProfile.currentAddress ?? "Naharlagun market");
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load profile");
    }
  }

  async function saveProfile() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const payload = { vehicleType, currentAddress };
      if (profile) {
        await apiPatch("/v1/drivers/profile", payload);
      } else {
        await apiPost("/v1/drivers/profile", payload);
      }

      await apiPost("/v1/drivers/kyc", {
        documents: buildDocuments([
          { kind: "license", url: licenseUrl },
          { kind: "vehicle_rc", url: vehicleRcUrl },
          { kind: "profile_photo", url: profilePhotoUrl }
        ])
      });

      setMessage("Profile and KYC submitted.");
      await loadProfile();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to save driver profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface px-5 py-6">
      <ScrollView>
        <Text className="text-3xl font-semibold text-slate-900">Driver KYC</Text>
        <View className="mt-5 rounded-3xl bg-white p-5">
          <Text className="text-sm text-slate-500">Approval status</Text>
          <Text className="mt-1 text-base font-semibold text-slate-900">{profile?.approvalStatus ?? "No profile yet"}</Text>

          <Text className="mt-4 text-sm text-slate-500">Vehicle type</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {VEHICLE_TYPES.map((type) => (
              <TouchableOpacity key={type} className={vehicleType === type ? "rounded-full bg-brand px-4 py-3" : "rounded-full border border-slate-300 px-4 py-3"} onPress={() => setVehicleType(type)}>
                <Text className={vehicleType === type ? "font-semibold text-white" : "font-semibold text-slate-900"}>{vehicleLabels[type].en}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="mt-4 text-sm text-slate-500">Current address</Text>
          <TextInput value={currentAddress} onChangeText={setCurrentAddress} className="mt-2 rounded-2xl bg-slate-100 px-4 py-4 text-slate-900" />

          <Text className="mt-4 text-sm text-slate-500">License URL</Text>
          <TextInput value={licenseUrl} onChangeText={setLicenseUrl} className="mt-2 rounded-2xl bg-slate-100 px-4 py-4 text-slate-900" />
          <Text className="mt-4 text-sm text-slate-500">Vehicle RC URL</Text>
          <TextInput value={vehicleRcUrl} onChangeText={setVehicleRcUrl} className="mt-2 rounded-2xl bg-slate-100 px-4 py-4 text-slate-900" />
          <Text className="mt-4 text-sm text-slate-500">Profile photo URL</Text>
          <TextInput value={profilePhotoUrl} onChangeText={setProfilePhotoUrl} className="mt-2 rounded-2xl bg-slate-100 px-4 py-4 text-slate-900" />

          <TouchableOpacity className="mt-5 rounded-2xl bg-brand px-4 py-4" disabled={busy} onPress={() => void saveProfile()}>
            <Text className="text-center font-semibold text-white">{busy ? "Saving..." : profile ? "Update profile" : "Create profile"}</Text>
          </TouchableOpacity>
          {message ? <Text className="mt-4 text-sm font-medium text-emerald-700">{message}</Text> : null}
          {error ? <Text className="mt-4 text-sm font-medium text-red-600">{error}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function buildDocuments(items: { kind: DocumentKind; url: string }[]) {
  return items.filter((item) => item.url.trim().length > 0).map((item) => ({
    kind: item.kind,
    url: item.url,
    publicId: `mock/${item.kind}`,
    uploadedAt: new Date().toISOString()
  }));
}
