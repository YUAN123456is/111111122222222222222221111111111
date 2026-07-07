import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { setBaseUrl } from "@workspace/api-client-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { DramaProvider } from "@/context/DramaContext";
import { LocaleProvider } from "@/context/LocaleContext";

SplashScreen.preventAutoHideAsync();

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0A0D14" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(home)" />
      <Stack.Screen name="player" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="search" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // FontAwesome5 Free — family names must match what createFA5iconSet registers
    "FontAwesomeFree-Regular": require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf"),
    "FontAwesomeFree-Solid": require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf"),
    "FontAwesomeFree-Brand": require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Brands.ttf"),
    // Feather (used in tab bar)
    "Feather": require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <LocaleProvider>
            <AuthProvider>
              <DramaProvider>
                <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0A0D14" }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </DramaProvider>
            </AuthProvider>
          </LocaleProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
