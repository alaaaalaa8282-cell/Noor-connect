/**
 * Islamic Calendar Hook (Maghrib-aware)
 * 
 * Islamic dates change at Maghrib (sunset), NOT at midnight.
 * This hook uses the Aladhan monthly calendar data, which contains both
 * Maghrib times and Hijri dates, to determine the correct Islamic date:
 * 
 * - Before Maghrib: show TODAY's Hijri date from the API
 * - After Maghrib: show TOMORROW's Hijri date from the API
 *   (because the new Islamic day begins at Maghrib)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AladhanAPI, AladhanDayData } from '@/lib/aladhan-api';
import { useLocationState } from '@/lib/location-state';

export interface UseIslamicCalendarReturn {
  islamicInfo: {
    currentDate: {
      hijri: {
        day: string;
        month: { number: number; en: string; ar: string };
        year: string;
        weekday: { en: string; ar: string };
        holidays: string[];
      };
    };
    isRamadan: boolean;
    ramadanDay: number;
    daysUntilRamadan: number;
    isEidAlFitr: boolean;
    isEidAlAdha: boolean;
    hijriMonth: number;
    hijriDay: number;
    hijriYear: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  isRamadan: boolean;
  ramadanDay: number;
  daysUntilRamadan: number;
  isEidAlFitr: boolean;
  isEidAlAdha: boolean;
  hijriDate: string;
  refresh: () => Promise<void>;
}

/**
 * Parse a time string like "17:45 (PKT)" into minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  const cleaned = timeStr.replace(/\s*\(.*?\)\s*/g, '').trim();
  const parts = cleaned.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return -1;
  return hours * 60 + minutes;
}

