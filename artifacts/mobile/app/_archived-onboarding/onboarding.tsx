import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import colors from "@/constants/colors";

export default function Onboarding() {
  const { completeOnboarding } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [showATT, setShowATT] = useState(false);

  const handleContinue = () => {
    setShowATT(true);
  };

  const handleATT = async (choice: "allow" | "ask_not_to_track") => {
    setShowATT(false);
    await completeOnboarding(choice);
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t("onboarding.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.subtitle")}</Text>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={handleContinue} testID="onboarding-continue">
          <Text style={styles.buttonText}>{t("onboarding.continue")}</Text>
        </Pressable>
      </View>

      <Modal visible={showATT} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.attModal}>
            <Text style={styles.attTitle}>{t("onboarding.attTitle")}</Text>
            <Text style={styles.attBody}>{t("onboarding.attBody")}</Text>
            
            <View style={styles.attButtons}>
              <Pressable style={styles.attButton} onPress={() => handleATT("ask_not_to_track")}>
                <Text style={styles.attButtonTextBlue}>{t("onboarding.attAskNotToTrack")}</Text>
              </Pressable>
              <View style={styles.divider} />
              <Pressable style={styles.attButton} onPress={() => handleATT("allow")}>
                <Text style={styles.attButtonTextBlue}>{t("onboarding.attAllow")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.background },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 32, fontWeight: "bold", color: colors.dark.foreground, marginBottom: 12 },
  subtitle: { fontSize: 16, color: colors.dark.secondaryForeground, textAlign: "center" },
  footer: { padding: 24, paddingBottom: 48 },
  button: { backgroundColor: colors.dark.primary, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  buttonText: { color: colors.dark.primaryForeground, fontSize: 18, fontWeight: "600" },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  attModal: { backgroundColor: "#e5e5ea", borderRadius: 14, width: 280, overflow: "hidden" },
  attTitle: { fontSize: 17, fontWeight: "600", textAlign: "center", paddingTop: 20, paddingHorizontal: 16, color: "#000" },
  attBody: { fontSize: 13, textAlign: "center", paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, color: "#000" },
  attButtons: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#c6c6c8" },
  attButton: { height: 44, justifyContent: "center", alignItems: "center" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#c6c6c8" },
  attButtonTextBlue: { color: "#007AFF", fontSize: 17, fontWeight: "400" },
});
