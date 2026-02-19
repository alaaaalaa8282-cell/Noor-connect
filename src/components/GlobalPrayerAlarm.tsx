import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { prayerTimesApiResponseSchema, safeParseApiResponse } from '@/lib/api-schemas';
import { getAdhanUrlForPrayer, type PrayerName } from '@/lib/adhan-preferences';
import { localNotifications } from '@/lib/local-notifications';
import {
  PRAYER_ALARM_CONTROL_EVENT,
  PRAYER_ALARM_STATE_EVENT,
  PRAYER_ALARM_TOGGLE_EVENT,
  type PrayerAlarmControlDetail,
  type PrayerAlarmStateDetail,
  type PrayerAlarmToggleDetail,
} from '@/lib/prayer-alarm-events';

const STORAGE_KEY = 'prayer-alarm-enabled';
const LAST_PLAYED_KEY = 'prayer-alarm-last-played';
const PRAYER_TIMES_KEY = 'cached-prayer-times';
const REMINDER_MINUTES_KEY = 'prayer-reminder-minutes';
const LAST_REMINDER_KEY = 'prayer-reminder-last-played';

if (!localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, 'true');
}

interface PrayerTime {
  name: string;
  time: string;
}

interface CachedPrayerTimes {
  times: PrayerTime[];
  date: string;
}

const normalizeTimeString = (time: string): string =>
  time.replace(/\s*\(.*?\)\s*/g, '').trim();

const isValidPrayerName = (name: string): name is PrayerName =>
  ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(name);

