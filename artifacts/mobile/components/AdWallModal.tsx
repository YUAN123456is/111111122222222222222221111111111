import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator } from "react-native";
import { useUnlockEpisodes } from "@workspace/api-client-react";
import { useRewardedAd } from "@/hooks/useRewardedAd";
import colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

interface AdWallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (unlockedEpisodes: number[]) => void;
  userId: string;
  dramaId: string;
  episode: number;
  episodesPerAdUnlock: number;
}

export default function AdWallModal({ visible, onClose, onSuccess, userId, dramaId, episode, episodesPerAdUnlock }: AdWallModalProps) {
  const unlockEpisodes = useUnlockEpisodes();
  const { loaded: adLoaded, showing: adShowing, showAd } = useRewardedAd();
  const [state, setState] = useState<"default" | "loading" | "error" | "limit_reached">("default");

  const handleWatchAd = async () => {
    setState("loading");

    try {
      // Show real AdMob rewarded video
      const rewardEarned = await showAd();

      if (!rewardEarned) {
        // User closed ad before earning reward (or ad failed)
        setState("default");
        return;
      }

      // User earned reward - unlock episodes via backend
      const result = await unlockEpisodes.mutateAsync({
        data: { userId, dramaId, currentEpisodeNumber: episode },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(result.unlockedEpisodes);
      setState("default");
    } catch (err: unknown) {
      const status = (err as { status?: number } | null)?.status;
      if (status === 400) {
        setState("limit_reached");
      } else {
        setState("error");
      }
    }
  };

  const endRange = episode + episodesPerAdUnlock - 1;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Unlock Episodes</Text>
          <Text style={styles.subtitle}>
            Watch 1 short ad to unlock episodes {episode}–{endRange} for free.
          </Text>

          {state === "limit_reached" ? (
            <View style={styles.disabledButton}>
              <Text style={styles.disabledButtonText}>Daily limit reached. Come back tomorrow!</Text>
            </View>
          ) : state === "error" ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Ad unavailable, please try again later</Text>
              <Pressable style={styles.primaryButton} onPress={() => setState("default")}>
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[styles.primaryButton, (state === "loading" || adShowing) && styles.loadingButton]}
              onPress={handleWatchAd}
              disabled={state === "loading" || adShowing}
            >
              {state === "loading" || adShowing ? (
                <ActivityIndicator color={colors.dark.primaryForeground} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {adLoaded ? "Watch Ad to Unlock" : "Loading Ad..."}
                </Text>
              )}
            </Pressable>
          )}

          <Pressable style={styles.ghostButton} onPress={onClose}>
            <Text style={styles.ghostButtonText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.dark.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.dark.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.dark.secondaryForeground,
    textAlign: "center",
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: colors.dark.primary,
    height: 56,
    width: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loadingButton: {
    backgroundColor: colors.dark.mutedForeground,
  },
  primaryButtonText: {
    color: colors.dark.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
  ghostButton: {
    backgroundColor: "rgba(30,35,48,0.8)",
    borderWidth: 1,
    borderColor: colors.dark.border,
    height: 56,
    width: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  ghostButtonText: {
    color: colors.dark.secondaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: colors.dark.border,
    height: 56,
    width: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  disabledButtonText: {
    color: colors.dark.mutedForeground,
    fontSize: 14,
    fontWeight: "600",
  },
  errorContainer: {
    width: "100%",
    alignItems: "center",
  },
  errorText: {
    color: colors.dark.destructive,
    marginBottom: 16,
    fontSize: 14,
  },
});