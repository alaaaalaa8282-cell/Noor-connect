import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getSelectedAdhanUrl, stopAllAdhanPreviews } from '@/components/AdhanSelector';

interface PrayerTime {
  name: string;
  time: string;
}

const STORAGE_KEY = 'prayer-alarm-enabled';
const LAST_PLAYED_KEY = 'prayer-alarm-last-played';
const REMINDER_SENT_KEY = 'prayer-reminder-sent';
const FAJR_ADHAN_URL = '/audio/adhan-fajr.mp3';

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

  // Check if it's prayer time or 15 minutes before prayer
  const checkPrayerTime = useCallback(() => {
    if (!isEnabled || prayerTimesRef.current.length === 0) return;

    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const todayDate = now.toDateString();
    const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
    const reminderSent = localStorage.getItem(REMINDER_SENT_KEY) || '{}';
    const reminderData = JSON.parse(reminderSent);

    for (const prayer of prayerTimesRef.current) {
      const prayerKey = `${todayDate}-${prayer.name}`;
      const reminderKey = `${todayDate}-${prayer.name}-reminder`;
      
      // Check if it's prayer time
      if (prayer.time === currentTimeStr && lastPlayed !== prayerKey) {
        // It's prayer time!
        localStorage.setItem(LAST_PLAYED_KEY, prayerKey);
        playAdhan(prayer.name);
        break;
      }
      
      // Check if it's 15 minutes before prayer time
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hours, minutes, 0, 0);
      
      const reminderTime = new Date(prayerTime.getTime() - 15 * 60 * 1000); // 15 minutes before
      const reminderTimeStr = `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTimeStr === reminderTimeStr && !reminderData[reminderKey]) {
        // Send 15-minute reminder
        sendPrayerReminder(prayer.name, prayer.time);
        
        // Mark reminder as sent
        reminderData[reminderKey] = true;
        localStorage.setItem(REMINDER_SENT_KEY, JSON.stringify(reminderData));
        break;
      }
    }
  }, [isEnabled]);

  // Send prayer reminder notification
  const sendPrayerReminder = useCallback((prayerName: string, prayerTime: string) => {
    // Show in-app notification
    toast.info(`${prayerName} Prayer Reminder`, {
      description: `${prayerName} prayer will be in 15 minutes at ${prayerTime}.`,
      duration: 10000,
    });

    // Send system notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${prayerName} Prayer Reminder`, {
        body: `${prayerName} prayer will be in 15 minutes at ${prayerTime}.`,
        icon: '/favicon.png',
        tag: `prayer-reminder-${prayerName}`,
        requireInteraction: false,
      });
    }
  }, []);

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

    // Use dedicated Fajr Adhan for Fajr prayer, otherwise use user selection
    const adhanUrl = prayerName === 'Fajr' ? FAJR_ADHAN_URL : getSelectedAdhanUrl();
    prayerAlarmAudio = new Audio(adhanUrl);
    
    // Set audio properties for better playback
    prayerAlarmAudio.preload = 'auto';
    prayerAlarmAudio.loop = false;
    
    prayerAlarmAudio.addEventListener('loadeddata', () => {
      console.log(`Adhan loaded: ${adhanUrl}, duration: ${prayerAlarmAudio?.duration}s`);
    });
    
    prayerAlarmAudio.addEventListener('ended', () => {
      console.log('Adhan finished playing naturally');
      setIsPlaying(false);
      setCurrentPrayer(null);
      prayerAlarmAudio = null;
    });

    prayerAlarmAudio.addEventListener('error', (e) => {
      console.error('Adhan playback error:', e);
      setIsPlaying(false);
      setCurrentPrayer(null);
      prayerAlarmAudio = null;
      toast.error('Could not play Adhan. Please check your audio files.');
    });

    prayerAlarmAudio.addEventListener('stalled', () => {
      console.warn('Adhan playback stalled');
    });

    setCurrentPrayer(prayerName);
    setIsPlaying(true);

    // Show notification
    toast.success(`${prayerName} Time!`, {
      description: 'It is time for prayer. Adhan is playing.',
      duration: 15000, // Longer duration for prayer time Adhan
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
      setCurrentPrayer(null);
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
    const tempAudio = new Audio(getSelectedAdhanUrl());
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
    
    // Clear reminder data when disabling alarm
    localStorage.removeItem(REMINDER_SENT_KEY);
    
    toast.success('Prayer Alarm Disabled');
  }, [stopAdhan]);

  // Clear old reminder data (call this daily)
  const clearOldReminderData = useCallback(() => {
    const reminderSent = localStorage.getItem(REMINDER_SENT_KEY);
    if (reminderSent) {
      const reminderData = JSON.parse(reminderSent);
      const todayDate = new Date().toDateString();
      const updatedData: Record<string, boolean> = {};
      
      // Only keep today's reminders
      Object.keys(reminderData).forEach(key => {
        if (key.startsWith(todayDate)) {
          updatedData[key] = reminderData[key];
        }
      });
      
      localStorage.setItem(REMINDER_SENT_KEY, JSON.stringify(updatedData));
    }
  }, []);

  // Test Adhan
  const testAdhan = useCallback(() => {
    playAdhan('Test');
    // Don't auto-stop test Adhan - let it play fully
    // User can manually stop with the Stop button if needed
  }, [playAdhan]);

  // Start checking prayer times when enabled
  useEffect(() => {
    if (isEnabled) {
      fetchPrayerTimes();
      
      // Clear old reminder data on startup
      clearOldReminderData();
      
      // Check every 30 seconds
      checkIntervalRef.current = setInterval(() => {
        checkPrayerTime();
      }, 30000);

      // Also check immediately
      checkPrayerTime();

      // Refresh prayer times every hour
      const refreshInterval = setInterval(fetchPrayerTimes, 3600000);
      
      // Clear old reminder data daily at midnight
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      const cleanupTimeout = setTimeout(() => {
        clearOldReminderData();
        // Set up daily cleanup
        setInterval(clearOldReminderData, 24 * 60 * 60 * 1000);
      }, msUntilMidnight);

      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
        clearInterval(refreshInterval);
        clearTimeout(cleanupTimeout);
      };
    }
  }, [isEnabled, fetchPrayerTimes, checkPrayerTime, clearOldReminderData]);

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
