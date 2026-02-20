/**
 * Islamic Date Header
 * Displays Islamic date prominently in header, updates after Maghrib
 */

import { useMaghribIslamicDate } from '@/hooks/useMaghribIslamicDate';

export function IslamicDateHeader() {
  const { hijriDate, isRamadan } = useMaghribIslamicDate();

  if (!hijriDate) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
      <span className="font-arabic text-lg font-bold text-primary">
        {hijriDate}
      </span>
      {isRamadan && (
        <span className="text-xs font-medium text-primary bg-primary/20 px-2 py-1 rounded-full">
          Ramadan
        </span>
      )}
    </div>
  );
}
