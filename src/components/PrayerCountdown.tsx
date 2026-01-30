import { useState, useEffect } from "react";
import { Clock, Moon, Sun, Cloud, Sunset, CloudMoon, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getPrayerSettings } from "@/lib/storage";
import { calculatePrayerTimes, getNextPrayer } from "@/lib/prayer-calculator";
import { useCountdown } from "@/hooks/use-countdown";
import { 
  calculatePrayerEndTimes, 
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
  const [currentPrayer, setCurrentPrayer] = useState<PrayerWithEndTime | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerWithEndTime | null>(null);
  const [prayersWithEndTimes, setPrayersWithEndTimes] = useState<PrayerWithEndTime[]>([]);

  const currentPrayerCountdown = currentPrayer ? useCountdown(currentPrayer.endTime) : null;
  const nextPrayerCountdown = nextPrayer ? useCountdown(nextPrayer.datetime) : null;

  useEffect(() => {
    const updatePrayerData = () => {
      const settings = getPrayerSettings();
      if (settings.latitude && settings.longitude) {
        // Get today's prayer times
        const todayPrayers = calculatePrayerTimes(settings.latitude, settings.longitude);
        
        // Get tomorrow's prayer times for Isha end time calculation
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowPrayers = calculatePrayerTimes(settings.latitude, settings.longitude, tomorrow);
        
        // Convert to PrayerSchedule format
        const prayerSchedule = {
          fajr: { name: 'Fajr', time: formatTime(todayPrayers.fajr), datetime: todayPrayers.fajr },
          sunrise: { name: 'Sunrise', time: formatTime(todayPrayers.sunrise), datetime: todayPrayers.sunrise },
          dhuhr: { name: 'Dhuhr', time: formatTime(todayPrayers.dhuhr), datetime: todayPrayers.dhuhr },
          asr: { name: 'Asr', time: formatTime(todayPrayers.asr), datetime: todayPrayers.asr },
          maghrib: { name: 'Maghrib', time: formatTime(todayPrayers.maghrib), datetime: todayPrayers.maghrib },
          isha: { name: 'Isha', time: formatTime(todayPrayers.isha), datetime: todayPrayers.isha }
        };
        
        const tomorrowSchedule = {
          fajr: { name: 'Fajr', time: formatTime(tomorrowPrayers.fajr), datetime: tomorrowPrayers.fajr }
        };
        
        // Calculate end times
        const prayersWithEnds = calculatePrayerEndTimes(prayerSchedule, tomorrowSchedule);
        setPrayersWithEndTimes(prayersWithEnds);
        
        // Get current and next prayers
        const current = getCurrentPrayer(prayersWithEnds);
        const next = getNextPrayerWithEnd(prayersWithEnds);
        
        setCurrentPrayer(current);
        setNextPrayer(next);
      }
    };

    updatePrayerData();
    const interval = setInterval(updatePrayerData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Show current prayer countdown if available, otherwise show next prayer
  const displayPrayer = currentPrayer || nextPrayer;
  const isCurrentPrayer = !!currentPrayer;
  const countdown = isCurrentPrayer ? currentPrayerCountdown : nextPrayerCountdown;
  const isEndingSoon = currentPrayer && isPrayerEndingSoon(currentPrayer);

  if (!displayPrayer || !countdown) {
    return null; // Don't show anything while calculating
  }

  const getAlertColor = () => {
    if (!isCurrentPrayer) return 'text-primary';
    if (countdown.totalSeconds <= 300) return 'text-red-500'; // Less than 5 minutes
    if (countdown.totalSeconds <= 600) return 'text-orange-500'; // Less than 10 minutes
    return 'text-primary';
  };

  const getAlertBgColor = () => {
    if (!isCurrentPrayer) return 'bg-primary/10';
    if (countdown.totalSeconds <= 300) return 'bg-red-100'; // Less than 5 minutes
    if (countdown.totalSeconds <= 600) return 'bg-orange-100'; // Less than 10 minutes
    return 'bg-primary/10';
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <div 
        className={`absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent transition-all duration-1000 ${isEndingSoon ? 'from-orange-100/20 to-transparent' : ''}`}
        style={{ width: `${isCurrentPrayer ? Math.max(0, 100 - (countdown.totalSeconds / 3600) * 100) : 0}%` }}
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
              {countdown.formattedTime}
            </p>
            <p className="text-xs text-muted-foreground">
              {isCurrentPrayer 
                ? displayPrayer.datetime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })
                : displayPrayer.datetime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })
              }
            </p>
          </div>
        </div>
        
        {/* Show additional info for current prayer */}
        {isCurrentPrayer && (
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
