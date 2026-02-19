import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { prayerTimesApiResponseSchema, safeParseApiResponse } from '@/lib/api-schemas';
import { getAdhanUrlForPrayer, type PrayerName } from '@/lib/adhan-preferences';
import { localNotifications } from '@/lib/local-notifications';

const ADHAN_AUDIO_URL = 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/azan.mp3';
const STORAGE_KEY = 'prayer-alarm-enabled';
const LAST_PLAYED_KEY = 'prayer-alarm-last-played';
const PRAYER_TIMES_KEY = 'cached-prayer-times';
const REMINDER_MINUTES_KEY = 'prayer-reminder-minutes';
const LAST_REMINDER_KEY = 'prayer-reminder-last-played';

// Set prayer alarm enabled by default
if (!localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, 'true');
}

interface PrayerTime {
  name: string;
  time: string;
}

export const GlobalPrayerAlarm = () => {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchAndCachePrayerTimes = useCallback(async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`
      );

      if (!response.ok) return;

      const rawData = await response.json();
      const parseResult = safeParseApiResponse(prayerTimesApiResponseSchema, rawData);

      if (!parseResult.success) {
        console.error('Invalid prayer times API response');
        return;
      }

      const timings = parseResult.data.data.timings;

      const prayerTimes: PrayerTime[] = [
        { name: 'Fajr', time: timings.Fajr },
        { name: 'Dhuhr', time: timings.Dhuhr },
        { name: 'Asr', time: timings.Asr },
        { name: 'Maghrib', time: timings.Maghrib },
        { name: 'Isha', time: timings.Isha },
      ];

      localStorage.setItem(PRAYER_TIMES_KEY, JSON.stringify({
        times: prayerTimes,
        date: new Date().toDateString()
      }));
    } catch (error) {
      console.error('Error fetching prayer times:', error);
    }
  }, []);

  const playAdhan = useCallback(async (prayerName: string) => {
    // 1. Cleanup existing audio if any
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    // 2. Guard against overlapping plays
    if (checkIntervalRef.current === null && !localStorage.getItem(STORAGE_KEY)) return;

    // 3. Setup Adhan Audio - use per-prayer preference
    const validPrayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const adhanUrl = validPrayers.includes(prayerName as PrayerName)
      ? getAdhanUrlForPrayer(prayerName as PrayerName)
      : getAdhanUrlForPrayer('Dhuhr');
    const audio = new Audio(adhanUrl);
    audioRef.current = audio; // Keep reference to prevent GC
    audio.volume = 0.8;
    audio.preload = 'auto';
    
    // Set audio to play for full duration (don't auto-stop)
    audio.loop = false; // Don't loop, but play full duration

    // 3. Media Session API - Crucial for background priority
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${prayerName} Adhan`,
        artist: 'Noor Connect',
        album: 'Prayer Call',
        artwork: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ]
      });

      // Cleanup handlers to stop Adhan if user uses lock screen controls
      navigator.mediaSession.setActionHandler('stop', () => {
        audio.pause();
        audio.src = '';
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
      });
    }

    toast.success(`${prayerName} Time!`, {
      description: 'It is time for prayer. Adhan is playing.',
      duration: 30000,
    });

    localNotifications.showNativeNotification(
      `🕌 ${prayerName} Prayer Time`,
      'It is time for prayer. Click to open companion.',
      { url: '/dashboard', tag: 'prayer-alarm' }
    );

    // 4. Play with Promise protection (Task 4)
    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        console.log('Adhan playback started successfully');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to play Adhan:', error);
        toast.error('Audio Blocked', {
          description: 'Please tap anywhere to enable Adhan audio.',
        });
      }
    }
  }, []);

  const playReminder = useCallback((prayerName: string, minutesBefore: number) => {
    toast.info(`${prayerName} in ${minutesBefore} minutes`, {
      description: 'Prepare for prayer',
      duration: 10000,
    });

    localNotifications.showNativeNotification(
      `${prayerName} Prayer Coming Up`,
      `${prayerName} prayer will begin in ${minutesBefore} minutes`,
      { url: '/dashboard', tag: 'prayer-reminder' }
    );
  }, []);

  const checkPrayerTime = useCallback(() => {
    const isEnabled = localStorage.getItem(STORAGE_KEY) === 'true';
    if (!isEnabled) return;

    const cached = localStorage.getItem(PRAYER_TIMES_KEY);
    if (!cached) return;

    const { times, date } = JSON.parse(cached);
    const today = new Date().toDateString();

    // Refresh if date changed
    if (date !== today) {
      fetchAndCachePrayerTimes();
      return;
    }

    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
    const lastReminder = localStorage.getItem(LAST_REMINDER_KEY);
    const reminderMinutes = parseInt(localStorage.getItem(REMINDER_MINUTES_KEY) || '0', 10);

    for (const prayer of times as PrayerTime[]) {
      const prayerKey = `${today}-${prayer.name}`;
      const reminderKey = `${today}-${prayer.name}-reminder`;

      // Check for exact prayer time (play Adhan)
      if (prayer.time === currentTimeStr && lastPlayed !== prayerKey) {
        localStorage.setItem(LAST_PLAYED_KEY, prayerKey);
        playAdhan(prayer.name);
        break;
      }

      // Check for pre-prayer reminder
      if (reminderMinutes > 0 && lastReminder !== reminderKey) {
        const cleaned = prayer.time.replace(/\s*\(.*?\)\s*/g, '').trim();
        const [prayerHour, prayerMinute] = cleaned.split(':').map(Number);
        const prayerDate = new Date();
        prayerDate.setHours(prayerHour, prayerMinute, 0, 0);

        const reminderTime = new Date(prayerDate.getTime() - reminderMinutes * 60 * 1000);
        const reminderTimeStr = `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`;

        if (currentTimeStr === reminderTimeStr) {
          localStorage.setItem(LAST_REMINDER_KEY, reminderKey);
          playReminder(prayer.name, reminderMinutes);
          break;
        }
      }
    }
  }, [fetchAndCachePrayerTimes, playAdhan, playReminder]);

  useEffect(() => {
    // Check if enabled and fetch times
    const isEnabled = localStorage.getItem(STORAGE_KEY) === 'true';
    if (isEnabled) {
      fetchAndCachePrayerTimes();

      // Check every 30 seconds
      checkIntervalRef.current = setInterval(checkPrayerTime, 30000);
      checkPrayerTime();
    }

    // Listen for storage changes (when user enables/disables)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue === 'true') {
          fetchAndCachePrayerTimes();
          if (!checkIntervalRef.current) {
            checkIntervalRef.current = setInterval(checkPrayerTime, 30000);
          }
        } else {
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchAndCachePrayerTimes, checkPrayerTime]);

  return null; // This is a background component
};
