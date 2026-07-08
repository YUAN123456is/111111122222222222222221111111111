import { useEffect, useRef, useState } from "react";
import { View, Image, StyleSheet, Animated } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import colors from "@/constants/colors";

export default function Index() {
  const { isLoading, hasCompletedOnboarding, provider, completeOnboarding } = useAuth();
  const [ready, setReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo fade in + scale up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // After 1.5s start exit, mark ready at 1.8s
    const exitTimer = setTimeout(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (!hasCompletedOnboarding) {
          completeOnboarding("allow");
        }
        setReady(true);
      });
    }, 1500);

    return () => clearTimeout(exitTimer);
  }, []);

  // Show animated logo splash
  if (!ready || isLoading) {
    return (
      <View style={styles.container}>
        <Animated.View
          style={{
            opacity: Animated.multiply(fadeAnim, exitAnim),
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Image
            source={require("@/assets/images/splash.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  // Route after splash
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
    width: 300,
    height: 300,
  },
});