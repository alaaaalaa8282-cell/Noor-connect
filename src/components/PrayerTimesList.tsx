import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Clock, Moon, Sun, Cloud, Sunset, CloudMoon, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationSearch } from "@/components/LocationSearch";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import type { LocationData, PrayerTimesWithEnd } from "@/hooks/usePrayerTimes";
import { useCountdown } from "@/hooks/use-countdown";
import { getTimeFormat, formatPrayerTime } from "@/lib/time-formatter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getShowExtraPrayers, setShowExtraPrayers } from "@/lib/storage";
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
  Imsak: <Clock className="w-5 h-5" />,
  Ishraq: <Sun className="w-5 h-5 text-orange-400" />,
  Duha: <Sun className="w-5 h-5 text-yellow-500" />,
  Tahajjud: <Moon className="w-5 h-5 text-indigo-400" />,
  Midnight: <CloudMoon className="w-5 h-5" />,
};

interface PrayerTimeCardProps {
  prayer: PrayerWithEndTime;
  isCurrent: boolean;
  isNext: boolean;
  timeZone?: string;
}

const PrayerTimeCard: React.FC<PrayerTimeCardProps> = ({ prayer, isCurrent, isNext, timeZone }) => {
  const { t } = useLanguage();
  const status = getPrayerStatus(prayer);
  const countdown = useCountdown(prayer.endTime);
  const isEndingSoon = isCurrent && isPrayerEndingSoon(prayer);
  const timeFormat = getTimeFormat();

  // Premium Styles
  const containerClasses = isCurrent
    ? "bg-gradient-to-r from-primary/15 to-transparent border-primary/40 shadow-[0_0_15px_-3px_rgba(212,175,55,0.3)] ring-1 ring-primary/20 dark:shadow-[0_0_20px_-5px_rgba(212,175,55,0.2)]"
    : isNext
      ? "bg-secondary/30 border-secondary/50 shadow-sm"
      : "bg-card/50 border-transparent hover:bg-accent/30 hover:border-border/50";

  return (
    <div className={`relative overflow-hidden rounded-xl border p-3.5 transition-all duration-300 group ${containerClasses}`}>
      {/* Active Indicator Bar */}
      {isCurrent && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                ${isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}
             `}>
            {prayerIcons[prayer.name] || <Clock className="w-4 h-4" />}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold text-sm ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                {t(prayer.name.toLowerCase() as any)}
              </h3>
              {isCurrent && (
                <span className={`flex h-1.5 w-1.5 rounded-full animate-pulse ${isEndingSoon ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-primary shadow-[0_0_8px_rgba(212,175,55,0.6)]'}`} />
              )}
            </div>
            {isNext && !isCurrent && <span className="text-[10px] font-medium text-blue-500">{t('upcoming')}</span>}
          </div>
        </div>

        <div className="text-right">
          <div className={`font-mono font-medium text-sm ${isCurrent ? 'text-primary font-bold' : ''}`}>
            {formatPrayerTime(prayer.datetime, timeFormat, timeZone)}
          </div>

          {/* Countdown for current prayer */}
          {isCurrent && countdown ? (
            <div className="text-[10px] font-medium text-red-500 tabular-nums">
              - {countdown.formattedTime}
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground opacity-70">
              {formatPrayerTime(prayer.endTime, timeFormat, timeZone)} {t('end')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export interface PrayerTimesListProps {
  timings?: PrayerTimesWithEnd | null;
  location?: LocationData | null;
  isLoading?: boolean;
  error?: string | null;
  needsManualLocation?: boolean;
  refresh?: () => Promise<void>;
  setManualLocation?: (city: string, country: string) => Promise<void>;
  timeZone?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const PrayerTimesListComponent = function PrayerTimesList(props: PrayerTimesListProps) {
  const { t } = useLanguage();
  const prayerTimesHook = usePrayerTimes();
  const prayerTimesWithEnd = props.timings ?? prayerTimesHook.prayerTimesWithEnd;
  const location = props.location ?? prayerTimesHook.location;
  const isLoading = props.isLoading ?? prayerTimesHook.isLoading;
  const error = props.error ?? prayerTimesHook.error;
  const needsManualLocation = props.needsManualLocation ?? prayerTimesHook.needsManualLocation;
  const refresh = props.refresh ?? prayerTimesHook.refresh;
  const setManualLocation = props.setManualLocation ?? prayerTimesHook.setManualLocation;

  const [showExtra, setShowExtra] = useState(getShowExtraPrayers());

  const handleToggleExtra = (val: boolean) => {
    setShowExtra(val);
    setShowExtraPrayers(val);
  };

  // Get current time format preference
  const timeFormat = getTimeFormat();

  // Convert to PrayerWithEndTime format for compatibility
  const prayersWithEndTimes: PrayerWithEndTime[] = [];

  if (prayerTimesWithEnd) {
    // Standard Prayers
    prayersWithEndTimes.push(
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
    );

    // Optional Prayers (if enabled)
    if (showExtra) {
      if (prayerTimesWithEnd.imsak) {
        prayersWithEndTimes.push({
          name: 'Imsak',
          time: formatPrayerTime(prayerTimesWithEnd.imsak.start, timeFormat, props.timeZone),
          datetime: prayerTimesWithEnd.imsak.start,
          endTime: prayerTimesWithEnd.imsak.end,
          endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.imsak.end, timeFormat, props.timeZone)
        });
      }
      if (prayerTimesWithEnd.ishraq) {
        prayersWithEndTimes.push({
          name: 'Ishraq',
          time: formatPrayerTime(prayerTimesWithEnd.ishraq.start, timeFormat, props.timeZone),
          datetime: prayerTimesWithEnd.ishraq.start,
          endTime: prayerTimesWithEnd.ishraq.end,
          endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.ishraq.end, timeFormat, props.timeZone)
        });
      }
      if (prayerTimesWithEnd.duha) {
        prayersWithEndTimes.push({
          name: 'Duha',
          time: formatPrayerTime(prayerTimesWithEnd.duha.start, timeFormat, props.timeZone),
          datetime: prayerTimesWithEnd.duha.start,
          endTime: prayerTimesWithEnd.duha.end,
          endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.duha.end, timeFormat, props.timeZone)
        });
      }
      if (prayerTimesWithEnd.tahajjud) {
        prayersWithEndTimes.push({
          name: 'Tahajjud',
          time: formatPrayerTime(prayerTimesWithEnd.tahajjud.start, timeFormat, props.timeZone),
          datetime: prayerTimesWithEnd.tahajjud.start,
          endTime: prayerTimesWithEnd.tahajjud.end,
          endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.tahajjud.end, timeFormat, props.timeZone)
        });
      }
      if (prayerTimesWithEnd.midnight) {
        prayersWithEndTimes.push({
          name: 'Midnight',
          time: formatPrayerTime(prayerTimesWithEnd.midnight.start, timeFormat, props.timeZone),
          datetime: prayerTimesWithEnd.midnight.start,
          endTime: prayerTimesWithEnd.midnight.end,
          endTimeFormatted: formatPrayerTime(prayerTimesWithEnd.midnight.end, timeFormat, props.timeZone)
        });
      }

      // Sort by time
      prayersWithEndTimes.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
    }
  }

  const currentPrayer = getCurrentPrayer(prayersWithEndTimes);
  const nextPrayer = prayersWithEndTimes.find(p =>
    p.datetime > new Date() && p !== currentPrayer && p.name !== 'Sunrise'
  );

  // Show manual location search when needed
  if (needsManualLocation) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t('todaysPrayers')}</h2>
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
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t('todaysPrayers')}</h2>
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
          <h2 className="text-lg font-semibold text-foreground">{t('todaysPrayers')}</h2>
          {location && (
            <div className="text-xs text-muted-foreground">
              📍 {location.city && location.country ? `${location.city}, ${location.country}` : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
              <span className="ml-2 px-2 py-1 bg-muted rounded">
                {location.source === 'geolocation' ? '🛰️ GPS' : location.source === 'default' ? '🏛️ Default' : '🔍 Manual'}
              </span>
            </div>
          )}
        </div>
        <Card className="border-red-200 bg-red-50 min-h-[80px]">
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
    <motion.div
      className="space-y-3 min-h-[600px]"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col gap-4 mb-4">
        {/* ... header content ... */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t('todaysPrayers')}</h2>
          {location && (
            <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
              📍 {location.city || location.latitude.toFixed(2)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-accent/20 p-3 rounded-xl border border-border/50">
          <div className="flex flex-col">
            <Label htmlFor="extra-prayers" className="text-sm font-medium cursor-pointer">
              {t('showExtraPrayers')}
            </Label>
            <span className="text-[10px] text-muted-foreground">Ishraq, Duha, Tahajjud...</span>
          </div>
          <Switch
            id="extra-prayers"
            checked={showExtra}
            onCheckedChange={handleToggleExtra}
          />
        </div>
      </div>
      {prayersWithEndTimes.map((prayer) => (
        <motion.div key={prayer.name} variants={item}>
          <PrayerTimeCard
            prayer={prayer}
            isCurrent={currentPrayer?.name === prayer.name}
            isNext={nextPrayer?.name === prayer.name}
            timeZone={props.timeZone}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const PrayerTimesList = memo(PrayerTimesListComponent);
