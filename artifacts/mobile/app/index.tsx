import { useEffect, useState } from "react";
import { View, Image, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import colors from "@/constants/colors";

export default function Index() {
  const { isLoading, hasCompletedOnboarding, provider, completeOnboarding } = useAuth();
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    // Show logo for 1.5 seconds, then auto-complete onboarding if not done
    const timer = setTimeout(() => {
      setShowLogo(false);
      if (!hasCompletedOnboarding) {
        completeOnboarding("allow");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasCompletedOnboarding]);

  // Show logo splash
  if (showLogo || isLoading) {
    return (
      <View style={styles.container}>
        <Image
          source={require("@/assets/images/logo-wordmark.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  // After logo, route based on auth state
  if (!provider) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(home)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 220,
    height: 80,
  },
});