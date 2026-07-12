import { createContext, useContext, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRegisterUser, useLoginUser } from "@workspace/api-client-react";
import * as AuthSession from "expo-auth-session";
import * as AppleAuthSession from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { translations, DEFAULT_LOCALE, TranslationKey } from "@/i18n/translations";

interface AuthState {
  hasCompletedOnboarding: boolean;
  attChoice: "allow" | "ask_not_to_track" | null;
  provider: "apple" | "google" | "guest" | "email" | null;
  userId: string | null;
  email: string | null;
}

interface AuthContextType extends AuthState {
  completeOnboarding: (attChoice: "allow" | "ask_not_to_track") => Promise<void>;
  signIn: (provider: "apple" | "google" | "guest") => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const generateDeviceId = () => `dev_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

// Google OAuth config - replace with your own client IDs from Google Cloud Console
// Google OAuth config - replace with your own client IDs from Google Cloud Console
const GOOGLE_CLIENT_ID = {
  // For Expo Go / development
  expo: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || "",
  // For standalone Android build
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
  // For standalone iOS build
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
};

function isGoogleClientIdConfigured(): boolean {
  const id = GOOGLE_CLIENT_ID.expo || GOOGLE_CLIENT_ID.android || GOOGLE_CLIENT_ID.ios;
  return Boolean(id && id !== "");
}
function getStoredLocale(): string {
  try {
    const stored = (globalThis as any).__authLocaleOverride as string | undefined;
    if (stored && translations[stored]) return stored;
  } catch (e) {
    // ignore
  }
  return DEFAULT_LOCALE;
}

function authT(key: TranslationKey): string {
  const locale = getStoredLocale();
  const dict = translations[locale] ?? translations[DEFAULT_LOCALE];
  return dict[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    hasCompletedOnboarding: false,
    attChoice: null,
    provider: null,
    userId: null,
    email: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const registerUser = useRegisterUser();
  const loginUser = useLoginUser();

  useEffect(() => {
    AsyncStorage.getItem("auth_state").then((data) => {
      if (data) {
        setState(JSON.parse(data));
      }
      setIsLoading(false);
    });
  }, []);

  const saveState = async (newState: AuthState) => {
    setState(newState);
    await AsyncStorage.setItem("auth_state", JSON.stringify(newState));
  };

  const completeOnboarding = async (attChoice: "allow" | "ask_not_to_track") => {
    await saveState({ ...state, hasCompletedOnboarding: true, attChoice });
  };

  const signIn = async (provider: "apple" | "google" | "guest") => {
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else if (provider === "apple") {
        await signInWithApple();
      } else {
        await signInAsGuest();
      }
    } catch (err: any) {
      if (err?.message !== "CANCELLED") {
        Alert.alert(authT("auth.signInFailedTitle"), authT("auth.signInFailedMsg"));
      }
    }
  };

  const signInWithGoogle = async () => {
    if (!isGoogleClientIdConfigured()) {
      Alert.alert(authT("auth.googleUnavailableTitle"), authT("auth.googleUnavailableMsg"));
      return;
    }
    const clientId = GOOGLE_CLIENT_ID.expo;
    const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ["openid", "profile", "email"],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      nonce: await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(36).slice(2)
      ),
    });

    const discovery = {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
    };

    const result = await request.promptAsync(discovery, { useProxy: true });

    if (result.type !== "success" || !result.params.id_token) {
      throw new Error("CANCELLED");
    }

    // Register with Google token as deviceId (server can verify later)
    const deviceId = `google_${await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, result.params.id_token.slice(0, 32))}`;
    const user = await registerUser.mutateAsync({
      data: { deviceId, authProvider: "google" },
    });
    await saveState({ ...state, provider: "google", userId: user.id, email: null });
  };

  const signInWithApple = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert(authT("auth.appleUnavailableTitle"), authT("auth.appleUnavailableMsg"));
      throw new Error("CANCELLED");
    }

    const isAvailable = await AppleAuthSession.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(authT("auth.appleUnavailableTitle"), authT("auth.appleUnavailableMsg"));
      throw new Error("CANCELLED");
    }

    let credential;
    try {
      credential = await AppleAuthSession.signInAsync({
        requestedScopes: [
          AppleAuthSession.AppleAuthenticationScope.FULL_NAME,
          AppleAuthSession.AppleAuthenticationScope.EMAIL,
        ],
      });
    } catch (appleErr: any) {
      // Apple Auth throws ERR_REQUEST_CANCELED when user cancels
      if (appleErr?.code === "ERR_REQUEST_CANCELED" || appleErr?.code === "ERR_CANCELED") {
        throw new Error("CANCELLED");
      }
      throw appleErr;
    }

    const deviceId = `apple_${credential.user}`;
    const user = await registerUser.mutateAsync({
      data: { deviceId, authProvider: "apple" },
    });

    // Apple only provides name/email on first sign-in
    const email = credential.email ?? state.email;
    await saveState({ ...state, provider: "apple", userId: user.id, email });
  };

  const signInAsGuest = async () => {
    let deviceId = await AsyncStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem("device_id", deviceId);
    }

    const user = await registerUser.mutateAsync({
      data: { deviceId, authProvider: "guest" },
    });
    await saveState({ ...state, provider: "guest", userId: user.id, email: null });
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const user = await loginUser.mutateAsync({
        data: { email, password },
      });
      await saveState({ ...state, provider: "email", userId: user.id, email: user.email ?? email });
    } catch (err: any) {
      const msg = (err?.data && typeof err.data === "object" && err.data.error) || err?.message || authT("auth.loginFailedMsg");
      Alert.alert(authT("auth.loginFailedTitle"), msg);
      throw err;
    }
  };

  const registerWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      const user = await registerUser.mutateAsync({
        data: { authProvider: "email", email, password, displayName },
      });
      await saveState({ ...state, provider: "email", userId: user.id, email: user.email ?? email });
    } catch (err: any) {
      const msg = (err?.data && typeof err.data === "object" && err.data.error) || err?.message || authT("auth.registerFailedMsg");
      Alert.alert(authT("auth.registerFailedTitle"), msg);
      throw err;
    }
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove(["auth_state", "drama_state"]);
    setState({
      hasCompletedOnboarding: false,
      attChoice: null,
      provider: null,
      userId: null,
      email: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        completeOnboarding,
        signIn,
        signInWithEmail,
        registerWithEmail,
        signOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};