import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useListDramas, getListDramasQueryKey } from "@workspace/api-client-react";
import { useLocale, getLocalizedTitle } from "@/context/LocaleContext";
import colors from "@/constants/colors";
import { FontAwesome5 } from "@expo/vector-icons";

export default function Search() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const { data: dramas, isLoading, isFetching, isError, refetch } = useListDramas(
    { publishedOnly: true, search: submittedQuery || undefined },
    { query: { queryKey: getListDramasQueryKey({ publishedOnly: true, search: submittedQuery || undefined }) } },
  );

  const hasSearched = submittedQuery.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <FontAwesome5 name="chevron-left" solid size={20} color={colors.dark.foreground} />
        </Pressable>
        <View style={styles.inputWrap}>
          <FontAwesome5 name="search" solid size={14} color={colors.dark.secondaryForeground} />
          <TextInput
            style={styles.input}
            placeholder={t("search.placeholder")}
            placeholderTextColor={colors.dark.secondaryForeground}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => setSubmittedQuery(query)}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(""); setSubmittedQuery(""); }} hitSlop={8}>
              <FontAwesome5 name="times-circle" solid size={16} color={colors.dark.secondaryForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading && isFetching && hasSearched ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.dark.primary} size="large" />
        </View>
      ) : !hasSearched ? (
        <View style={styles.centered}>
          <FontAwesome5 name="search" solid size={40} color={colors.dark.secondary} />
          <Text style={styles.hintText}>{t("search.hint")}</Text>
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.hintText}>{t("home.loadError")}</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>{t("home.retry")}</Text>
          </Pressable>
        </View>
      ) : (dramas ?? []).filter((d) => d.totalEpisodes > 0).length === 0 ? (
        <View style={styles.centered}>
          <FontAwesome5 name="frown" regular size={40} color={colors.dark.secondary} />
          <Text style={styles.hintText}>{t("search.noResults", { q: submittedQuery })}</Text>
        </View>
      ) : (
        <FlatList
          data={(dramas ?? []).filter((d) => d.totalEpisodes > 0)}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: "/player", params: { dramaId: item.id, initialEpisode: 1 } })}
            >
              <Image source={{ uri: item.coverUrl }} style={styles.poster} />
              <View style={styles.freeBadge}>
                <Text style={styles.freeText}>{t("home.free", { n: item.freeEpisodesCount })}</Text>
              </View>
              <Text style={styles.title} numberOfLines={2}>{getLocalizedTitle(item, locale)}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.dark.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, gap: 8 },
  backButton: { padding: 8 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dark.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  input: { flex: 1, color: colors.dark.foreground, fontSize: 15, padding: 0 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  hintText: { color: colors.dark.secondaryForeground, fontSize: 14 },
  grid: { padding: 8 },
  card: { width: "50%", padding: 8 },
  poster: { width: "100%", aspectRatio: 3 / 4, borderRadius: 8, backgroundColor: colors.dark.card },
  freeBadge: { position: "absolute", top: 16, right: 16, backgroundColor: colors.dark.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  freeText: { color: colors.dark.accentForeground, fontSize: 10, fontWeight: "bold" },
  retryButton: { backgroundColor: colors.dark.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryButtonText: { color: colors.dark.primaryForeground, fontWeight: "600" },

  title: { color: colors.dark.foreground, fontSize: 14, fontWeight: "600", marginTop: 8 },
});
