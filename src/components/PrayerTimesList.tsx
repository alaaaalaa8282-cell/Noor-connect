import { useState, useEffect } from "react";
import { Clock, Moon, Sun, Cloud, Sunset, CloudMoon, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationSearch } from "@/components/LocationSearch";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useCountdown } from "@/hooks/use-countdown";
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

  return (
    <Card className={`transition-all duration-300 ${getStatusColor()} ${getBgColor()} ${
      isCurrent ? 'shadow-md scale-[1.02]' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isCurrent ? 'bg-primary/20 text-primary' : 'bg-muted'
            }`}>
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
                  {formatTime(prayer.datetime)}
                </span>
                <span className="text-xs text-muted-foreground">
                  → Ends at {prayer.endTimeFormatted}
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
                Started at {formatTime(prayer.datetime)}
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

export function PrayerTimesList() {
  const { prayerTimesWithEnd, location, isLoading, error, needsManualLocation, refresh, setManualLocation } = usePrayerTimes();
  
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

  // Enhanced loading skeleton to prevent CLS
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Prayer Times</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Determining location...</span>
          </div>
        </div>
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 w-16 bg-muted rounded mb-2" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-12 bg-muted rounded mb-1" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
}
