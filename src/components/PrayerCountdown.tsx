import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Clock, Moon, Sun, Cloud, Sunset, Sunrise, CloudMoon, AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationSearch } from "@/components/LocationSearch";
import { TimeDisplay } from "@/components/TimeDisplay";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import type { LocationData, PrayerTimesWithEnd } from "@/hooks/usePrayerTimes";
import { useCountdown } from "@/hooks/use-countdown";
import { getTimeFormat, formatPrayerTime } from "@/lib/time-formatter";
import {
  getCurrentPrayer,
  getNextPrayer as getNextPrayerWithEnd,
  isPrayerEndingSoon,
  formatTime,
  type PrayerWithEndTime
} from "@/lib/prayer-end-times";

const prayerIcons: Record<string, React.ReactNode> = {
  Fajr: <Moon className="w-6 h-6" />,
  Sunrise: <Sunrise className="w-6 h-6" />,
  Dhuhr: <Sun className="w-6 h-6" />,
  Asr: <Cloud className="w-6 h-6" />,
  Maghrib: <Sunset className="w-6 h-6" />,
  Isha: <CloudMoon className="w-6 h-6" />,
};

export interface PrayerCountdownProps {
  timings?: PrayerTimesWithEnd | null;
  location?: LocationData | null;
  isLoading?: boolean;
  error?: string | null;
  needsManualLocation?: boolean;
  refresh?: () => Promise<void>;
  setManualLocation?: (city: string, country: string) => Promise<void>;
  timeZone?: string;
}

