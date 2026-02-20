/**
 * Maghrib-based Islamic Date Hook
 * 
 * Now delegates to the corrected useIslamicCalendar hook which is already
 * Maghrib-aware. This thin wrapper maintains backward compatibility.
 */

import { useIslamicCalendar } from '@/hooks/useIslamicCalendar';

export interface UseMaghribIslamicDateReturn {
  hijriDate: string;
  isRamadan: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMaghribIslamicDate(): UseMaghribIslamicDateReturn {
  const { hijriDate, isRamadan, isLoading, error, refresh } = useIslamicCalendar();

  return {
    hijriDate,
    isRamadan,
    isLoading,
    error,
    refresh,
  };
}
