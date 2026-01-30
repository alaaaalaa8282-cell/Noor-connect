import { useState, useEffect, memo } from "react";
import { Clock, Moon, Sun, Cloud, Sunset, CloudMoon, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationSearch } from "@/components/LocationSearch";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useCountdown } from "@/hooks/use-countdown";
import { getTimeFormat, formatPrayerTime } from "@/lib/time-formatter";
import { 
  getCurrentPrayer, 
  getPrayerStatus,
  isPrayerEndingSoon,
  formatTime,
  type PrayerWithEndTime 
} from "@/lib/prayer-end-times";

const prayerIcons: Record<string, React.ReactNode> = {
  Fajr: <Moon className="w-5 h-5" />,
  Dhuhr: <Sun className="w-5 h-5" />,
  Asr: <Cloud className="w-5 h-5" />,
  Maghrib: <Sunset className="w-5 h-5" />,
  Isha: <CloudMoon className="w-5 h-5" />,
};

interface PrayerTimeCardProps {
  prayer: PrayerWithEndTime;
  isCurrent: boolean;
  isNext: boolean;
}

const PrayerTimeCard: React.FC<PrayerTimeCardProps> = ({ prayer, isCurrent, isNext }) => {
  const status = getPrayerStatus(prayer);
  const countdown = isCurrent ? useCountdown(prayer.endTime) : null;
  const isEndingSoon = isCurrent && isPrayerEndingSoon(prayer);
  
  // Get current time format preference
  const timeFormat = getTimeFormat();

  const getStatusColor = () => {
    if (isCurrent) {
      if (countdown && countdown.totalSeconds <= 300) return 'text-red-500 border-red-200';
      if (countdown && countdown.totalSeconds <= 600) return 'text-orange-500 border-orange-200';
      return 'text-primary border-primary/30';
    }
    if (isNext) return 'text-blue-500 border-blue-200';
    return 'text-muted-foreground border-border/50';
  };

  const getBgColor = () => {
    if (isCurrent) {
      if (countdown && countdown.totalSeconds <= 300) return 'bg-red-50';
      if (countdown && countdown.totalSeconds <= 600) return 'bg-orange-50';
      return 'bg-primary/5';
    }
    if (isNext) return 'bg-blue-50';
    return 'bg-background';
  };

  const getCardGlow = () => {
    if (!isCurrent || !countdown) return '';
    if (countdown.totalSeconds <= 300) return 'shadow-red-500/50 shadow-xl animate-pulse'; // Red glow + pulse for less than 5 minutes
    if (countdown.totalSeconds <= 600) return 'shadow-orange-500/30 shadow-lg'; // Orange glow for less than 10 minutes
    return 'shadow-primary/30 shadow-md'; // Primary glow for current prayer
  };

  return (
    <Card className={`transition-all duration-300 ${getStatusColor()} ${getBgColor()} ${
      isCurrent ? 'scale-[1.02]' : ''
    } ${getCardGlow()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isCurrent ? 'bg-primary/20 text-primary' : 'bg-muted'
            } ${isCurrent && countdown && countdown.totalSeconds <= 300 ? 'animate-pulse' : ''}`}>
              {isCurrent && isEndingSoon && <AlertTriangle className="w-5 h-5" />}
              {(!isCurrent || !isEndingSoon) && (prayerIcons[prayer.name] || <Clock className="w-5 h-5" />)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${getStatusColor()}`}>
                  {prayer.name}
                </h3>
                {isCurrent && (
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                    Current
                  </span>
                )}
                {isNext && !isCurrent && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                    Next
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm font-mono">
                  {formatPrayerTime(prayer.datetime, timeFormat)}
                </span>
                <span className="text-xs text-muted-foreground">
                  → Ends at {formatPrayerTime(prayer.endTime, timeFormat)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            {isCurrent && countdown && (
              <div className={`text-lg font-mono font-bold ${getStatusColor()}`}>
                {countdown.formattedTime}
              </div>
            )}
            
            {status.status === 'upcoming' && status.timeUntilStart && (
              <div className="text-sm text-muted-foreground">
                in {Math.ceil(status.timeUntilStart / (1000 * 60))}m
              </div>
            )}
            
            {status.status === 'past' && (
              <div className="text-sm text-muted-foreground">
                Completed
              </div>
            )}
          </div>
        </div>
        
        {/* Additional info for current prayer */}
        {isCurrent && countdown && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Started at {formatPrayerTime(prayer.datetime, timeFormat)}
              </span>
              <span className={`font-medium ${getStatusColor()}`}>
                {isEndingSoon ? 'Ending soon!' : `${Math.floor(countdown.totalSeconds / 60)}m ${countdown.seconds}s left`}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PrayerTimesListComponent = function PrayerTimesList() {
  const { prayerTimesWithEnd, location, isLoading, error, needsManualLocation, refresh, setManualLocation } = usePrayerTimes();
  
  // Get current time format preference
  const timeFormat = getTimeFormat();
  
  // Convert to PrayerWithEndTime format for compatibility
  const prayersWithEndTimes: PrayerWithEndTime[] = prayerTimesWithEnd ? [
    {
      name: 'Fajr',
      time: formatPrayerTime(prayerTimesWithEnd.fajr.start, timeFormat),
      datetime: prayerTimesWithEnd.fajr.start,
      endTime: prayerTimesWithEnd.fajr.end,
      endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.fajr.end, timeFormat)
    },
    {
      name: 'Sunrise',
      time: formatPrayerTime(prayerTimesWithEnd.sunrise.start, timeFormat),
      datetime: prayerTimesWithEnd.sunrise.start,
      endTime: prayerTimesWithEnd.sunrise.end,
      endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.sunrise.end, timeFormat)
    },
    {
      name: 'Dhuhr',
      time: formatPrayerTime(prayerTimesWithEnd.dhuhr.start, timeFormat),
      datetime: prayerTimesWithEnd.dhuhr.start,
      endTime: prayerTimesWithEnd.dhuhr.end,
      endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.dhuhr.end, timeFormat)
    },
    {
      name: 'Asr',
      time: formatPrayerTime(prayerTimesWithEnd.asr.start, timeFormat),
      datetime: prayerTimesWithEnd.asr.start,
      endTime: prayerTimesWithEnd.asr.end,
      endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.asr.end, timeFormat)
    },
    {
      name: 'Maghrib',
      time: formatPrayerTime(prayerTimesWithEnd.maghrib.start, timeFormat),
      datetime: prayerTimesWithEnd.maghrib.start,
      endTime: prayerTimesWithEnd.maghrib.end,
      endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.maghrib.end, timeFormat)
    },
    {
      name: 'Isha',
      time: formatPrayerTime(prayerTimesWithEnd.isha.start, timeFormat),
      datetime: prayerTimesWithEnd.isha.start,
      endTime: prayerTimesWithEnd.isha.end,
      endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.isha.end, timeFormat)
    }
  ] : [];

  const currentPrayer = getCurrentPrayer(prayersWithEndTimes);
  const nextPrayer = prayersWithEndTimes.find(p => 
    p.datetime > new Date() && p !== currentPrayer
  );

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
                {location.source === 'geolocation' ? '🛰️ GPS' : location.source === 'ip' ? '🌐 IP' : location.source === 'default' ? '🏛️ Default' : '🔍 Manual'}
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
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Prayer Times</h2>
          <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="h-20"> {/* Fixed height to prevent CLS */}
              <Card className="h-full">
                <CardContent className="p-4 h-full">
                  <div className="flex items-center justify-between h-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted animate-pulse flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-5 w-20 bg-muted rounded mb-2 animate-pulse"></div>
                        <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="h-6 w-16 bg-muted rounded mb-1 animate-pulse"></div>
                      <div className="h-4 w-12 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state with location info
  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Prayer Times</h2>
          {location && (
            <div className="text-xs text-muted-foreground">
              📍 {location.city && location.country ? `${location.city}, ${location.country}` : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
              <span className="ml-2 px-2 py-1 bg-muted rounded">
                {location.source === 'geolocation' ? '🛰️ GPS' : location.source === 'ip' ? '🌐 IP' : location.source === 'default' ? '🏛️ Default' : '🔍 Manual'}
              </span>
            </div>
          )}
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <div className="flex-1">
                <p className="font-medium">Failed to load prayer times</p>
                <p className="text-sm">{error}</p>
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
          </CardContent>
        </Card>
      </div>
    );
  }

  if (prayersWithEndTimes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Prayer Times</h2>
        {location && (
          <div className="text-xs text-muted-foreground">
            📍 {location.city && location.country ? `${location.city}, ${location.country}` : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
            <span className="ml-2 px-2 py-1 bg-muted rounded">
              {location.source === 'geolocation' ? '🛰️ GPS' : location.source === 'ip' ? '🌐 IP' : location.source === 'default' ? '🏛️ Default' : '🔍 Manual'}
            </span>
          </div>
        )}
      </div>
      {prayersWithEndTimes.map((prayer) => (
        <PrayerTimeCard
          key={prayer.name}
          prayer={prayer}
          isCurrent={currentPrayer?.name === prayer.name}
          isNext={nextPrayer?.name === prayer.name}
        />
      ))}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const PrayerTimesList = memo(PrayerTimesListComponent);
