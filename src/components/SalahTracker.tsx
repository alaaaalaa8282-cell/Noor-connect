/**
 * Salah Tracker Component - 5 prayer checkboxes with streak
 * All data stored locally in localStorage
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Flame, Check } from "lucide-react";
import { 
  getTodayPrayers, 
  togglePrayer, 
  getSalahStats,
  type PrayerName,
  type DailyPrayers
} from "@/lib/salah-tracker";

const prayerNames: { id: PrayerName; label: string }[] = [
  { id: "fajr", label: "Fajr" },
  { id: "dhuhr", label: "Dhuhr" },
  { id: "asr", label: "Asr" },
  { id: "maghrib", label: "Maghrib" },
  { id: "isha", label: "Isha" },
];

export function SalahTracker() {
  const [prayers, setPrayers] = useState<DailyPrayers | null>(null);
  const [stats, setStats] = useState({ currentStreak: 0, longestStreak: 0, totalPrayers: 0, todayCompleted: 0 });

  useEffect(() => {
    setPrayers(getTodayPrayers());
    setStats(getSalahStats());
  }, []);

  const handleToggle = (prayer: PrayerName) => {
    togglePrayer(prayer);
    setPrayers(getTodayPrayers());
    setStats(getSalahStats());
  };

  if (!prayers) return null;

  const allComplete = stats.todayCompleted === 5;

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">Today's Salah</CardTitle>
          {stats.currentStreak > 0 && (
            <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              <Flame className="w-3 h-3" />
              <span className="font-semibold">{stats.currentStreak} Day Streak</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center justify-between gap-2">
          {prayerNames.map((prayer) => {
            const isChecked = prayers[prayer.id];
            return (
              <button
                key={prayer.id}
                onClick={() => handleToggle(prayer.id)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                    isChecked
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground group-hover:border-primary/50"
                  }`}
                >
                  {isChecked && <Check className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-medium ${isChecked ? "text-primary" : "text-muted-foreground"}`}>
                  {prayer.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Progress */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(stats.todayCompleted / 5) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{stats.todayCompleted}/5</span>
        </div>
        
        {allComplete && (
          <p className="text-center text-xs text-primary mt-3 font-medium">
            ✨ MashaAllah! All prayers completed today!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
