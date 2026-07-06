import React from "react";
import { View, Text, StyleSheet, Pressable, Modal, FlatList } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import colors from "@/constants/colors";

interface DrawerEpisode {
  episodeNumber: number;
  isUnlocked: boolean;
}

interface EpisodeDrawerProps {
  visible: boolean;
  onClose: () => void;
  episodes: DrawerEpisode[];
  currentEpisode: number;
  onSelectEpisode: (ep: number, isUnlocked: boolean) => void;
}

export default function EpisodeDrawer({ visible, onClose, episodes, currentEpisode, onSelectEpisode }: EpisodeDrawerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Episodes</Text>
            <Pressable onPress={onClose}>
              <FontAwesome5 name="times" solid size={20} color={colors.dark.secondaryForeground} />
            </Pressable>
          </View>

          <FlatList
            data={episodes}
            numColumns={5}
            keyExtractor={(item) => item.episodeNumber.toString()}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => {
              const isUnlocked = item.isUnlocked;
              const isActive = item.episodeNumber === currentEpisode;

              return (
                <Pressable
                  style={[
                    styles.tile,
                    isActive && styles.tileActive,
                    !isUnlocked && styles.tileLocked
                  ]}
                  onPress={() => onSelectEpisode(item.episodeNumber, isUnlocked)}
                >
                  <Text style={[
                    styles.tileText,
                    isActive && styles.tileTextActive,
                    !isUnlocked && styles.tileTextLocked
                  ]}>
                    {item.episodeNumber}
                  </Text>
                  {!isUnlocked && (
                    <FontAwesome5
                      name="lock"
                      solid
                      size={10}
                      color={colors.dark.mutedForeground}
                      style={styles.lockIcon}
                    />
                  )}
                </Pressable>
              );
            }}
          />
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
    height: "60%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.dark.foreground,
  },
  grid: {
    paddingBottom: 24,
  },
  tile: {
    flex: 1,
    margin: 6,
    aspectRatio: 1,
    backgroundColor: colors.dark.secondary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  tileActive: {
    backgroundColor: colors.dark.primary,
  },
  tileLocked: {
    backgroundColor: colors.dark.background,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  tileText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.foreground,
  },
  tileTextActive: {
    color: colors.dark.primaryForeground,
  },
  tileTextLocked: {
    color: colors.dark.mutedForeground,
  },
  lockIcon: {
    position: "absolute",
    bottom: 4,
    right: 4,
  },
});
