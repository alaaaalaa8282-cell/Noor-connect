import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getAdhanUrlForPrayer, type PrayerName } from '@/lib/adhan-preferences';
import { nativeAdhan } from '@/lib/native-adhan';
import {
  PRAYER_ALARM_CONTROL_EVENT,
  PRAYER_ALARM_STATE_EVENT,
  PRAYER_ALARM_TOGGLE_EVENT,
  type PrayerAlarmControlDetail,
  type PrayerAlarmStateDetail,
  type PrayerAlarmToggleDetail,
} from '@/lib/prayer-alarm-events';
import { adhanService } from '@/lib/adhan-service';

const STORAGE_KEY = 'prayer-alarm-enabled';

const dispatchToggleEvent = (enabled: boolean): void => {
  const detail: PrayerAlarmToggleDetail = { enabled };
  window.dispatchEvent(new CustomEvent<PrayerAlarmToggleDetail>(PRAYER_ALARM_TOGGLE_EVENT, { detail }));
};

const dispatchControlEvent = (detail: PrayerAlarmControlDetail): void => {
  window.dispatchEvent(new CustomEvent<PrayerAlarmControlDetail>(PRAYER_ALARM_CONTROL_EVENT, { detail }));
};

export const usePrayerAlarm = () => {
  const [isEnabled, setIsEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setIsEnabled(event.newValue === 'true');
      }
    };

    const handleToggle = (event: Event) => {
      const detail = (event as CustomEvent<PrayerAlarmToggleDetail>).detail;
      if (typeof detail?.enabled === 'boolean') {
        setIsEnabled(detail.enabled);
      }
    };

    const handlePlaybackState = (event: Event) => {
      const detail = (event as CustomEvent<PrayerAlarmStateDetail>).detail;
      if (!detail) return;

      setIsPlaying(detail.isPlaying);
      setCurrentPrayer(detail.prayerName);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(PRAYER_ALARM_TOGGLE_EVENT, handleToggle as EventListener);
    window.addEventListener(PRAYER_ALARM_STATE_EVENT, handlePlaybackState as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(PRAYER_ALARM_TOGGLE_EVENT, handleToggle as EventListener);
      window.removeEventListener(PRAYER_ALARM_STATE_EVENT, handlePlaybackState as EventListener);
    };
  }, []);

  const enableAlarm = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Try to unlock audio playback from a user gesture context.
    const url = await getAdhanUrlForPrayer('Dhuhr');
    const tempAudio = new Audio(url);
    tempAudio.volume = 0;
    try {
      await tempAudio.play();
      tempAudio.pause();
    } catch {
      // Browser may still block autoplay until another interaction.
    }

    localStorage.setItem(STORAGE_KEY, 'true');
    // Keep adhan-config in sync with this primary toggle
    const config = adhanService.getAdhanConfig();
    adhanService.saveAdhanConfig({ ...config, enabled: true });
    setIsEnabled(true);
    dispatchToggleEvent(true);
    await nativeAdhan.setEnabled(true);

    // Re-sync native alarms immediately when the user enables adhan.
    import('@/lib/local-notifications')
      .then(({ localNotifications }) => localNotifications.schedulePrayerNotificationsFromAPI())
      .catch((error) => {
        console.warn('Failed to refresh native adhan alarms after enabling:', error);
      });

    toast.success('Prayer Alarm Enabled', {
      description: 'Adhan will play automatically at prayer time.',
    });
  }, []);

  const stopAdhan = useCallback(() => {
    dispatchControlEvent({ action: 'stop' });
    setIsPlaying(false);
    setCurrentPrayer(null);
  }, []);

  const disableAlarm = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'false');
    const config = adhanService.getAdhanConfig();
    adhanService.saveAdhanConfig({ ...config, enabled: false });
    setIsEnabled(false);
    dispatchToggleEvent(false);
    void nativeAdhan.setEnabled(false);
    stopAdhan();

    toast.success('Prayer Alarm Disabled');
  }, [stopAdhan]);

  const testAdhan = useCallback(() => {
    // Cycle through different prayers for testing
    const prayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const currentHour = new Date().getHours();
    
    // Select a prayer based on current time to make testing more realistic
    let selectedPrayer: PrayerName;
    if (currentHour >= 5 && currentHour < 9) selectedPrayer = 'Fajr';
    else if (currentHour >= 9 && currentHour < 13) selectedPrayer = 'Dhuhr';
    else if (currentHour >= 13 && currentHour < 17) selectedPrayer = 'Asr';
    else if (currentHour >= 17 && currentHour < 20) selectedPrayer = 'Maghrib';
    else selectedPrayer = 'Isha';
    
    dispatchControlEvent({ action: 'test', prayerName: selectedPrayer });

    window.setTimeout(() => {
      dispatchControlEvent({ action: 'stop' });
    }, 8000); // Slightly longer for different adhan lengths
  }, []);

  return {
    isEnabled,
    isPlaying,
    currentPrayer,
    enableAlarm,
    disableAlarm,
    stopAdhan,
    testAdhan,
  };
};
