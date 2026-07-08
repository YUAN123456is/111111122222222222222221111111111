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
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import colors from "@/constants/colors";
import { FontAwesome5 } from "@expo/vector-icons";

export default function Login() {
  const { signIn, signInWithEmail } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleOAuthLogin = async (provider: "apple" | "google" | "guest") => {
    setLoading(true);
    try {
      await signIn(provider);
      router.replace("/(home)");
    } catch {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
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
        <View style={styles.content}>
          <Text style={styles.title}>{t("login.title")}</Text>
          <Text style={styles.subtitle}>{t("login.subtitle")}</Text>
        </View>

        <View style={styles.buttonContainer}>
          {!showEmailForm ? (
            <>
              {/* OAuth Buttons */}
              <Pressable
                style={styles.button}
                onPress={() => handleOAuthLogin("apple")}
                disabled={loading}
              >
                <FontAwesome5
                  name="apple"
                  brand
                  size={20}
                  color={colors.dark.foreground}
                  style={styles.icon}
                />
                <Text style={styles.buttonText}>{t("login.apple")}</Text>
              </Pressable>

              <Pressable
                style={styles.button}
                onPress={() => handleOAuthLogin("google")}
                disabled={loading}
              >
                <FontAwesome5
                  name="google"
                  brand
                  size={20}
                  color={colors.dark.foreground}
                  style={styles.icon}
                />
                <Text style={styles.buttonText}>{t("login.google")}</Text>
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t("login.or")}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email Login Button */}
              <Pressable
                style={styles.button}
                onPress={() => setShowEmailForm(true)}
                disabled={loading}
              >
                <FontAwesome5
                  name="envelope"
                  solid
                  size={20}
                  color={colors.dark.foreground}
                  style={styles.icon}
                />
                <Text style={styles.buttonText}>{t("login.email")}</Text>
              </Pressable>

              {/* Guest */}
              <Pressable
                style={styles.buttonGuest}
                onPress={() => handleOAuthLogin("guest")}
                disabled={loading}
              >
                <FontAwesome5
                  name="user"
                  solid
                  size={20}
                  color={colors.dark.secondaryForeground}
                  style={styles.icon}
                />
                <Text style={styles.buttonTextGuest}>{t("login.guest")}</Text>
              </Pressable>
            </>
          ) : (
            /* Email Form */
            <View style={styles.emailForm}>
              <Pressable
                style={styles.backButton}
                onPress={() => setShowEmailForm(false)}
              >
                <FontAwesome5
                  name="arrow-left"
                  solid
                  size={16}
                  color={colors.dark.secondaryForeground}
                />
                <Text style={styles.backText}>{t("login.back")}</Text>
              </Pressable>

              <TextInput
                style={styles.input}
                placeholder={t("login.emailPlaceholder")}
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
                placeholder={t("login.passwordPlaceholder")}
                placeholderTextColor={colors.dark.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              <Pressable
                style={[
                  styles.loginButton,
                  (!email.trim() || !password.trim()) && styles.loginButtonDisabled,
                ]}
                onPress={handleEmailLogin}
                disabled={loading || !email.trim() || !password.trim()}
              >
                {loading ? (
                  <ActivityIndicator color={colors.dark.primaryForeground} />
                ) : (
                  <Text style={styles.loginButtonText}>{t("login.signIn")}</Text>
                )}
              </Pressable>

              <Pressable onPress={() => router.push("/register")} disabled={loading}>
                <Text style={styles.registerLink}>{t("login.noAccount")}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {loading && !showEmailForm && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.dark.primary} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.background },
  scrollContent: { flexGrow: 1, padding: 24 },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.dark.foreground,
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: colors.dark.secondaryForeground },
  buttonContainer: { paddingBottom: 48, gap: 14 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30,35,48,0.8)",
    borderWidth: 1,
    borderColor: colors.dark.border,
    height: 56,
    borderRadius: 28,
  },
  buttonGuest: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    height: 48,
    borderRadius: 24,
  },
  icon: { position: "absolute", left: 24 },
  buttonText: { color: colors.dark.foreground, fontSize: 16, fontWeight: "600" },
  buttonTextGuest: {
    color: colors.dark.secondaryForeground,
    fontSize: 14,
    fontWeight: "500",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.dark.border,
  },
  dividerText: {
    color: colors.dark.secondaryForeground,
    fontSize: 13,
    marginHorizontal: 16,
  },

  emailForm: { gap: 14 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  backText: {
    color: colors.dark.secondaryForeground,
    fontSize: 14,
  },
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
  loginButton: {
    backgroundColor: colors.dark.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: colors.dark.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
  registerLink: {
    color: colors.dark.primary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(10,13,20,0.7)",
  },
});