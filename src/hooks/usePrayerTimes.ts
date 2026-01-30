/**
 * Prayer Times Hook using Aladhan API
 * Fetches prayer times from https://api.aladhan.com/v1/timingsByCity
 */

import { useState, useEffect, useCallback } from 'react';
import { AladhanAPI, type AladhanPrayerTime } from '@/lib/aladhan-api';
import { getPrayerSettings } from '@/lib/storage';

export interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  midnight: Date;
}

export interface PrayerTimesWithEnd {
  fajr: { start: Date; end: Date };
  sunrise: { start: Date; end: Date };
  dhuhr: { start: Date; end: Date };
  asr: { start: Date; end: Date };
  maghrib: { start: Date; end: Date };
  isha: { start: Date; end: Date };
}

export interface UsePrayerTimesReturn {
  prayerTimes: PrayerTimes | null;
  prayerTimesWithEnd: PrayerTimesWithEnd | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePrayerTimes(): UsePrayerTimesReturn {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [prayerTimesWithEnd, setPrayerTimesWithEnd] = useState<PrayerTimesWithEnd | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseTimeToDate = useCallback((timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }, []);

  const calculateEndTimes = useCallback((times: PrayerTimes): PrayerTimesWithEnd => {
    return {
      fajr: {
        start: times.fajr,
        end: times.sunrise // Fajr ends at sunrise
      },
      sunrise: {
        start: times.sunrise,
        end: times.dhuhr // Sunrise ends at Dhuhr
      },
      dhuhr: {
        start: times.dhuhr,
        end: times.asr // Dhuhr ends at Asr
      },
      asr: {
        start: times.asr,
        end: times.maghrib // Asr ends at Maghrib
      },
      maghrib: {
        start: times.maghrib,
        end: times.isha // Maghrib ends at Isha
      },
      isha: {
        start: times.isha,
        end: times.midnight // Isha ends at Midnight (recommended end)
      }
    };
  }, []);

  const fetchPrayerTimes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const settings = getPrayerSettings();
      
      if (!settings.latitude || !settings.longitude) {
        throw new Error('Location not set. Please set your location in settings.');
      }

      // Fetch from Aladhan API
      const timings = await AladhanAPI.getTodaysPrayerTimes(
        settings.latitude,
        settings.longitude,
        1 // Method 1 = Muslim World League
      );

      // Convert API times to Date objects
      const times: PrayerTimes = {
        fajr: parseTimeToDate(timings.Fajr),
        sunrise: parseTimeToDate(timings.Sunrise),
        dhuhr: parseTimeToDate(timings.Dhuhr),
        asr: parseTimeToDate(timings.Asr),
        maghrib: parseTimeToDate(timings.Maghrib),
        isha: parseTimeToDate(timings.Isha),
        midnight: parseTimeToDate(timings.Midnight)
      };

      // Calculate end times
      const withEnd = calculateEndTimes(times);

      setPrayerTimes(times);
      setPrayerTimesWithEnd(withEnd);
      
    } catch (err) {
      console.error('Failed to fetch prayer times:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prayer times');
    } finally {
      setIsLoading(false);
    }
  }, [parseTimeToDate, calculateEndTimes]);

  // Initial fetch
  useEffect(() => {
    fetchPrayerTimes();
  }, [fetchPrayerTimes]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPrayerTimes();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [fetchPrayerTimes]);

  return {
    prayerTimes,
    prayerTimesWithEnd,
    isLoading,
    error,
    refresh: fetchPrayerTimes
  };
}