const PrayerCountdownComponent = function PrayerCountdown(props: PrayerCountdownProps) {
  const prayerTimesHook = usePrayerTimes();
  const prayerTimesWithEnd = props.timings ?? prayerTimesHook.prayerTimesWithEnd;
  const location = props.location ?? prayerTimesHook.location;
  const isLoading = props.isLoading ?? prayerTimesHook.isLoading;
  const error = props.error ?? prayerTimesHook.error;
  const needsManualLocation = props.needsManualLocation ?? prayerTimesHook.needsManualLocation;
  const refresh = props.refresh ?? prayerTimesHook.refresh;
  const setManualLocation = props.setManualLocation ?? prayerTimesHook.setManualLocation;

  // Get current time format preference
  const timeFormat = getTimeFormat();

  // Convert to PrayerWithEndTime format for compatibility - ALWAYS call this
  const prayersWithEndTimes: PrayerWithEndTime[] = prayerTimesWithEnd ? [
    {
      name: 'Fajr',
      time: formatPrayerTime(prayerTimesWithEnd.fajr.start, timeFormat, props.timeZone),
      datetime: prayerTimesWithEnd.fajr.start,
      endTime: prayerTimesWithEnd.fajr.end,
      endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.fajr.end, timeFormat, props.timeZone)
    },
    {
      name: 'Sunrise',
      time: formatPrayerTime(prayerTimesWithEnd.sunrise.start, timeFormat, props.timeZone),
      datetime: prayerTimesWithEnd.sunrise.start,
      endTime: prayerTimesWithEnd.sunrise.end,
      endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.sunrise.end, timeFormat, props.timeZone)
    },
    {
      name: 'Dhuhr',
      time: formatPrayerTime(prayerTimesWithEnd.dhuhr.start, timeFormat, props.timeZone),
      datetime: prayerTimesWithEnd.dhuhr.start,
      endTime: prayerTimesWithEnd.dhuhr.end,
      endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.dhuhr.end, timeFormat, props.timeZone)
    },
    {
      name: 'Asr',
      time: formatPrayerTime(prayerTimesWithEnd.asr.start, timeFormat, props.timeZone),
      datetime: prayerTimesWithEnd.asr.start,
      endTime: prayerTimesWithEnd.asr.end,
      endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.asr.end, timeFormat, props.timeZone)
    },
    {
      name: 'Maghrib',
      time: formatPrayerTime(prayerTimesWithEnd.maghrib.start, timeFormat, props.timeZone),
      datetime: prayerTimesWithEnd.maghrib.start,
      endTime: prayerTimesWithEnd.maghrib.end,
      endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.maghrib.end, timeFormat, props.timeZone)
    },
    {
      name: 'Isha',
      time: formatPrayerTime(prayerTimesWithEnd.isha.start, timeFormat, props.timeZone),
      datetime: prayerTimesWithEnd.isha.start,
      endTime: prayerTimesWithEnd.isha.end,
      endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.isha.end, timeFormat, props.timeZone)
    }
  ] : [];

  const currentPrayer = getCurrentPrayer(prayersWithEndTimes);
  const nextPrayer = prayersWithEndTimes.find(p =>
    p.datetime > new Date() && p !== currentPrayer && p.name !== 'Sunrise'
  );

  // ALWAYS call useCountdown hooks with default values - NEVER conditional
  const currentPrayerCountdown = useCountdown(currentPrayer?.endTime || new Date());
  const nextPrayerCountdown = useCountdown(nextPrayer?.datetime || new Date());

  // Memoize card styling to prevent recalculation every second - MUST be before early returns
  const getCardStyle = useMemo(() => {
    return {
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)',
      border: '3px solid rgb(59, 130, 246)'
    };
  }, [currentPrayer, nextPrayer]);

  // Show manual location search when needed
  if (needsManualLocation) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Prayer Times</h2>
          {location && (
            <div className="text-xs text-muted-foreground">
              📍 {location.city && location.country ? `${location.city}, ${location.country}` : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
              <span className="ml-2 px-2 py-1 bg-muted rounded">
                {location.source === 'geolocation' ? '🛰️ GPS' : location.source === 'default' ? '🏛️ Default' : '🔍 Manual'}
              </span>
            </div>
          )}
        </div>
        <LocationSearch
          onLocationSelect={setManualLocation}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // Enhanced loading skeleton to prevent CLS with fixed height
  if (isLoading) {
    return (
      <div className="h-40"> {/* Fixed height container to prevent CLS */}
        <Card className="overflow-hidden border-primary/20 h-full">
          <div className="p-4 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-5 w-24 bg-muted rounded mb-2 animate-pulse" />
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="h-6 w-20 bg-muted rounded mb-1 animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Loading prayer times...</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state with fixed height to prevent CLS
  if (error) {
    return (
      <div className="h-40"> {/* Fixed height container to prevent CLS */}
        <Card className="border-red-200 bg-red-50 h-full">
          <div className="p-4 h-full">
            <div className="flex items-center gap-3 text-red-600 h-full">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium">Failed to load prayer times</p>
                <p className="text-sm">{error}</p>
                {location && (
                  <p className="text-xs mt-1">
                    📍 {location.city && location.country ? `${location.city}, ${location.country}` : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={refresh}
                    className="text-sm underline hover:no-underline"
                  >
                    Try again
                  </button>
                  <button
                    onClick={() => setManualLocation("Mecca", "Saudi Arabia")}
                    className="text-sm underline hover:no-underline"
                  >
                    Use Mecca
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentPrayer && !nextPrayer) {
    return null;
  }

  // Show current prayer countdown if available, otherwise show next prayer
  const displayPrayer = currentPrayer || nextPrayer;
  const isCurrentPrayer = !!currentPrayer;
  const targetTime = isCurrentPrayer ? (currentPrayer?.endTime || new Date()) : (nextPrayer?.datetime || new Date());
  const isEndingSoon = currentPrayer && isPrayerEndingSoon(currentPrayer);

  // Only use countdown if we have a valid prayer
  const isValidCountdown = (currentPrayer && isCurrentPrayer) || (nextPrayer && !isCurrentPrayer);

  const getAlertColor = () => {
    return 'text-primary';
  };

  const getAlertBgColor = () => {
    return 'bg-primary/10';
  };

  const getCardGlow = () => {
    return 'shadow-lg';
  };

  const getCardBorder = () => {
    return 'border-primary/20';
  };

  return (

    <div className="relative overflow-hidden rounded-2xl border border-primary/20 shadow-lg transition-all duration-300 hover:shadow-xl group">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent"></div>
      {isEndingSoon && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent animate-pulse"></div>
      )}

      {/* Decorative Circles */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>

      <div className="relative p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${isEndingSoon ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
              {isEndingSoon ? (
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              ) : (
                prayerIcons[displayPrayer.name] || <Clock className="w-6 h-6" />
              )}
              {/* Active Dot */}
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {isCurrentPrayer ? 'Now Praying' : 'Next Prayer'}
                </span>
                {isEndingSoon && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-600 animate-pulse">
                    ENDING SOON
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-foreground leading-tight">
                {displayPrayer.name}
              </h2>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-primary tabular-nums">
              <TimeDisplay targetTime={targetTime} className="" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              {isCurrentPrayer ? 'until ' : 'starts at '}
              {isCurrentPrayer ? displayPrayer.endTimeFormatted : formatPrayerTime(nextPrayer?.datetime || new Date(), timeFormat, props.timeZone)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {isCurrentPrayer && isValidCountdown && (
          <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isEndingSoon ? 'bg-orange-500' : 'bg-primary'}`}
              style={{ width: isEndingSoon ? '90%' : '45%' }} // Simplified width relative to status for visual feedback
            ></div>
          </div>
        )}

        {/* Footer Info */}
        <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground font-medium">
          <span>
            {isCurrentPrayer ? `Started: ${formatPrayerTime(displayPrayer.datetime, timeFormat, props.timeZone)}` : `Current: ${currentPrayer?.name || 'None'}`}
          </span>
          <div className="flex items-center gap-1.5 opacity-80">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            {location?.city || 'Location Active'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const PrayerCountdown = memo(PrayerCountdownComponent);
