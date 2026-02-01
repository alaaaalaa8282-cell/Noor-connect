import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { stopAllAdhanPreviews } from '@/components/AdhanSelector';
import { getAdhanUrlForPrayer, type PrayerName } from '@/lib/adhan-preferences';

interface PrayerTime {
  name: string;
  time: string;
}

const STORAGE_KEY = 'prayer-alarm-enabled';
const LAST_PLAYED_KEY = 'prayer-alarm-last-played';

// Global audio instance for prayer alarm to prevent multiple instances
let prayerAlarmAudio: HTMLAudioElement | null = null;

export const usePrayerAlarm = () => {
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prayerTimesRef = useRef<PrayerTime[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prayerAlarmAudio) {
        prayerAlarmAudio.pause();
        prayerAlarmAudio = null;
      }
    };
  }, []);

  // Fetch prayer times
  const fetchPrayerTimes = useCallback(async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        });
      });

      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`
      );

      if (!response.ok) throw new Error('Failed to fetch prayer times');

      const data = await response.json();
      const timings = data.data.timings;

      prayerTimesRef.current = [
        { name: 'Fajr', time: timings.Fajr },
        { name: 'Dhuhr', time: timings.Dhuhr },
        { name: 'Asr', time: timings.Asr },
        { name: 'Maghrib', time: timings.Maghrib },
        { name: 'Isha', time: timings.Isha },
      ];
    } catch (error) {
      console.error('Error fetching prayer times for alarm:', error);
    }
  }, []);

  // Check if it's prayer time
  const checkPrayerTime = useCallback(() => {
    if (!isEnabled || prayerTimesRef.current.length === 0) return;

    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const todayDate = now.toDateString();
    const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);

    for (const prayer of prayerTimesRef.current) {
      const prayerKey = `${todayDate}-${prayer.name}`;

      if (prayer.time === currentTimeStr && lastPlayed !== prayerKey) {
        // It's prayer time!
        localStorage.setItem(LAST_PLAYED_KEY, prayerKey);
        playAdhan(prayer.name);
        break;
      }
    }
  }, [isEnabled]);

  // Play Adhan - use special Fajr Adhan for Fajr, otherwise use selected Adhan
  const playAdhan = useCallback((prayerName: string) => {
    if (isPlaying) return;

    // Stop any preview audio first
    stopAllAdhanPreviews();

    // Stop existing alarm audio
    if (prayerAlarmAudio) {
      prayerAlarmAudio.pause();
      prayerAlarmAudio = null;
    }

    // Get the adhan URL for this specific prayer (or default for non-standard prayers)
    const validPrayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const adhanUrl = validPrayers.includes(prayerName as PrayerName)
      ? getAdhanUrlForPrayer(prayerName as PrayerName)
      : getAdhanUrlForPrayer('Dhuhr'); // Default for test/unknown prayers
    prayerAlarmAudio = new Audio(adhanUrl);

    prayerAlarmAudio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentPrayer(null);
      prayerAlarmAudio = null;
    });

    prayerAlarmAudio.addEventListener('error', () => {
      setIsPlaying(false);
      setCurrentPrayer(null);
      prayerAlarmAudio = null;
    });

    setCurrentPrayer(prayerName);
    setIsPlaying(true);

    // Show notification
    toast.success(`${prayerName} Time!`, {
      description: 'It is time for prayer. Adhan is playing.',
      duration: 10000,
    });

    // Request notification permission and show system notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${prayerName} Prayer Time`, {
        body: 'It is time for prayer',
        icon: '/favicon.png',
        tag: 'prayer-alarm',
        requireInteraction: true,
      });
    }

    prayerAlarmAudio.currentTime = 0;
    prayerAlarmAudio.play().catch((error) => {
      console.error('Failed to play Adhan:', error);
      setIsPlaying(false);
      prayerAlarmAudio = null;
      toast.error('Could not play Adhan. Please interact with the page first.');
    });
  }, [isPlaying]);

  // Stop Adhan
  const stopAdhan = useCallback(() => {
    if (prayerAlarmAudio) {
      prayerAlarmAudio.pause();
      prayerAlarmAudio.currentTime = 0;
      prayerAlarmAudio = null;
    }
    setIsPlaying(false);
    setCurrentPrayer(null);
  }, []);

  // Enable alarm (requires user interaction to unlock audio)
  const enableAlarm = useCallback(async () => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Create a temporary audio to unlock audio playback
    const tempAudio = new Audio(getAdhanUrlForPrayer('Dhuhr'));
    tempAudio.volume = 0;
    try {
      await tempAudio.play();
      tempAudio.pause();
    } catch (e) {
      // Audio unlock failed, will try again on interaction
    }

    setIsEnabled(true);
    localStorage.setItem(STORAGE_KEY, 'true');

    // Fetch prayer times immediately
    await fetchPrayerTimes();

    toast.success('Prayer Alarm Enabled', {
      description: 'You will hear the Adhan when prayer time arrives.',
    });
  }, [fetchPrayerTimes]);

  // Disable alarm
  const disableAlarm = useCallback(() => {
    setIsEnabled(false);
    localStorage.setItem(STORAGE_KEY, 'false');
    stopAdhan();
    toast.success('Prayer Alarm Disabled');
  }, [stopAdhan]);

  // Test Adhan
  const testAdhan = useCallback(() => {
    playAdhan('Test');
    setTimeout(() => {
      stopAdhan();
    }, 5000); // Play for 5 seconds only
  }, [playAdhan, stopAdhan]);

  // Start checking prayer times when enabled
  useEffect(() => {
    if (isEnabled) {
      fetchPrayerTimes();

      // Check every 30 seconds
      checkIntervalRef.current = setInterval(() => {
        checkPrayerTime();
      }, 30000);

      // Also check immediately
      checkPrayerTime();

      // Refresh prayer times every hour
      const refreshInterval = setInterval(fetchPrayerTimes, 3600000);

      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
        clearInterval(refreshInterval);
      };
    }
  }, [isEnabled, fetchPrayerTimes, checkPrayerTime]);

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
