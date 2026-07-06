import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import colors from "@/constants/colors";
import { FontAwesome5 } from "@expo/vector-icons";

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async (provider: "apple" | "google" | "guest") => {
    await signIn(provider);
    router.replace("/(home)");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Save your progress and favorites.</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={() => handleLogin("apple")}>
          <FontAwesome5 name="apple" brand size={20} color={colors.dark.foreground} style={styles.icon} />
          <Text style={styles.buttonText}>Sign in with Apple</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => handleLogin("google")}>
          <FontAwesome5 name="google" brand size={20} color={colors.dark.foreground} style={styles.icon} />
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => handleLogin("guest")}>
          <FontAwesome5 name="user" solid size={20} color={colors.dark.foreground} style={styles.icon} />
          <Text style={styles.buttonText}>Continue as Guest</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.background, padding: 24 },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 32, fontWeight: "bold", color: colors.dark.foreground, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.dark.secondaryForeground },
  buttonContainer: { paddingBottom: 48, gap: 16 },
  button: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "rgba(30,35,48,0.8)", 
    borderWidth: 1, 
    borderColor: colors.dark.border, 
    height: 56, 
    borderRadius: 28 
  },
  icon: { position: "absolute", left: 24 },
  buttonText: { color: colors.dark.foreground, fontSize: 16, fontWeight: "600" },
});