export const GlobalPrayerAlarm = () => {
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const emitPlaybackState = useCallback((isPlaying: boolean, prayerName: string | null) => {
    const detail: PrayerAlarmStateDetail = { isPlaying, prayerName };
    window.dispatchEvent(new CustomEvent<PrayerAlarmStateDetail>(PRAYER_ALARM_STATE_EVENT, { detail }));
  }, []);

  const stopCurrentAdhan = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    emitPlaybackState(false, null);
  }, [emitPlaybackState]);

  const readCachedPrayerTimes = useCallback((): CachedPrayerTimes | null => {
    try {
      const cached = localStorage.getItem(PRAYER_TIMES_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached) as Partial<CachedPrayerTimes>;
      if (!parsed || !Array.isArray(parsed.times) || typeof parsed.date !== 'string') {
        return null;
      }

      const times = parsed.times
        .filter(
          (item): item is PrayerTime =>
            Boolean(item) &&
            typeof item.name === 'string' &&
            typeof item.time === 'string'
        )
        .map((item) => ({ name: item.name, time: normalizeTimeString(item.time) }));

      return { times, date: parsed.date };
    } catch (error) {
      console.error('Failed to parse cached prayer times:', error);
      return null;
    }
  }, []);

  const fetchAndCachePrayerTimes = useCallback(async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
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
        { name: 'Fajr', time: normalizeTimeString(timings.Fajr) },
        { name: 'Dhuhr', time: normalizeTimeString(timings.Dhuhr) },
        { name: 'Asr', time: normalizeTimeString(timings.Asr) },
        { name: 'Maghrib', time: normalizeTimeString(timings.Maghrib) },
        { name: 'Isha', time: normalizeTimeString(timings.Isha) },
      ];

      localStorage.setItem(
        PRAYER_TIMES_KEY,
        JSON.stringify({
          times: prayerTimes,
          date: new Date().toDateString(),
        } satisfies CachedPrayerTimes)
      );
    } catch (error) {
      console.error('Error fetching prayer times:', error);
    }
  }, []);

  const playAdhan = useCallback(
    async (prayerName: string, options?: { force?: boolean }) => {
      const isEnabled = localStorage.getItem(STORAGE_KEY) === 'true';
      if (!options?.force && !isEnabled) return;

      stopCurrentAdhan();

      const adhanUrl = isValidPrayerName(prayerName)
        ? getAdhanUrlForPrayer(prayerName)
        : getAdhanUrlForPrayer('Dhuhr');

      const audio = new Audio(adhanUrl);
      audioRef.current = audio;
      audio.volume = 0.8;
      audio.preload = 'auto';
      audio.loop = false;

      audio.onended = () => {
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        emitPlaybackState(false, null);
      };

      audio.onerror = () => {
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        emitPlaybackState(false, null);
      };

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${prayerName} Adhan`,
          artist: 'Noor Connect',
          album: 'Prayer Call',
          artwork: [
            { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        });

        try {
          navigator.mediaSession.setActionHandler('stop', stopCurrentAdhan);
          navigator.mediaSession.setActionHandler('pause', () => {
            audio.pause();
          });
        } catch (error) {
          console.warn('Media session action handlers are not fully supported:', error);
        }
      }

      toast.success(`${prayerName} Time!`, {
        description: 'It is time for prayer. Adhan is playing.',
        duration: 30000,
      });

      localNotifications.showNativeNotification(
        `${prayerName} Prayer Time`,
        `It is time for ${prayerName} prayer.`,
        { url: '/dashboard', tag: 'prayer-alarm' }
      );

      emitPlaybackState(true, prayerName);

      try {
        await audio.play();
      } catch (error) {
        const errorName = error instanceof Error ? error.name : '';
        if (errorName !== 'AbortError') {
          console.error('Failed to play Adhan:', error);
          toast.error('Audio Blocked', {
            description: 'Please tap anywhere in the app to enable Adhan audio.',
          });
        }
        stopCurrentAdhan();
      }
    },
    [emitPlaybackState, stopCurrentAdhan]
  );

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

    const cached = readCachedPrayerTimes();
    if (!cached) return;

    const { times, date } = cached;
    const today = new Date().toDateString();

    if (date !== today) {
      fetchAndCachePrayerTimes();
      return;
    }

    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
    const lastReminder = localStorage.getItem(LAST_REMINDER_KEY);
    const reminderMinutes = parseInt(localStorage.getItem(REMINDER_MINUTES_KEY) || '0', 10);

    for (const prayer of times) {
      const prayerTime = normalizeTimeString(prayer.time);
      const prayerKey = `${today}-${prayer.name}`;
      const reminderKey = `${today}-${prayer.name}-reminder`;

      if (prayerTime === currentTimeStr && lastPlayed !== prayerKey) {
        localStorage.setItem(LAST_PLAYED_KEY, prayerKey);
        playAdhan(prayer.name);
        break;
      }

      if (reminderMinutes > 0 && lastReminder !== reminderKey) {
        const [prayerHour, prayerMinute] = prayerTime.split(':').map(Number);
        const prayerDate = new Date();
        prayerDate.setHours(prayerHour, prayerMinute, 0, 0);

        const reminderTime = new Date(prayerDate.getTime() - reminderMinutes * 60 * 1000);
        const reminderTimeStr = `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;

        if (currentTimeStr === reminderTimeStr) {
          localStorage.setItem(LAST_REMINDER_KEY, reminderKey);
          playReminder(prayer.name, reminderMinutes);
          break;
        }
      }
    }
  }, [fetchAndCachePrayerTimes, playAdhan, playReminder, readCachedPrayerTimes]);

  const startChecking = useCallback(() => {
    if (checkIntervalRef.current) return;

    fetchAndCachePrayerTimes();
    checkPrayerTime();
    checkIntervalRef.current = setInterval(checkPrayerTime, 30000);
  }, [checkPrayerTime, fetchAndCachePrayerTimes]);

  const stopChecking = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    stopCurrentAdhan();
  }, [stopCurrentAdhan]);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      startChecking();
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue === 'true') {
        startChecking();
      } else {
        stopChecking();
      }
    };

    const handleToggle = (event: Event) => {
      const detail = (event as CustomEvent<PrayerAlarmToggleDetail>).detail;
      if (detail?.enabled) {
        startChecking();
      } else {
        stopChecking();
      }
    };

    const handleControl = (event: Event) => {
      const detail = (event as CustomEvent<PrayerAlarmControlDetail>).detail;
      if (!detail) return;

      if (detail.action === 'stop') {
        stopCurrentAdhan();
        return;
      }

      if (detail.action === 'test') {
        const prayerName = detail.prayerName?.trim() || 'Dhuhr';
        playAdhan(prayerName, { force: true });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(PRAYER_ALARM_TOGGLE_EVENT, handleToggle as EventListener);
    window.addEventListener(PRAYER_ALARM_CONTROL_EVENT, handleControl as EventListener);

    return () => {
      stopChecking();
      emitPlaybackState(false, null);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(PRAYER_ALARM_TOGGLE_EVENT, handleToggle as EventListener);
      window.removeEventListener(PRAYER_ALARM_CONTROL_EVENT, handleControl as EventListener);
    };
  }, [emitPlaybackState, playAdhan, startChecking, stopChecking, stopCurrentAdhan]);

  return null;
};
