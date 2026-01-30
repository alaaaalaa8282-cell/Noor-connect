import { useState, useEffect } from "react";
import { Clock, Moon, Sun, Cloud, Sunset, CloudMoon, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getPrayerSettings } from "@/lib/storage";
import { calculatePrayerTimes } from "@/lib/prayer-calculator";
import { useCountdown } from "@/hooks/use-countdown";
import { 
  calculatePrayerEndTimes, 
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
  const [prayersWithEndTimes, setPrayersWithEndTimes] = useState<PrayerWithEndTime[]>([]);
  const [currentPrayer, setCurrentPrayer] = useState<PrayerWithEndTime | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerWithEndTime | null>(null);

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
        const next = prayersWithEnds.find(p => 
          p.datetime > new Date() && p !== current
        );
        
        setCurrentPrayer(current);
        setNextPrayer(next || null);
      }
    };

    updatePrayerData();
    const interval = setInterval(updatePrayerData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (prayersWithEndTimes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground mb-4">Prayer Times</h2>
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
