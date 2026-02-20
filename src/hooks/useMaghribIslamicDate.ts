/**
 * Maghrib-based Islamic Date Hook
 * Manages Islamic date that only changes after Maghrib (sunset)
 */

import { useState, useEffect, useRef } from 'react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { IslamicCalendarInfo, islamicCalendarService } from '@/lib/islamic-calendar-service';

export interface UseMaghribIslamicDateReturn {
  hijriDate: string;
  isRamadan: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMaghribIslamicDate(): UseMaghribIslamicDateReturn {
  const { prayerTimesWithEnd } = usePrayerTimes();
  const [islamicInfo, setIslamicInfo] = useState<IslamicCalendarInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track the last Maghrib time when we updated the date
  const lastMaghribUpdate = useRef<string | null>(null);
  
  // Get current displayed Hijri date
  const hijriDate = islamicInfo ? 
    `${islamicInfo.currentDate.hijri.day} ${islamicInfo.currentDate.hijri.month.en} ${islamicInfo.currentDate.hijri.year}` : 
    '';
  
  const isRamadan = islamicInfo?.isRamadan ?? false;

  // Fetch Islamic calendar info
  const fetchIslamicCalendarInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const info = await islamicCalendarService.getIslamicCalendarInfo();
      setIslamicInfo(info);
    } catch (err) {
      console.error('Error fetching Islamic calendar info:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Islamic calendar');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we should update the Islamic date based on Maghrib
  const checkMaghribUpdate = () => {
    if (!prayerTimesWithEnd?.maghrib || !islamicInfo) return;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Get Maghrib time
    const maghribDate = prayerTimesWithEnd.maghrib.start;
    const maghribHours = maghribDate.getHours();
    const maghribMinutes = maghribDate.getMinutes();
    const maghribTimeStr = `${maghribHours.toString().padStart(2, '0')}:${maghribMinutes.toString().padStart(2, '0')}`;
    const maghribMinutesTotal = maghribHours * 60 + maghribMinutes;
    
    const today = now.toDateString();
    
    // If it's after Maghrib and we haven't updated today's date yet
    if (currentTime >= maghribMinutesTotal && lastMaghribUpdate.current !== maghribTimeStr) {
      console.log('🌅 Maghrib passed! Updating Islamic date for next day:', {
        currentTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        maghribTime: maghribTimeStr,
        today,
        lastUpdate: lastMaghribUpdate.current
      });
      
      // Mark that we've updated for today's Maghrib
      lastMaghribUpdate.current = maghribTimeStr;
      
      // Fetch tomorrow's Islamic date (since Islamic day starts after Maghrib)
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      islamicCalendarService.getIslamicCalendarInfo(tomorrow)
        .then(tomorrowInfo => {
          setIslamicInfo(tomorrowInfo);
          console.log('📅 Updated to tomorrow\'s Islamic date:', tomorrowInfo?.currentDate.hijri);
        })
        .catch(err => {
          console.error('Error fetching tomorrow\'s Islamic date:', err);
        });
    }
    
    // Reset at midnight (for next day's Maghrib check)
    if (currentTime < maghribMinutesTotal && lastMaghribUpdate.current !== null) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // If we're before Maghrib today, we should show today's Islamic date
      islamicCalendarService.getIslamicCalendarInfo(yesterday)
        .then(yesterdayInfo => {
          setIslamicInfo(yesterdayInfo);
          console.log('📅 Reset to today\'s Islamic date (before Maghrib):', yesterdayInfo?.currentDate.hijri);
        })
        .catch(err => {
          console.error('Error resetting Islamic date:', err);
        });
      
      lastMaghribUpdate.current = null;
    }
  };

  // Check every minute for Maghrib time
  useEffect(() => {
    const interval = setInterval(checkMaghribUpdate, 60000); // Check every minute
    
    // Initial check
    checkMaghribUpdate();
    
    return () => clearInterval(interval);
  }, [prayerTimesWithEnd, islamicInfo]);

  // Initial fetch
  useEffect(() => {
    fetchIslamicCalendarInfo();
  }, []);

  const refresh = async () => {
    await fetchIslamicCalendarInfo();
  };

  return {
    hijriDate,
    isRamadan,
    isLoading,
    error,
    refresh
  };
}
