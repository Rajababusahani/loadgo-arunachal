import { Redirect, Stack, useSegments } from "expo-router";
import { AppPreferencesProvider } from "../providers/app-preferences";
import { AuthProvider, useAuth } from "../providers/auth";
import { SafeAreaView, Text } from "react-native";

function RootNavigator() {
  const segments = useSegments();
  const { user, initializing } = useAuth();
  const inAuthScreen = segments[0] === "login";

  if (initializing) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-950 px-6">
        <Text className="text-xl font-semibold text-white">Checking session...</Text>
      </SafeAreaView>
    );
  }

  if (!user && !inAuthScreen) {
    return <Redirect href="/login" />;
  }

  if (user && inAuthScreen) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AppPreferencesProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </AppPreferencesProvider>
  );
}
