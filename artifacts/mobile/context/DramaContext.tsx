import { createContext, useContext, useMemo } from "react";
import {
  useListWatchProgress,
  useSetWatchProgress,
  useListFavorites,
  useAddFavorite,
  useRemoveFavorite,
  getListWatchProgressQueryKey,
  getListFavoritesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

interface WatchHistoryEntry {
  lastEpisode: number;
  position: number;
}

interface FavoriteEntry {
  dramaId: string;
  titleEn: string;
  titles?: Record<string, string> | null;
  coverUrl: string;
  freeEpisodesCount?: number;
  createdAt: string;
}

interface DramaContextType {
  watchHistory: Record<string, WatchHistoryEntry>;
  favorites: FavoriteEntry[];
  isFavorite: (dramaId: string) => boolean;
  updateProgress: (dramaId: string, episode: number, position: number) => Promise<void>;
  toggleFavorite: (dramaId: string) => Promise<void>;
}

const DramaContext = createContext<DramaContextType | null>(null);

export function DramaProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: progressList } = useListWatchProgress(userId ?? "guest", {
    query: { enabled: !!userId, queryKey: getListWatchProgressQueryKey(userId ?? "guest") },
  });
  const { data: favoritesList } = useListFavorites(userId ?? "guest", {
    query: { enabled: !!userId, queryKey: getListFavoritesQueryKey(userId ?? "guest") },
  });

  const setWatchProgress = useSetWatchProgress();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const watchHistory = useMemo(() => {
    const map: Record<string, WatchHistoryEntry> = {};
    for (const entry of progressList ?? []) {
      map[entry.dramaId] = { lastEpisode: entry.lastEpisode, position: entry.position };
    }
    return map;
  }, [progressList]);

  const favorites = useMemo(() => favoritesList ?? [], [favoritesList]);

  const isFavorite = (dramaId: string) => favorites.some((f) => f.dramaId === dramaId);

  const updateProgress = async (dramaId: string, episode: number, position: number) => {
    if (!userId) return;
    try {
      await setWatchProgress.mutateAsync({ userId, dramaId, data: { lastEpisode: episode, position } });
      queryClient.invalidateQueries({ queryKey: getListWatchProgressQueryKey(userId) });
    } catch {
      // best-effort â€?stale userId or network error, don't crash
    }
  };

  const toggleFavorite = async (dramaId: string) => {
    if (!userId) return;
    try {
      if (isFavorite(dramaId)) {
        await removeFavorite.mutateAsync({ userId, dramaId });
      } else {
        await addFavorite.mutateAsync({ userId, dramaId });
      }
      queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey(userId) });
    } catch {
      // best-effort â€?stale userId or network error, don't crash
    }
  };

  return (
    <DramaContext.Provider value={{ watchHistory, favorites, isFavorite, updateProgress, toggleFavorite }}>
      {children}
    </DramaContext.Provider>
  );
}

export const useDrama = () => {
  const context = useContext(DramaContext);
  if (!context) throw new Error("useDrama must be used within a DramaProvider");
  return context;
};