import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  Dimensions, ActivityIndicator, SafeAreaView, PanResponder
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView, VideoPlayer } from 'expo-video';
import { FontAwesome5 } from '@expo/vector-icons';
import { useGetDramaPlayback, getGetDramaPlaybackQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDrama } from '@/context/DramaContext';
import colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

import AdWallModal from '@/components/AdWallModal';
import EpisodeDrawer from '@/components/EpisodeDrawer';
import ReportSheet from '@/components/ReportSheet';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

const SingleVideo = ({
  url, isActive, isUnlocked, onNeedAd, onActivePlayerReady
}: {
  url: string, isActive: boolean, isUnlocked: boolean, onNeedAd: () => void,
  onActivePlayerReady: (player: VideoPlayer | null) => void
}) => {
  const player = useVideoPlayer(url, player => {
    player.loop = true;
    player.timeUpdateEventInterval = 0.5;
    if (isActive && isUnlocked) {
      player.play();
    }
  });

  useEffect(() => {
    if (isActive) {
      onActivePlayerReady(player);
    }
    return () => {
      if (isActive) {
        onActivePlayerReady(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, player]);

  useEffect(() => {
    if (isActive && isUnlocked) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, isUnlocked, player]);

  // Handle ad wall timer if locked
  useEffect(() => {
    if (isActive && !isUnlocked) {
      const timer = setTimeout(() => {
        player.pause();
        onNeedAd();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isActive, isUnlocked]);

  return (
    <View style={styles.videoContainer}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="cover"
      />
      {!isUnlocked && (
        <View style={styles.lockedOverlay}>
          <ActivityIndicator color={colors.dark.primary} size="large" />
          <Text style={styles.lockedText}>Preview playing...</Text>
        </View>
      )}
    </View>
  );
};

function ProgressBar({
  progress, onSeek, disabled
}: { progress: number, onSeek: (fraction: number) => void, disabled: boolean }) {
  const [barWidth, setBarWidth] = useState(0);
  const [dragFraction, setDragFraction] = useState<number | null>(null);
  const barWidthRef = useRef(0);

  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt) => {
        if (disabled || barWidthRef.current === 0) return;
        const fraction = clamp(evt.nativeEvent.locationX / barWidthRef.current);
        setDragFraction(fraction);
      },
      onPanResponderMove: (evt) => {
        if (disabled || barWidthRef.current === 0) return;
        const fraction = clamp(evt.nativeEvent.locationX / barWidthRef.current);
        setDragFraction(fraction);
      },
      onPanResponderRelease: (evt) => {
        if (disabled || barWidthRef.current === 0) return;
        const fraction = clamp(evt.nativeEvent.locationX / barWidthRef.current);
        onSeek(fraction);
        setDragFraction(null);
      },
      onPanResponderTerminate: () => {
        setDragFraction(null);
      },
    })
  ).current;

  const displayFraction = dragFraction !== null ? dragFraction : progress;

  return (
    <View
      style={styles.progressHitArea}
      onLayout={(e) => {
        barWidthRef.current = e.nativeEvent.layout.width;
        setBarWidth(e.nativeEvent.layout.width);
      }}
      {...panResponder.panHandlers}
    >
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${clamp(displayFraction) * 100}%` }]} />
      </View>
      <View
        style={[
          styles.progressHandle,
          { left: barWidth > 0 ? clamp(displayFraction) * barWidth - 6 : -6 },
          dragFraction !== null && styles.progressHandleActive,
        ]}
      />
    </View>
  );
}

export default function PlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dramaId = params.dramaId as string;
  const initialEpisode = parseInt((params.initialEpisode as string) || "1", 10);

  const { userId } = useAuth();
  const { updateProgress } = useDrama();
  const queryClient = useQueryClient();

  const { data: drama, isLoading, isError } = useGetDramaPlayback(
    { dramaId, userId: userId ?? undefined },
    { query: { enabled: !!dramaId, queryKey: getGetDramaPlaybackQueryKey({ dramaId, userId: userId ?? undefined }) } }
  );

  const [currentIndex, setCurrentIndex] = useState(initialEpisode - 1);
  const [showAdWall, setShowAdWall] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [likes, setLikes] = useState<Record<number, boolean>>({});
  const [playbackTime, setPlaybackTime] = useState({ currentTime: 0, duration: 0 });

  const activePlayerRef = useRef<VideoPlayer | null>(null);
  const timeUpdateSubRef = useRef<{ remove: () => void } | null>(null);

  const onActivePlayerReady = (player: VideoPlayer | null) => {
    if (timeUpdateSubRef.current) {
      timeUpdateSubRef.current.remove();
      timeUpdateSubRef.current = null;
    }
    activePlayerRef.current = player;
    if (player) {
      setPlaybackTime({ currentTime: player.currentTime ?? 0, duration: player.duration ?? 0 });
      timeUpdateSubRef.current = player.addListener('timeUpdate', (payload: { currentTime: number }) => {
        setPlaybackTime({ currentTime: payload.currentTime, duration: player.duration ?? 0 });
      });
    } else {
      setPlaybackTime({ currentTime: 0, duration: 0 });
    }
  };

  const handleSeek = (fraction: number) => {
    const player = activePlayerRef.current;
    if (player && playbackTime.duration > 0) {
      const newTime = fraction * playbackTime.duration;
      player.currentTime = newTime;
      setPlaybackTime((prev) => ({ ...prev, currentTime: newTime }));
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (drama && dramaId && drama.episodes[currentIndex]) {
      updateProgress(dramaId, drama.episodes[currentIndex].episodeNumber, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dramaId, currentIndex, !!drama]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.dark.primary} size="large" />
      </View>
    );
  }

  if (isError || !drama) {
    return <View style={styles.container}><Text style={styles.errorText}>Drama not found</Text></View>;
  }

  const currentEp = drama.episodes[currentIndex];
  const isUnlocked = currentEp.isUnlocked;
  const progressFraction = playbackTime.duration > 0 ? playbackTime.currentTime / playbackTime.duration : 0;

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikes(prev => ({ ...prev, [currentEp.episodeNumber]: !prev[currentEp.episodeNumber] }));
  };

  const handleAdSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getGetDramaPlaybackQueryKey({ dramaId, userId: userId ?? undefined }) });
    setShowAdWall(false);
  };

  const navigateToEpisode = (epNumber: number, isUnl: boolean) => {
    setShowDrawer(false);
    const index = epNumber - 1;
    setCurrentIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: false });
    if (!isUnl) {
      setShowAdWall(true);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={drama.episodes}
        keyExtractor={item => item.episodeNumber.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        initialScrollIndex={currentIndex}
        getItemLayout={(data, index) => ({ length: WINDOW_HEIGHT, offset: WINDOW_HEIGHT * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        windowSize={3}
        maxToRenderPerBatch={3}
        renderItem={({ item, index }) => (
          <View style={{ height: WINDOW_HEIGHT, width: WINDOW_WIDTH }}>
            <SingleVideo
              url={item.videoUrl}
              isActive={index === currentIndex}
              isUnlocked={item.isUnlocked}
              onNeedAd={() => setShowAdWall(true)}
              onActivePlayerReady={onActivePlayerReady}
            />
          </View>
        )}
      />

      {/* Top Bar Overlay */}
      <SafeAreaView style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconButton}>
          <FontAwesome5 name="chevron-left" solid size={20} color={colors.dark.foreground} />
        </Pressable>
        <View style={styles.topRight}>
          <Pressable style={styles.iconButton}>
            <FontAwesome5 name="search" solid size={20} color={colors.dark.foreground} />
          </Pressable>
          <Pressable style={styles.rewardButton} onPress={() => setShowAdWall(true)}>
            <FontAwesome5 name="gift" solid size={16} color={colors.dark.accent} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Right Action Rail Overlay */}
      <View style={styles.actionRail}>
        <Pressable style={styles.actionItem} onPress={handleLike}>
          <View style={[styles.actionIconWrap, likes[currentEp.episodeNumber] && styles.actionIconWrapActive]}>
            <FontAwesome5 name="heart" solid size={24} color={likes[currentEp.episodeNumber] ? colors.dark.primary : colors.dark.foreground} />
          </View>
          <Text style={styles.actionText}>Like</Text>
        </Pressable>
        <Pressable style={styles.actionItem}>
          <View style={styles.actionIconWrap}>
            <FontAwesome5 name="bookmark" solid size={24} color={colors.dark.foreground} />
          </View>
          <Text style={styles.actionText}>Save</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={() => setShowDrawer(true)}>
          <View style={styles.actionIconWrap}>
            <FontAwesome5 name="list-ul" solid size={24} color={colors.dark.foreground} />
          </View>
          <Text style={styles.actionText}>Episodes</Text>
        </Pressable>
        <Pressable style={styles.actionItem}>
          <View style={styles.actionIconWrap}>
            <FontAwesome5 name="share" solid size={24} color={colors.dark.foreground} />
          </View>
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={() => setShowReport(true)}>
          <View style={styles.actionIconWrap}>
            <FontAwesome5 name="flag" solid size={20} color={colors.dark.secondaryForeground} />
          </View>
        </Pressable>
      </View>

      {/* Bottom Info Overlay */}
      <SafeAreaView style={styles.bottomInfo}>
        <View style={styles.badgeRow} pointerEvents="none">
          {isUnlocked ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>Unlocked</Text>
            </View>
          ) : (
            <View style={[styles.freeBadge, { backgroundColor: colors.dark.muted }]}>
              <Text style={styles.freeText}>Preview</Text>
            </View>
          )}
        </View>
        <Text style={styles.titleText} pointerEvents="none">{drama.title}</Text>
        <Text style={styles.epText} pointerEvents="none">Episode {currentEp.episodeNumber} / {drama.episodes.length}</Text>

        <ProgressBar progress={progressFraction} onSeek={handleSeek} disabled={!isUnlocked} />
      </SafeAreaView>

      <AdWallModal
        visible={showAdWall}
        onClose={() => {
          setShowAdWall(false);
          if (!isUnlocked) router.back();
        }}
        onSuccess={handleAdSuccess}
        userId={userId ?? ""}
        dramaId={dramaId}
        episode={currentEp.episodeNumber}
        episodesPerAdUnlock={drama.monetizationRules.episodesPerAdUnlock}
      />

      <EpisodeDrawer
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        episodes={drama.episodes}
        currentEpisode={currentEp.episodeNumber}
        onSelectEpisode={navigateToEpisode}
      />

      <ReportSheet
        visible={showReport}
        onClose={() => setShowReport(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedText: {
    color: colors.dark.foreground,
    marginTop: 12,
    fontWeight: '600',
  },
  errorText: {
    color: colors.dark.destructive,
    textAlign: 'center',
    marginTop: 100,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  topRight: {
    flexDirection: 'row',
    gap: 12,
  },
  rewardButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.dark.accent,
  },
  actionRail: {
    position: 'absolute',
    right: 12,
    bottom: 130,
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
  },
  actionItem: {
    alignItems: 'center',
    gap: 6,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  actionIconWrapActive: {
    backgroundColor: 'rgba(244,63,94,0.18)',
  },
  actionText: {
    color: colors.dark.foreground,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 48,
    zIndex: 5,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  freeBadge: {
    backgroundColor: colors.dark.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  freeText: {
    color: colors.dark.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleText: {
    color: colors.dark.foreground,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  epText: {
    color: colors.dark.secondaryForeground,
    fontSize: 14,
    marginBottom: 16,
  },
  progressHitArea: {
    height: 24,
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.dark.primary,
  },
  progressHandle: {
    position: 'absolute',
    top: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.dark.primary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  progressHandleActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 4,
  },
});
