import { useState } from "react";
import { SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../providers/auth";

export default function LoginScreen() {
  const { pendingPhoneNumber, sendOtp, confirmOtp, resendOtp } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState<"send" | "verify" | "resend" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp() {
    setBusy("send");
    setError(null);
    try {
      await sendOtp(phoneNumber);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to send OTP");
    } finally {
      setBusy(null);
    }
  }

  async function handleVerifyOtp() {
    setBusy("verify");
    setError(null);
    try {
      await confirmOtp(otp);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to verify OTP");
    } finally {
      setBusy(null);
    }
  }

  async function handleResendOtp() {
    setBusy("resend");
    setError(null);
    try {
      await resendOtp();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to resend OTP");
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-6 py-8">
      <View className="mt-10">
        <Text className="text-4xl font-semibold text-white">LoadGo Driver</Text>
        <Text className="mt-3 text-base text-slate-300">Sign in with the mobile number linked to your driver account.</Text>
      </View>

      <View className="mt-10 rounded-3xl bg-slate-900 p-5">
        <Text className="mb-2 text-sm text-slate-400">Phone number</Text>
        <TextInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholder="9876543210"
          placeholderTextColor="#94a3b8"
          className="rounded-2xl bg-slate-800 px-4 py-4 text-white"
        />
        <Text className="mt-3 text-xs text-slate-400">India format is assumed. Enter 10 digits or +91 number.</Text>
        <TouchableOpacity className="mt-5 rounded-2xl bg-brand px-4 py-4" disabled={busy !== null} onPress={() => void handleSendOtp()}>
          <Text className="text-center text-base font-semibold text-white">{busy === "send" ? "Sending OTP..." : "Send OTP"}</Text>
        </TouchableOpacity>
      </View>

      {pendingPhoneNumber ? (
        <View className="mt-6 rounded-3xl bg-slate-900 p-5">
          <Text className="mb-2 text-sm text-slate-400">OTP sent to {pendingPhoneNumber}</Text>
          <TextInput
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            placeholder="123456"
            placeholderTextColor="#94a3b8"
            className="rounded-2xl bg-slate-800 px-4 py-4 text-white"
          />
          <TouchableOpacity className="mt-5 rounded-2xl bg-accent px-4 py-4" disabled={busy !== null} onPress={() => void handleVerifyOtp()}>
            <Text className="text-center text-base font-semibold text-slate-900">{busy === "verify" ? "Verifying..." : "Verify OTP"}</Text>
          </TouchableOpacity>
          <TouchableOpacity className="mt-3 rounded-2xl border border-slate-700 px-4 py-4" disabled={busy !== null} onPress={() => void handleResendOtp()}>
            <Text className="text-center text-base font-semibold text-white">{busy === "resend" ? "Resending..." : "Resend OTP"}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {error ? <Text className="mt-5 text-sm font-medium text-red-400">{error}</Text> : null}
    </SafeAreaView>
  );
}
