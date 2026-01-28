import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { prayerTimesApiResponseSchema, safeParseApiResponse } from '@/lib/api-schemas';
import { getSelectedAdhanUrl } from '@/components/AdhanSelector';

const ADHAN_AUDIO_URL = 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/azan.mp3';
const STORAGE_KEY = 'prayer-alarm-enabled';
const LAST_PLAYED_KEY = 'prayer-alarm-last-played';
const PRAYER_TIMES_KEY = 'cached-prayer-times';
const REMINDER_MINUTES_KEY = 'prayer-reminder-minutes';
const LAST_REMINDER_KEY = 'prayer-reminder-last-played';

interface PrayerTime {
  name: string;
  time: string;
}

export const GlobalPrayerAlarm = () => {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const playAdhan = useCallback((prayerName: string) => {
    // Get user-selected Adhan URL
    const adhanUrl = getSelectedAdhanUrl();
    
    // Create new audio instance with selected Adhan
    const audio = new Audio(adhanUrl);
    audio.volume = 0.7;
    audio.preload = 'auto';

    toast.success(`${prayerName} Time!`, {
      description: 'It is time for prayer. Adhan is playing.',
      duration: 30000, // Longer duration for full Adhan
    });

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${prayerName} Prayer Time`, {
        body: 'It is time for prayer',
        icon: '/favicon.png',
        tag: 'prayer-alarm',
        requireInteraction: true,
      });
    }

    audio.play().catch((error) => {
      console.error('Failed to play Adhan:', error);
      toast.error('Failed to play Adhan', {
        description: 'Please check your audio settings',
      });
    });
  }, []);

  const playReminder = useCallback((prayerName: string, minutesBefore: number) => {
    toast.info(`${prayerName} in ${minutesBefore} minutes`, {
      description: 'Prepare for prayer',
      duration: 10000,
    });

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${prayerName} Prayer Coming Up`, {
        body: `${prayerName} prayer will begin in ${minutesBefore} minutes`,
        icon: '/favicon.png',
        tag: 'prayer-reminder',
      });
    }
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
        const [prayerHour, prayerMinute] = prayer.time.split(':').map(Number);
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
