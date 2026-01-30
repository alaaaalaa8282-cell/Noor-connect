import { useState, useEffect } from "react";
import { Clock, Moon, Sun, Cloud, Sunset, CloudMoon, AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useCountdown } from "@/hooks/use-countdown";
import { 
  getCurrentPrayer, 
  getNextPrayer as getNextPrayerWithEnd,
  isPrayerEndingSoon,
  formatTime,
  type PrayerWithEndTime 
} from "@/lib/prayer-end-times";

const prayerIcons: Record<string, React.ReactNode> = {
  Fajr: <Moon className="w-6 h-6" />,
  Dhuhr: <Sun className="w-6 h-6" />,
  Asr: <Cloud className="w-6 h-6" />,
  Maghrib: <Sunset className="w-6 h-6" />,
  Isha: <CloudMoon className="w-6 h-6" />,
};

export function PrayerCountdown() {
  const { prayerTimesWithEnd, location, isLoading, error } = usePrayerTimes();
  
  // Convert to PrayerWithEndTime format for compatibility
  const prayersWithEndTimes: PrayerWithEndTime[] = prayerTimesWithEnd ? [
    {
      name: 'Fajr',
      time: formatTime(prayerTimesWithEnd.fajr.start),
      datetime: prayerTimesWithEnd.fajr.start,
      endTime: prayerTimesWithEnd.fajr.end,
      endTimeFormatted: formatTime(prayerTimesWithEnd.fajr.end)
    },
    {
      name: 'Sunrise',
      time: formatTime(prayerTimesWithEnd.sunrise.start),
      datetime: prayerTimesWithEnd.sunrise.start,
      endTime: prayerTimesWithEnd.sunrise.end,
      endTimeFormatted: formatTime(prayerTimesWithEnd.sunrise.end)
    },
    {
      name: 'Dhuhr',
      time: formatTime(prayerTimesWithEnd.dhuhr.start),
      datetime: prayerTimesWithEnd.dhuhr.start,
      endTime: prayerTimesWithEnd.dhuhr.end,
      endTimeFormatted: formatTime(prayerTimesWithEnd.dhuhr.end)
    },
    {
      name: 'Asr',
      time: formatTime(prayerTimesWithEnd.asr.start),
      datetime: prayerTimesWithEnd.asr.start,
      endTime: prayerTimesWithEnd.asr.end,
      endTimeFormatted: formatTime(prayerTimesWithEnd.asr.end)
    },
    {
      name: 'Maghrib',
      time: formatTime(prayerTimesWithEnd.maghrib.start),
      datetime: prayerTimesWithEnd.maghrib.start,
      endTime: prayerTimesWithEnd.maghrib.end,
      endTimeFormatted: formatTime(prayerTimesWithEnd.maghrib.end)
    },
    {
      name: 'Isha',
      time: formatTime(prayerTimesWithEnd.isha.start),
      datetime: prayerTimesWithEnd.isha.start,
      endTime: prayerTimesWithEnd.isha.end,
      endTimeFormatted: formatTime(prayerTimesWithEnd.isha.end)
    }
  ] : [];

  const currentPrayer = getCurrentPrayer(prayersWithEndTimes);
  const nextPrayer = prayersWithEndTimes.find(p => 
    p.datetime > new Date() && p !== currentPrayer
  );

  const currentPrayerCountdown = currentPrayer ? useCountdown(currentPrayer.endTime) : null;
  const nextPrayerCountdown = nextPrayer ? useCountdown(nextPrayer.datetime) : null;

  // Enhanced loading skeleton to prevent CLS
  if (isLoading) {
    return (
      <Card className="overflow-hidden border-primary/20">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
              <div className="flex-1">
                <div className="h-5 w-24 bg-muted rounded mb-2 animate-pulse" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-6 w-20 bg-muted rounded mb-1 animate-pulse" />
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Determining your location...</span>
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <div className="p-4">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-medium">Failed to load prayer times</p>
              <p className="text-sm">{error}</p>
              {location && (
                <p className="text-xs mt-1">
                  📍 {location.city && location.country ? `${location.city}, ${location.country}` : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!currentPrayer && !nextPrayer) {
    return null;
  }

  // Show current prayer countdown if available, otherwise show next prayer
  const displayPrayer = currentPrayer || nextPrayer;
  const isCurrentPrayer = !!currentPrayer;
  const countdown = isCurrentPrayer ? currentPrayerCountdown : nextPrayerCountdown;
  const isEndingSoon = currentPrayer && isPrayerEndingSoon(currentPrayer);

  const getAlertColor = () => {
    if (!isCurrentPrayer || !countdown) return 'text-primary';
    if (countdown.totalSeconds <= 300) return 'text-red-500'; // Less than 5 minutes
    if (countdown.totalSeconds <= 600) return 'text-orange-500'; // Less than 10 minutes
    return 'text-primary';
  };

  const getAlertBgColor = () => {
    if (!isCurrentPrayer || !countdown) return 'bg-primary/10';
    if (countdown.totalSeconds <= 300) return 'bg-red-100'; // Less than 5 minutes
    if (countdown.totalSeconds <= 600) return 'bg-orange-100'; // Less than 10 minutes
    return 'bg-primary/10';
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <div 
        className={`absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent transition-all duration-1000 ${isEndingSoon ? 'from-orange-100/20 to-transparent' : ''}`}
        style={{ width: `${isCurrentPrayer && countdown ? Math.max(0, 100 - (countdown.totalSeconds / 3600) * 100) : 0}%` }}
      />
      <div className="relative p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${getAlertBgColor()} flex items-center justify-center ${getAlertColor()}`}>
              {isEndingSoon && <AlertTriangle className="w-6 h-6" />}
              {!isEndingSoon && (prayerIcons[displayPrayer.name] || <Clock className="w-6 h-6" />)}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {isCurrentPrayer ? 'Current Prayer' : 'Next Prayer'}
              </p>
              <p className="text-lg font-bold text-foreground">{displayPrayer.name}</p>
              {isCurrentPrayer && (
                <p className="text-xs text-muted-foreground">
                  Ends at {displayPrayer.endTimeFormatted}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-mono font-bold ${getAlertColor()}`}>
              {countdown?.formattedTime || 'Loading...'}
            </p>
            <p className="text-xs text-muted-foreground">
              {displayPrayer.datetime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </p>
          </div>
        </div>
        
        {/* Show additional info for current prayer */}
        {isCurrentPrayer && countdown && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Started at {formatTime(displayPrayer.datetime)}
              </span>
              <span className={`font-medium ${getAlertColor()}`}>
                {isEndingSoon ? 'Ending soon!' : `${Math.floor(countdown.totalSeconds / 60)} minutes remaining`}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
