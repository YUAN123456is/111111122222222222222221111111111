import { useEffect, useRef, useState, useCallback } from "react";
import { Platform } from "react-native";
import mobileAds, { RewardedAd, RewardedAdEventType, TestIds } from "react-native-google-mobile-ads";

// Use test IDs for now; replace with real IDs for production
const AD_UNIT_ID = Platform.select({
  ios: TestIds.REWARDED,       // Replace with real iOS ad unit ID for production
  android: "ca-app-pub-3940256099942544/5224354917", // Google test rewarded ad unit ID
  default: TestIds.REWARDED,
})!;

let adsInitialized = false;

export function useRewardedAd() {
  const rewardedRef = useRef<RewardedAd | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showing, setShowing] = useState(false);

  // Initialize AdMob SDK once
  useEffect(() => {
    if (!adsInitialized) {
      mobileAds().then(() => {
        adsInitialized = true;
      });
    }
  }, []);

  // Create and load rewarded ad
  const loadAd = useCallback(() => {
    const rewarded = RewardedAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    const loadListener = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => setLoaded(true),
    );

    const earnedListener = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        setShowing(false);
      },
    );

    rewarded.load();
    rewardedRef.current = rewarded;

    return () => {
      loadListener();
      earnedListener();
    };
  }, []);

  useEffect(() => {
    const cleanup = loadAd();
    return cleanup;
  }, [loadAd]);

  // Show the ad, returns a promise that resolves when reward is earned
  const showAd = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const ad = rewardedRef.current;
      if (!ad || !loaded) {
        resolve(false);
        return;
      }

      let rewardEarned = false;

      const closeListener = ad.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          rewardEarned = true;
        },
      );

      const closedListener = ad.addAdEventListener("closed", () => {
        closeListener();
        closedListener();
        setShowing(false);
        setLoaded(false);
        // Reload for next use
        const cleanup = loadAd();
        resolve(rewardEarned);
      });

      setShowing(true);
      ad.show().catch(() => {
        closeListener();
        closedListener();
        setShowing(false);
        setLoaded(false);
        resolve(false);
        // Reload
        loadAd();
      });
    });
  }, [loaded, loadAd]);

  return { loaded, showing, showAd };
}