import { Stack } from "expo-router";
import { AppPreferencesProvider } from "../providers/app-preferences";

export default function RootLayout() {
  return (
    <AppPreferencesProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppPreferencesProvider>
  );
}
