import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useLocale } from "@/context/LocaleContext";
import colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReportSheet({ visible, onClose }: ReportSheetProps) {
  const { t } = useLocale();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const REASONS = [
    { key: "report.sexual", label: t("report.sexual") },
    { key: "report.violence", label: t("report.violence") },
    { key: "report.copyright", label: t("report.copyright") },
    { key: "report.other", label: t("report.other") },
  ];

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelected(null);
      onClose();
    }, 1500);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {submitted ? (
            <View style={styles.successBox}>
              <FontAwesome5 name="check-circle" solid size={48} color={colors.dark.primary} />
              <Text style={styles.successText}>{t("report.submitted")}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>{t("report.title")}</Text>

              {REASONS.map((reason) => (
                <Pressable
                  key={reason.key}
                  style={styles.row}
                  onPress={() => setSelected(reason.key)}
                >
                  <View style={styles.checkbox}>
                    {selected === reason.key && (
                      <FontAwesome5 name="check" solid size={12} color={colors.dark.primaryForeground} />
                    )}
                  </View>
                  <Text style={styles.reasonText}>{reason.label}</Text>
                </Pressable>
              ))}

              <Pressable
                style={[styles.submitButton, !selected && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!selected}
              >
                <Text style={styles.submitText}>{t("report.submit")}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: colors.dark.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.dark.foreground,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.dark.border,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.dark.background,
  },
  reasonText: {
    color: colors.dark.foreground,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: colors.dark.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: colors.dark.mutedForeground,
  },
  submitText: {
    color: colors.dark.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
  successBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 16,
  },
  successText: {
    color: colors.dark.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
});
