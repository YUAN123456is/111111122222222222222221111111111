import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import colors from "@/constants/colors";
import { FontAwesome5 } from "@expo/vector-icons";

export default function Register() {
  const { registerWithEmail } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError(t("register.fillAllFields"));
      return;
    }

    if (password.length < 6) {
      setError(t("register.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("register.passwordsMismatch"));
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(email.trim(), password, displayName.trim() || undefined);
      Alert.alert(t("register.success"));
      router.replace("/(home)");
    } catch {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome5
              name="chevron-left"
              solid
              size={20}
              color={colors.dark.foreground}
            />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{t("register.title")}</Text>
          <Text style={styles.subtitle}>{t("register.subtitle")}</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t("register.namePlaceholder")}
            placeholderTextColor={colors.dark.mutedForeground}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder={t("register.emailPlaceholder")}
            placeholderTextColor={colors.dark.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder={t("register.passwordPlaceholder")}
            placeholderTextColor={colors.dark.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder={t("register.confirmPasswordPlaceholder")}
            placeholderTextColor={colors.dark.mutedForeground}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[
              styles.registerButton,
              (!email.trim() || !password.trim() || !confirmPassword.trim()) &&
                styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={
              loading || !email.trim() || !password.trim() || !confirmPassword.trim()
            }
          >
            {loading ? (
              <ActivityIndicator color={colors.dark.primaryForeground} />
            ) : (
              <Text style={styles.registerButtonText}>{t("register.createAccount")}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.replace("/login")} disabled={loading}>
            <Text style={styles.loginLink}>{t("register.hasAccount")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.background },
  scrollContent: { flexGrow: 1, padding: 24 },
  header: {
    paddingTop: 20,
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
    alignSelf: "flex-start",
  },
  content: { marginBottom: 32 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.dark.foreground,
    marginBottom: 8,
  },
  subtitle: { fontSize: 15, color: colors.dark.secondaryForeground },
  form: { gap: 14 },
  input: {
    backgroundColor: "rgba(30,35,48,0.8)",
    borderWidth: 1,
    borderColor: colors.dark.border,
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    color: colors.dark.foreground,
    fontSize: 16,
  },
  errorText: {
    color: colors.dark.destructive,
    fontSize: 14,
    textAlign: "center",
  },
  registerButton: {
    backgroundColor: colors.dark.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    color: colors.dark.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
  loginLink: {
    color: colors.dark.primary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
