import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  Dimensions, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
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

function getVirtualCount(seed: string, factor: number): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const base = ((Math.abs(h) % 46) + 5) * 10000;
  const count = Math.floor(base * factor);
  return count >= 10000 ? `${(count / 10000).toFixed(1)}万` : `${count}`;
}

const SingleVideo = ({
  url, isActive, isUnlocked, onNeedAd, onActivePlayerReady, previewText, onPlayToEnd
}: {
  url: string, isActive: boolean, isUnlocked: boolean, onNeedAd: () => void,
  onActivePlayerReady: (player: VideoPlayer | null) => void, previewText: string,
  onPlayToEnd?: () => void
}) => {
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);

  const player = useVideoPlayer(url, player => {
    player.loop = false;
    player.preservesPitch = true;
    player.timeUpdateEventInterval = 0.5;
    if (isActive && isUnlocked) {
      player.play();
    }
  });

  useEffect(() => {
    if (!onPlayToEnd) return;
    const sub = player.addListener('playToEnd', () => {
      if (isActive && isUnlocked) onPlayToEnd();
    });
    return () => sub.remove();
  }, [player, isActive, isUnlocked, onPlayToEnd]);

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
    setShowPauseIcon(false);
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
    setManuallyPaused(prev => {
      const nowPaused = !prev;
      setShowPauseIcon(true);
      if (!nowPaused) {
        // resuming — flash play icon then hide
        setTimeout(() => setShowPauseIcon(false), 600);
      }
      // pausing — keep icon visible until next tap
      return nowPaused;
    });
  };

  return (
    <Pressable style={styles.videoContainer} onPress={handleToggleTap}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="cover"
        surfaceType="textureView"
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
          <Text style={styles.lockedText}>{previewText}</Text>
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
  const { locale, t } = useLocale();
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

  // Load persisted likes for this drama
  useEffect(() => {
    AsyncStorage.getItem(`likes_${dramaId}`).then(data => {
      if (data) setLikes(JSON.parse(data));
      else setLikes({});
    });
  }, [dramaId]);

  const [playbackTime, setPlaybackTime] = useState({ currentTime: 0, duration: 0 });
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const activePlayerRef = useRef<VideoPlayer | null>(null);
  const timeUpdateSubRef = useRef<{ remove: () => void } | null>(null);

  const onActivePlayerReady = (player: VideoPlayer | null) => {
    if (timeUpdateSubRef.current) {
      timeUpdateSubRef.current.remove();
      timeUpdateSubRef.current = null;
    }
    activePlayerRef.current = player;
    if (player) {
      player.playbackRate = playbackSpeed;
      setPlaybackTime({ currentTime: player.currentTime ?? 0, duration: player.duration ?? 0 });
      timeUpdateSubRef.current = player.addListener('timeUpdate', (payload: { currentTime: number }) => {
        setPlaybackTime({ currentTime: payload.currentTime, duration: player.duration ?? 0 });
      });
    } else {
      setPlaybackTime({ currentTime: 0, duration: 0 });
    }
  };

  const handleSpeedSelect = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activePlayerRef.current) {
      activePlayerRef.current.playbackRate = speed;
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
  const [listHeight, setListHeight] = useState(WINDOW_HEIGHT);
  const initialScrollDone = useRef(false);

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
    return <View style={styles.container}><Text style={styles.errorText}>{t("player.notFound")}</Text></View>;
  }

  if (drama.episodes.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backOnlyButton}>
          <FontAwesome5 name="chevron-left" solid size={20} color={colors.dark.foreground} />
        </Pressable>
        <Text style={styles.errorText}>{t("player.noEpisodes")}</Text>
      </View>
    );
  }

  const safeIndex = Math.min(Math.max(currentIndex, 0), drama.episodes.length - 1);
  const currentEp = drama.episodes[safeIndex];
  const isUnlocked = currentEp.isUnlocked;
  const progressFraction = playbackTime.duration > 0 ? playbackTime.currentTime / playbackTime.duration : 0;

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikes(prev => {
      const next = { ...prev, [currentEp.episodeNumber]: !prev[currentEp.episodeNumber] };
      AsyncStorage.setItem(`likes_${dramaId}`, JSON.stringify(next));
      return next;
    });
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

  const handlePlayToEnd = () => {
    if (!drama) return;
    const nextIndex = safeIndex + 1;
    if (nextIndex >= drama.episodes.length) return;
    const nextEp = drama.episodes[nextIndex];
    setCurrentIndex(nextIndex);
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    if (!nextEp.isUnlocked) {
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
        getItemLayout={(data, index) => ({ length: listHeight, offset: listHeight * index, index })}
        onLayout={e => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && h !== listHeight) {
            setListHeight(h);
            if (!initialScrollDone.current && safeIndex > 0) {
              initialScrollDone.current = true;
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: safeIndex, animated: false });
              }, 50);
            }
          } else if (!initialScrollDone.current && safeIndex > 0) {
            initialScrollDone.current = true;
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index: safeIndex, animated: false });
            }, 50);
          }
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        windowSize={3}
        maxToRenderPerBatch={3}
        renderItem={({ item, index }) => (
          <View style={{ height: listHeight, width: WINDOW_WIDTH }}>
            <SingleVideo
              url={item.videoUrl}
              isActive={index === currentIndex}
              isUnlocked={item.isUnlocked}
              onNeedAd={() => setShowAdWall(true)}
              onActivePlayerReady={onActivePlayerReady}
              previewText={t("player.previewPlaying")}
              onPlayToEnd={index === currentIndex ? handlePlayToEnd : undefined}
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
          <Text style={styles.actionText}>{t("player.like")}</Text>
          <Text style={styles.actionCount}>{getVirtualCount(dramaId, 1)}</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleFavorite(dramaId); }}>
          <View style={[styles.actionIconWrap, isFavorite(dramaId) && styles.actionIconWrapActive]}>
            <FontAwesome5 name="bookmark" solid size={24} color={isFavorite(dramaId) ? colors.dark.accent : colors.dark.foreground} />
          </View>
          <Text style={styles.actionText}>{t("player.save")}</Text>
          <Text style={styles.actionCount}>{getVirtualCount(dramaId, 0.4)}</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={() => setShowDrawer(true)}>
          <View style={styles.actionIconWrap}>
            <FontAwesome5 name="list-ul" solid size={24} color={colors.dark.foreground} />
          </View>
          <Text style={styles.actionText}>{t("player.episodes")}</Text>
        </Pressable>
        <Pressable style={styles.actionItem}>
          <View style={styles.actionIconWrap}>
            <FontAwesome5 name="share" solid size={24} color={colors.dark.foreground} />
          </View>
          <Text style={styles.actionText}>{t("player.share")}</Text>
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
              <Text style={styles.freeText}>{t("player.unlocked")}</Text>
            </View>
          ) : (
            <View style={[styles.freeBadge, { backgroundColor: colors.dark.muted }]}>
              <Text style={styles.freeText}>{t("player.preview")}</Text>
            </View>
          )}
        </View>
        <Text style={styles.titleText} pointerEvents="none">{drama.title}</Text>
        <View style={styles.epRow}>
          <Text style={styles.epText} pointerEvents="none">{t("player.episode", { n: currentEp.episodeNumber, total: drama.episodes.length })}</Text>
          <Pressable style={styles.speedButton} onPress={() => setShowSpeedPicker(p => !p)}>
            <Text style={styles.speedButtonText}>{playbackSpeed === 1 ? t("player.speed") : `${playbackSpeed}x`}</Text>
          </Pressable>
        </View>

        {showSpeedPicker && (
          <View style={styles.speedPicker}>
            {SPEED_OPTIONS.map(s => (
              <Pressable
                key={s}
                style={[styles.speedOption, playbackSpeed === s && styles.speedOptionActive]}
                onPress={() => handleSpeedSelect(s)}
              >
                <Text style={[styles.speedOptionText, playbackSpeed === s && styles.speedOptionTextActive]}>
                  {s === 1 ? '1x' : `${s}x`}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

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
  actionCount: {
    color: colors.dark.secondaryForeground,
    fontSize: 11,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  epRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  speedButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  speedButtonText: {
    color: colors.dark.foreground,
    fontSize: 12,
    fontWeight: '700',
  },
  speedPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
    gap: 4,
  },
  speedOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  speedOptionActive: {
    backgroundColor: colors.dark.primary,
  },
  speedOptionText: {
    color: colors.dark.secondaryForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  speedOptionTextActive: {
    color: colors.dark.foreground,
    fontWeight: '700',
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
