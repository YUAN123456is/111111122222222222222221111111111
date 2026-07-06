import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  Dimensions, ActivityIndicator, SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView, VideoPlayer } from 'expo-video';
import { FontAwesome5 } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useGetDramaPlayback, getGetDramaPlaybackQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDrama } from '@/context/DramaContext';
import { useLocale } from '@/context/LocaleContext';
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
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);

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

  // Reset manual pause state whenever this slide becomes/stops being active.
  useEffect(() => {
    setManuallyPaused(false);
  }, [isActive]);

  useEffect(() => {
    if (isActive && isUnlocked && !manuallyPaused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, isUnlocked, manuallyPaused, player]);

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

  const handleToggleTap = () => {
    if (!isActive || !isUnlocked) return;
    setManuallyPaused(prev => !prev);
    setShowPauseIcon(true);
    setTimeout(() => setShowPauseIcon(false), 500);
  };

  return (
    <Pressable style={styles.videoContainer} onPress={handleToggleTap}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="cover"
      />
      {isUnlocked && showPauseIcon && (
        <View style={styles.centerIconOverlay} pointerEvents="none">
          <View style={styles.centerIconCircle}>
            <FontAwesome5 name={manuallyPaused ? 'play' : 'pause'} solid size={28} color={colors.dark.foreground} />
          </View>
        </View>
      )}
      {!isUnlocked && (
        <View style={styles.lockedOverlay}>
          <ActivityIndicator color={colors.dark.primary} size="large" />
          <Text style={styles.lockedText}>Preview playing...</Text>
        </View>
      )}
    </Pressable>
  );
};

function ProgressBar({
  progress, onSeek, disabled
}: { progress: number, onSeek: (fraction: number) => void, disabled: boolean }) {
  const [sliding, setSliding] = useState(false);
  const [localValue, setLocalValue] = useState(progress);

  useEffect(() => {
    if (!sliding) {
      setLocalValue(progress);
    }
  }, [progress, sliding]);

  return (
    <View style={styles.sliderWrap}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={1}
        value={localValue}
        disabled={disabled}
        minimumTrackTintColor={colors.dark.primary}
        maximumTrackTintColor="rgba(255,255,255,0.3)"
        thumbTintColor={colors.dark.primary}
        onSlidingStart={() => setSliding(true)}
        onValueChange={(v: number) => setLocalValue(v)}
        onSlidingComplete={(v: number) => {
          onSeek(v);
          setSliding(false);
        }}
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
  const { updateProgress, isFavorite, toggleFavorite } = useDrama();
  const { locale } = useLocale();
  const queryClient = useQueryClient();

  const { data: drama, isLoading, isError } = useGetDramaPlayback(
    { dramaId, userId: userId ?? undefined, locale },
    { query: { enabled: !!dramaId, queryKey: getGetDramaPlaybackQueryKey({ dramaId, userId: userId ?? undefined, locale }) } }
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
    const duration = player?.duration ?? playbackTime.duration;
    if (player && duration > 0) {
      const newTime = fraction * duration;
      player.currentTime = newTime;
      setPlaybackTime({ currentTime: newTime, duration });
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

  if (drama.episodes.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backOnlyButton}>
          <FontAwesome5 name="chevron-left" solid size={20} color={colors.dark.foreground} />
        </Pressable>
        <Text style={styles.errorText}>No episodes available yet</Text>
      </View>
    );
  }

  const safeIndex = Math.min(Math.max(currentIndex, 0), drama.episodes.length - 1);
  const currentEp = drama.episodes[safeIndex];
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
        initialScrollIndex={safeIndex}
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
          <Pressable style={styles.iconButton} onPress={() => router.push("/search")}>
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
        <Pressable style={styles.actionItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleFavorite(dramaId); }}>
          <View style={[styles.actionIconWrap, isFavorite(dramaId) && styles.actionIconWrapActive]}>
            <FontAwesome5 name="bookmark" solid size={24} color={isFavorite(dramaId) ? colors.dark.accent : colors.dark.foreground} />
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
  backOnlyButton: {
    position: 'absolute',
    top: 56,
    left: 16,
    padding: 8,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  centerIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 12,
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
    marginBottom: 8,
  },
  sliderWrap: {
    marginHorizontal: -8,
  },
  slider: {
    width: '100%',
    height: 24,
  },
});
