import { useState, useEffect } from "react";
import { Clock, Moon, Sun, Cloud, Sunset, CloudMoon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getPrayerSettings } from "@/lib/storage";
import { calculatePrayerTimes, getNextPrayer } from "@/lib/prayer-calculator";

const prayerIcons: Record<string, React.ReactNode> = {
  Fajr: <Moon className="w-6 h-6" />,
  Dhuhr: <Sun className="w-6 h-6" />,
  Asr: <Cloud className="w-6 h-6" />,
  Maghrib: <Sunset className="w-6 h-6" />,
  Isha: <CloudMoon className="w-6 h-6" />,
};

export function PrayerCountdown() {
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const [countdown, setCountdown] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateNextPrayer = () => {
      const settings = getPrayerSettings();
      if (settings.latitude && settings.longitude) {
        const next = getNextPrayer(settings.latitude, settings.longitude);
        setNextPrayer(next);
      }
    };

    updateNextPrayer();
    const interval = setInterval(updateNextPrayer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!nextPrayer) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextPrayer.time.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown("Now");
        setProgress(100);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }

      // Calculate progress (assuming max wait is 6 hours)
      const maxWait = 6 * 60 * 60 * 1000;
      const progressVal = Math.max(0, Math.min(100, ((maxWait - diff) / maxWait) * 100));
      setProgress(progressVal);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [nextPrayer]);

  if (!nextPrayer) {
    return null; // Don't show anything while calculating
  }

  return (
    <Card className="overflow-hidden border-primary/20">
      <div 
        className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent transition-all duration-1000"
        style={{ width: `${progress}%` }}
      />
      <div className="relative p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              {prayerIcons[nextPrayer.name] || <Clock className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Next Prayer</p>
              <p className="text-lg font-bold text-foreground">{nextPrayer.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-mono font-bold text-primary">{countdown}</p>
            <p className="text-xs text-muted-foreground">
              {nextPrayer.time.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