export function useIslamicCalendar(): UseIslamicCalendarReturn {
  const location = useLocationState();
  const [hijriDay, setHijriDay] = useState('');
  const [hijriMonthNum, setHijriMonthNum] = useState(0);
  const [hijriMonthEn, setHijriMonthEn] = useState('');
  const [hijriMonthAr, setHijriMonthAr] = useState('');
  const [hijriYear, setHijriYear] = useState('');
  const [hijriWeekday, setHijriWeekday] = useState({ en: '', ar: '' });
  const [hijriHolidays, setHijriHolidays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateKey = useRef<string>('');

  const computeIslamicDate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const now = new Date();
      const today = now;
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's data from the Aladhan monthly calendar cache
      let todayData: AladhanDayData | null = null;
      let tomorrowData: AladhanDayData | null = null;

      if (location.latitude && location.longitude) {
        todayData = AladhanAPI.getPrayerTimesForDate(today, location.latitude, location.longitude);
        tomorrowData = AladhanAPI.getPrayerTimesForDate(tomorrow, location.latitude, location.longitude);

        // If cache miss, fetch fresh data
        if (!todayData) {
          try {
            await AladhanAPI.fetchMonthlyCalendar(
              location.latitude,
              location.longitude,
              today.getFullYear(),
              today.getMonth() + 1,
              1
            );
            todayData = AladhanAPI.getPrayerTimesForDate(today, location.latitude, location.longitude);
          } catch (fetchErr) {
            console.warn('[useIslamicCalendar] Failed to fetch monthly data:', fetchErr);
          }
        }

        // Tomorrow might be in next month
        if (!tomorrowData && todayData) {
          if (tomorrow.getMonth() !== today.getMonth()) {
            try {
              await AladhanAPI.fetchMonthlyCalendar(
                location.latitude,
                location.longitude,
                tomorrow.getFullYear(),
                tomorrow.getMonth() + 1,
                1
              );
              tomorrowData = AladhanAPI.getPrayerTimesForDate(tomorrow, location.latitude, location.longitude);
            } catch (fetchErr) {
              console.warn('[useIslamicCalendar] Failed to fetch next month data:', fetchErr);
            }
          } else {
            tomorrowData = AladhanAPI.getPrayerTimesForDate(tomorrow, location.latitude, location.longitude);
          }
        }
      }

      // Determine if we're past Maghrib
      let isAfterMaghrib = false;
      if (todayData) {
        const maghribMinutes = parseTimeToMinutes(todayData.timings.Maghrib);
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        isAfterMaghrib = maghribMinutes > 0 && nowMinutes >= maghribMinutes;
      }

      // Pick the correct Hijri date
      let hijriSource: AladhanDayData | null = null;

      if (isAfterMaghrib && tomorrowData) {
        // After Maghrib: the new Islamic day has started → use tomorrow's Hijri date
        hijriSource = tomorrowData;
        console.log('[useIslamicCalendar] After Maghrib → using tomorrow\'s Hijri date');
      } else if (todayData) {
        // Before Maghrib: still the current Islamic day → use today's Hijri date
        hijriSource = todayData;
        console.log('[useIslamicCalendar] Before Maghrib → using today\'s Hijri date');
      }

      if (hijriSource) {
        const h = hijriSource.date.hijri;
        setHijriDay(h.day);
        setHijriMonthNum(h.month.number);
        setHijriMonthEn(h.month.en);
        setHijriMonthAr(h.month.ar);
        setHijriYear(h.year);
        setHijriWeekday(h.weekday);
        setHijriHolidays(h.holidays || []);
      } else {
        // Fallback: use the gToH API directly
        console.log('[useIslamicCalendar] No cached data, falling back to gToH API');
        const { islamicCalendarService } = await import('@/lib/islamic-calendar-service');
        const info = await islamicCalendarService.getIslamicCalendarInfo(now);
        const h = info.currentDate.hijri;
        setHijriDay(h.day);
        setHijriMonthNum(h.month.number);
        setHijriMonthEn(h.month.en);
        setHijriMonthAr(h.month.ar || '');
        setHijriYear(h.year);
        setHijriWeekday(h.weekday);
        setHijriHolidays(h.holidays || []);
      }
    } catch (err) {
      console.error('[useIslamicCalendar] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Islamic calendar');
    } finally {
      setIsLoading(false);
    }
  }, [location.latitude, location.longitude]);

  // Initial computation + recompute when location changes
  useEffect(() => {
    computeIslamicDate();
  }, [computeIslamicDate]);

  // Check every minute to detect Maghrib crossing
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
      if (key !== lastUpdateKey.current) {
        lastUpdateKey.current = key;
        computeIslamicDate();
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [computeIslamicDate]);

  // Derived values
  const hijriMonthNumber = hijriMonthNum;
  const hijriDayNumber = parseInt(hijriDay) || 0;

  const isRamadan = hijriMonthNumber === 9;
  const ramadanDay = isRamadan ? hijriDayNumber : 0;
  const isEidAlFitr = hijriMonthNumber === 10 && hijriDayNumber === 1;
  const isEidAlAdha = hijriMonthNumber === 12 && hijriDayNumber === 10;

  const hijriDate = hijriDay ? `${hijriDay} ${hijriMonthEn} ${hijriYear}` : '';

  const islamicInfo = hijriDay ? {
    currentDate: {
      hijri: {
        day: hijriDay,
        month: { number: hijriMonthNumber, en: hijriMonthEn, ar: hijriMonthAr },
        year: hijriYear,
        weekday: hijriWeekday,
        holidays: hijriHolidays,
      },
    },
    isRamadan,
    ramadanDay,
    daysUntilRamadan: isRamadan ? 0 : -1,
    isEidAlFitr,
    isEidAlAdha,
    hijriMonth: hijriMonthNumber,
    hijriDay: hijriDayNumber,
    hijriYear: parseInt(hijriYear) || 0,
  } : null;

  return {
    islamicInfo,
    isLoading,
    error,
    isRamadan,
    ramadanDay,
    daysUntilRamadan: isRamadan ? 0 : -1,
    isEidAlFitr,
    isEidAlAdha,
    hijriDate,
    refresh: computeIslamicDate,
  };
}
