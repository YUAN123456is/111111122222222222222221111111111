import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useDrama } from "@/context/DramaContext";
import { useLocale, getLocalizedTitle } from "@/context/LocaleContext";
import { SUPPORTED_LOCALES } from "@/i18n/translations";
import { useListDramas } from "@workspace/api-client-react";
import colors from "@/constants/colors";
import { FontAwesome5 } from "@expo/vector-icons";

type ModalType = "lang" | "report" | "privacy" | "terms" | null;

export default function Profile() {
  const router = useRouter();
  const { provider, userId, email, signOut } = useAuth();
  const { watchHistory, favorites } = useDrama();
  const { locale, setLocale, t } = useLocale();
  const { data: dramas } = useListDramas({ publishedOnly: true });
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const currentLanguageLabel = SUPPORTED_LOCALES.find((l) => l.code === locale)?.label ?? "English";

  const historyDramas = Object.keys(watchHistory).map(id => {
    return { drama: dramas?.find(d => d.id === id), history: watchHistory[id] };
  }).filter(h => h.drama);

  const handleSignOut = async () => {
    Alert.alert(
      t("profile.signOutConfirmTitle"),
      t("profile.signOutConfirmMsg"),
      [
        { text: t("profile.cancel"), style: "cancel" },
        {
          text: t("profile.signOutConfirm"),
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/login");
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("profile.deleteConfirmTitle"),
      t("profile.deleteConfirmMsg"),
      [
        { text: t("profile.cancel"), style: "cancel" },
        {
          text: t("profile.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              if (userId) {
                const apiUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/users/${userId}`;
                await fetch(apiUrl, { method: "DELETE" });
              }
            } catch {
              // Best-effort delete; still sign out
            }
            await signOut();
            router.replace("/login");
          }
        }
      ]
    );
  };

  const handleSubmitReport = () => {
    if (!reportText.trim()) return;
    setReportSent(true);
    setTimeout(() => {
      setReportSent(false);
      setReportText("");
      setActiveModal(null);
    }, 1500);
  };

  const closeModal = () => setActiveModal(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" solid size={20} color={colors.dark.foreground} />
        </Pressable>
        <Text style={styles.title}>{t("profile.title")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.account")}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <FontAwesome5 name="user-circle" solid size={24} color={colors.dark.secondaryForeground} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.rowText}>
                  {t("profile.signedInAs", { provider: provider === "guest" ? t("profile.guest") : provider === "email" ? (email ?? "Email") : (provider ?? "") })}
                </Text>
                {userId && (
                  <Text style={styles.userIdText}>ID: {userId.slice(-10).toUpperCase()}</Text>
                )}
              </View>
            </View>
            <Pressable style={styles.logoutButton} onPress={handleSignOut}>
              <Text style={styles.logoutText}>{t("profile.signOut")}</Text>
            </Pressable>
          </View>
        </View>

        {/* Favorites */}
        {favorites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("profile.favorites")}</Text>
            <View style={styles.card}>
              {favorites.map((fav, index) => (
                <View key={fav.dramaId}>
                  <Pressable
                    style={styles.historyRow}
                    onPress={() => router.push({ pathname: "/player", params: { dramaId: fav.dramaId } })}
                  >
                    <Text style={styles.historyTitle} numberOfLines={1}>{getLocalizedTitle(fav, locale)}</Text>
                    <FontAwesome5 name="bookmark" solid size={14} color={colors.dark.accent} />
                  </Pressable>
                  {index < favorites.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Watch History */}
        {historyDramas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("profile.watchHistory")}</Text>
            <View style={styles.card}>
              {historyDramas.map(({ drama, history }, index) => (
                <View key={drama!.id}>
                  <Pressable
                    style={styles.historyRow}
                    onPress={() => router.push({ pathname: "/player", params: { dramaId: drama!.id, initialEpisode: history.lastEpisode } })}
                  >
                    <Text style={styles.historyTitle} numberOfLines={1}>{getLocalizedTitle(drama!, locale)}</Text>
                    <Text style={styles.historyEp}>{t("home.ep", { n: history.lastEpisode })}</Text>
                  </Pressable>
                  {index < historyDramas.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.settings")}</Text>
          <View style={styles.card}>
            <Pressable style={styles.menuRow} onPress={() => setActiveModal("lang")}>
              <Text style={styles.menuText}>{t("profile.language")}</Text>
              <View style={styles.menuRight}>
                <Text style={styles.menuValue}>{currentLanguageLabel}</Text>
                <FontAwesome5 name="chevron-right" solid size={12} color={colors.dark.secondaryForeground} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.supportLegal")}</Text>
          <View style={styles.card}>
            <Pressable style={styles.menuRow} onPress={() => setActiveModal("report")}>
              <Text style={styles.menuText}>{t("profile.report")}</Text>
              <FontAwesome5 name="chevron-right" solid size={12} color={colors.dark.secondaryForeground} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.menuRow} onPress={() => setActiveModal("privacy")}>
              <Text style={styles.menuText}>{t("profile.privacy")}</Text>
              <FontAwesome5 name="chevron-right" solid size={12} color={colors.dark.secondaryForeground} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.menuRow} onPress={() => setActiveModal("terms")}>
              <Text style={styles.menuText}>{t("profile.terms")}</Text>
              <FontAwesome5 name="chevron-right" solid size={12} color={colors.dark.secondaryForeground} />
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>{t("profile.deleteAccount")}</Text>
        </Pressable>
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={activeModal === "lang"} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t("profile.selectLanguage")}</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {SUPPORTED_LOCALES.map(({ code, label }) => (
                <Pressable
                  key={code}
                  style={styles.langRow}
                  onPress={() => { setLocale(code); closeModal(); }}
                >
                  <Text style={[styles.langText, locale === code && styles.langTextActive]}>{label}</Text>
                  {locale === code && <FontAwesome5 name="check" solid size={14} color={colors.dark.primary} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={activeModal === "report"} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={[styles.modalSheet, styles.modalSheetWide]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t("profile.report")}</Text>
              <Pressable onPress={closeModal}>
                <FontAwesome5 name="times" solid size={18} color={colors.dark.secondaryForeground} />
              </Pressable>
            </View>

            {reportSent ? (
              <View style={styles.reportSentBox}>
                <FontAwesome5 name="check-circle" solid size={48} color={colors.dark.accent} />
                <Text style={styles.reportSentText}>{t("profile.reportSent")}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.reportHint}>{t("profile.reportHint")}</Text>
                <TextInput
                  style={styles.reportInput}
                  placeholder={t("profile.reportPlaceholder")}
                  placeholderTextColor={colors.dark.mutedForeground}
                  value={reportText}
                  onChangeText={setReportText}
                  multiline
                  textAlignVertical="top"
                  maxLength={1000}
                />
                <Text style={styles.reportCount}>{reportText.length}/1000</Text>
                <Pressable
                  style={[styles.reportButton, !reportText.trim() && styles.reportButtonDisabled]}
                  onPress={handleSubmitReport}
                  disabled={!reportText.trim()}
                >
                  <Text style={styles.reportButtonText}>{t("profile.reportSubmit")}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={activeModal === "privacy"} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={[styles.modalSheet, styles.modalSheetWide]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t("profile.privacy")}</Text>
              <Pressable onPress={closeModal}>
                <FontAwesome5 name="times" solid size={18} color={colors.dark.secondaryForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.legalScroll}>
              <Text style={styles.legalText}>{t("profile.privacyContent")}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal visible={activeModal === "terms"} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={[styles.modalSheet, styles.modalSheetWide]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t("profile.terms")}</Text>
              <Pressable onPress={closeModal}>
                <FontAwesome5 name="times" solid size={18} color={colors.dark.secondaryForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.legalScroll}>
              <Text style={styles.legalText}>{t("profile.termsContent")}</Text>
            </ScrollView>
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
  },
  userIdText: {
    color: colors.dark.secondaryForeground,
    fontSize: 12,
    marginTop: 2,
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

  /* Modal shared */
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
  modalSheetWide: {
    width: "90%",
    maxHeight: "80%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.dark.foreground,
    textAlign: "center",
    flex: 1,
  },

  /* Language */
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

  /* Report */
  reportHint: {
    color: colors.dark.secondaryForeground,
    fontSize: 14,
    marginBottom: 12,
  },
  reportInput: {
    backgroundColor: "rgba(10,13,20,0.5)",
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 12,
    padding: 16,
    color: colors.dark.foreground,
    fontSize: 15,
    minHeight: 140,
  },
  reportCount: {
    color: colors.dark.mutedForeground,
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  reportButton: {
    backgroundColor: colors.dark.primary,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  reportButtonDisabled: {
    opacity: 0.4,
  },
  reportButtonText: {
    color: colors.dark.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
  reportSentBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 16,
  },
  reportSentText: {
    color: colors.dark.foreground,
    fontSize: 16,
    fontWeight: "600",
  },

  /* Legal */
  legalScroll: {
    maxHeight: 400,
  },
  legalText: {
    color: colors.dark.secondaryForeground,
    fontSize: 14,
    lineHeight: 22,
  },
});


