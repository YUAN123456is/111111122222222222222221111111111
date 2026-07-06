import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useDrama } from "@/context/DramaContext";
import { useListDramas } from "@workspace/api-client-react";
import colors from "@/constants/colors";
import { FontAwesome5 } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";

export default function Profile() {
  const router = useRouter();
  const { provider, signOut } = useAuth();
  const { watchHistory } = useDrama();
  const { data: dramas } = useListDramas({ publishedOnly: true });
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [language, setLanguage] = useState("English");

  const historyDramas = Object.keys(watchHistory).map(id => {
    return { drama: dramas?.find(d => d.id === id), history: watchHistory[id] };
  }).filter(h => h.drama);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This will permanently delete all your viewing progress and unlocked episodes.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await signOut();
            router.replace("/login");
          }
        }
      ]
    );
  };

  const openLink = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" solid size={20} color={colors.dark.foreground} />
        </Pressable>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <FontAwesome5 name="user-circle" solid size={24} color={colors.dark.secondaryForeground} />
              <Text style={styles.rowText}>
                Signed in as {provider === "guest" ? "Guest" : provider}
              </Text>
            </View>
            <Pressable style={styles.logoutButton} onPress={handleSignOut}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </Pressable>
          </View>
        </View>

        {historyDramas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Watch History</Text>
            <View style={styles.card}>
              {historyDramas.map(({ drama, history }, index) => (
                <View key={drama!.id}>
                  <Pressable 
                    style={styles.historyRow}
                    onPress={() => router.push({ pathname: "/player", params: { dramaId: drama!.id, initialEpisode: history.lastEpisode } })}
                  >
                    <Text style={styles.historyTitle} numberOfLines={1}>{drama!.titleEn}</Text>
                    <Text style={styles.historyEp}>EP {history.lastEpisode}</Text>
                  </Pressable>
                  {index < historyDramas.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <Pressable style={styles.menuRow} onPress={() => setLangModalVisible(true)}>
              <Text style={styles.menuText}>Language</Text>
              <View style={styles.menuRight}>
                <Text style={styles.menuValue}>{language}</Text>
                <FontAwesome5 name="chevron-right" solid size={12} color={colors.dark.secondaryForeground} />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          <View style={styles.card}>
            <Pressable style={styles.menuRow}>
              <Text style={styles.menuText}>Report a problem</Text>
              <FontAwesome5 name="chevron-right" solid size={12} color={colors.dark.secondaryForeground} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.menuRow} onPress={() => openLink("https://example.com/privacy")}>
              <Text style={styles.menuText}>Privacy Policy</Text>
              <FontAwesome5 name="chevron-right" solid size={12} color={colors.dark.secondaryForeground} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.menuRow} onPress={() => openLink("https://example.com/terms")}>
              <Text style={styles.menuText}>Terms of Service</Text>
              <FontAwesome5 name="chevron-right" solid size={12} color={colors.dark.secondaryForeground} />
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={langModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setLangModalVisible(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Language</Text>
            {["English", "Español", "繁體中文", "ไทย", "日本語"].map(lang => (
              <Pressable 
                key={lang} 
                style={styles.langRow}
                onPress={() => { setLanguage(lang); setLangModalVisible(false); }}
              >
                <Text style={[styles.langText, language === lang && styles.langTextActive]}>{lang}</Text>
                {language === lang && <FontAwesome5 name="check" solid size={14} color={colors.dark.primary} />}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.dark.background,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.dark.foreground,
  },
  placeholder: {
    width: 36,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark.secondaryForeground,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  rowText: {
    color: colors.dark.foreground,
    fontSize: 16,
    marginLeft: 12,
  },
  logoutButton: {
    margin: 16,
    marginTop: 0,
    backgroundColor: colors.dark.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: {
    color: colors.dark.foreground,
    fontWeight: "600",
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  historyTitle: {
    flex: 1,
    color: colors.dark.foreground,
    fontSize: 16,
    marginRight: 16,
  },
  historyEp: {
    color: colors.dark.secondaryForeground,
    fontSize: 14,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  menuText: {
    color: colors.dark.foreground,
    fontSize: 16,
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuValue: {
    color: colors.dark.secondaryForeground,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.dark.border,
    marginLeft: 16,
  },
  deleteButton: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.dark.destructive,
    borderStyle: "dashed",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 48,
  },
  deleteText: {
    color: colors.dark.destructive,
    fontWeight: "600",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    backgroundColor: colors.dark.card,
    borderRadius: 16,
    width: "80%",
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.dark.foreground,
    marginBottom: 16,
    textAlign: "center",
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  langText: {
    color: colors.dark.foreground,
    fontSize: 16,
  },
  langTextActive: {
    color: colors.dark.primary,
    fontWeight: "600",
  },
});
