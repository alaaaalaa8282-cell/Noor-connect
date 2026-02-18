/**
 * Islamic Calendar Hook
 * Provides reactive Islamic calendar information using the Islamic Calendar Service
 */

import { useState, useEffect, useCallback } from 'react';
import { IslamicCalendarInfo, islamicCalendarService } from '@/lib/islamic-calendar-service';

export interface UseIslamicCalendarReturn {
  islamicInfo: IslamicCalendarInfo | null;
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

export function useIslamicCalendar(date?: Date): UseIslamicCalendarReturn {
  const [islamicInfo, setIslamicInfo] = useState<IslamicCalendarInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIslamicCalendarInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const info = await islamicCalendarService.getIslamicCalendarInfo(date);
      setIslamicInfo(info);
    } catch (err) {
      console.error('Error fetching Islamic calendar info:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Islamic calendar');
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchIslamicCalendarInfo();
  }, [fetchIslamicCalendarInfo]);

  // Auto-refresh every hour to keep dates current
  useEffect(() => {
    const interval = setInterval(fetchIslamicCalendarInfo, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, [fetchIslamicCalendarInfo]);

  const refresh = useCallback(async () => {
    await fetchIslamicCalendarInfo();
  }, [fetchIslamicCalendarInfo]);

  // Extract commonly used values for convenience
  const isRamadan = islamicInfo?.isRamadan ?? false;
  const ramadanDay = islamicInfo?.ramadanDay ?? 0;
  const daysUntilRamadan = islamicInfo?.daysUntilRamadan ?? -1;
  const isEidAlFitr = islamicInfo?.isEidAlFitr ?? false;
  const isEidAlAdha = islamicInfo?.isEidAlAdha ?? false;
  
  const hijriDate = islamicInfo ? 
    `${islamicInfo.currentDate.hijri.day} ${islamicInfo.currentDate.hijri.month.en} ${islamicInfo.currentDate.hijri.year}` : 
    '';

  return {
    islamicInfo,
    isLoading,
    error,
    isRamadan,
    ramadanDay,
    daysUntilRamadan,
    isEidAlFitr,
    isEidAlAdha,
    hijriDate,
    refresh
  };
}
