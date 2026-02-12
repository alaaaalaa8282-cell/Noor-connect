import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar } from "@/components/AppBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Moon, Sun, CheckCircle, TrendingUp, AlertCircle, ArrowLeft, MapPin, Clock, RefreshCw, Flame, Check, BookOpen, Minus, Plus } from "lucide-react";
import { LayoutManager } from "@/components/LayoutManager";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLocationState } from "@/lib/location-state";
import { AladhanAPI } from "@/lib/aladhan-api";

const RAMADAN_STORAGE = 'ramadan-data';

interface RamadanData {
  fastingDays: string[]; // Array of date strings
  quranProgress: number; // Pages read (out of 604)
  dailyQuranGoal: number;
  startDate: string; // Ramadan start date
}

export default function RamadanMode() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [suhoorTime, setSuhoorTime] = useState<string>("");
  const [iftarTime, setIftarTime] = useState<string>("");
  const [nextEvent, setNextEvent] = useState<{ name: string; time: string; countdown: string } | null>(null);
  const [loadingTimes, setLoadingTimes] = useState(true);
  const [isRamadanMode, setIsRamadanMode] = useState(false);
  const [data, setData] = useState<RamadanData>({
    fastingDays: [],
    quranProgress: 0,
    dailyQuranGoal: 20,
    startDate: new Date().toISOString()
  });
  const [currentDay, setCurrentDay] = useState(1);
  const [todayFasted, setTodayFasted] = useState(false);

  // Global location state
  const location = useLocationState();

  useEffect(() => {
    // Load saved data
    const saved = localStorage.getItem(RAMADAN_STORAGE);
    if (saved) {
      const parsed = JSON.parse(saved) as RamadanData;
      setData(parsed);

      // Calculate current day
      const start = new Date(parsed.startDate);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setCurrentDay(Math.max(1, Math.min(30, diff)));

      // Check if today is fasted
      setTodayFasted(parsed.fastingDays.includes(now.toDateString()));
    }

    // Load dynamic prayer times
    loadRamadanTimes();
  }, []);

  const loadRamadanTimes = async () => {
    setLoadingTimes(true);
    try {
      // Check if we have cached data
      const hasValidCache = AladhanAPI.isCachedDataValid();

      if (!hasValidCache) {
        // Fetch fresh data for current month
        await AladhanAPI.fetchMonthlyCalendar(
          location.latitude,
          location.longitude,
          undefined,
          undefined,
          1 // Pakistan/Karachi method
        );
      }

      // Get today's prayer times
      const result = await AladhanAPI.getTodaysPrayerTimes(location.latitude, location.longitude, 1);
      const timings = result.timings;

      // Force display Suhoor and Iftar even if not Ramadan
      setSuhoorTime(formatTime(timings.Imsak || timings.Fajr));
      setIftarTime(formatTime(timings.Maghrib));
      setIsRamadanMode(true); // Force enable for testing

      // Get countdown to next event
      const countdown = await AladhanAPI.getNextEventCountdown(
        location.latitude,
        location.longitude,
        1,
        true // Ramadan mode
      );
      setNextEvent(countdown);
    } catch (error) {
      console.error('Failed to load Ramadan times:', error);
      // Fallback to offline calculation
      const { calculatePrayerTimes } = await import('@/lib/prayer-calculator');
      const times = calculatePrayerTimes(location.latitude, location.longitude, new Date());

      setSuhoorTime(formatTimeFromDate(times.fajr));
      setIftarTime(formatTimeFromDate(times.maghrib));
      setIsRamadanMode(true); // Still enable for testing
    } finally {
      setLoadingTimes(false);
    }
  };

  // Helper function to format time from API
  const formatTime = (timeStr: string): string => {
    const cleaned = timeStr.replace(/\s*\(.*?\)\s*/g, '').trim();
    const [hours, minutes] = cleaned.split(':').map(Number);
    const date = new Date();
    if (isNaN(hours) || isNaN(minutes)) return '--:--';
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to format Date to time string
  const formatTimeFromDate = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Initialize prayer times when location changes
  useEffect(() => {
    if (location.latitude && location.longitude) {
      loadRamadanTimes();
    }
  }, [location.latitude, location.longitude]);

  // Update countdown every second
  useEffect(() => {
    if (!isRamadanMode) return;

    const updateCountdown = async () => {
      try {
        if (location.latitude && location.longitude) {
          const countdown = await AladhanAPI.getNextEventCountdown(
            location.latitude,
            location.longitude,
            1,
            true
          );
          setNextEvent(countdown);
        }
      } catch (error) {
        console.error('Failed to update countdown:', error);
      }
    };

    const interval = setInterval(updateCountdown, 1000); // Update every second
    return () => clearInterval(interval);
  }, [isRamadanMode, location.latitude, location.longitude]);

  const saveData = (newData: RamadanData) => {
    setData(newData);
    localStorage.setItem(RAMADAN_STORAGE, JSON.stringify(newData));
  };

  const toggleTodayFast = () => {
    const today = new Date().toDateString();
    let newFastingDays = [...data.fastingDays];

    if (todayFasted) {
      newFastingDays = newFastingDays.filter(d => d !== today);
      setTodayFasted(false);
    } else {
      newFastingDays.push(today);
      setTodayFasted(true);
    }

    saveData({ ...data, fastingDays: newFastingDays });
    toast({ title: todayFasted ? "Fast unmarked" : "Fast recorded! Mubarak!" });
  };

  const updateQuranProgress = (delta: number) => {
    const newProgress = Math.max(0, Math.min(604, data.quranProgress + delta));
    saveData({ ...data, quranProgress: newProgress });
  };

  const quranPercentage = (data.quranProgress / 604) * 100;
  const juzCompleted = Math.floor(data.quranProgress / 20);
  const fastingPercentage = (data.fastingDays.length / 30) * 100;

  const resetRamadan = () => {
    const newData: RamadanData = {
      fastingDays: [],
      quranProgress: 0,
      dailyQuranGoal: 20,
      startDate: new Date().toISOString()
    };
    saveData(newData);
    setCurrentDay(1);
    setTodayFasted(false);
    toast({ title: "Ramadan tracker reset" });
  };

  return (
    <LayoutManager>
      <div className="min-h-screen bg-background">
        <AppBar title="Ramadan Mode" />

        <div className="max-w-lg mx-auto p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold font-arabic">رمضان مبارك</h1>
              <p className="text-sm text-muted-foreground">Ramadan Mubarak</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">Day {currentDay}</p>
              <p className="text-xs text-muted-foreground">of 30</p>
            </div>
          </div>

          {/* Location Info */}
          <Card className="p-3 bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Location: {location.locationName}</span>
            </div>
          </Card>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/5 border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Moon className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Suhoor Ends</p>
                    <p className="text-xl font-bold">
                      {loadingTimes ? "--:--" : suhoorTime || "--:--"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/5 border-orange-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Sun className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Iftar Time</p>
                    <p className="text-xl font-bold">
                      {loadingTimes ? "--:--" : iftarTime || "--:--"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Next Event Countdown */}
            {nextEvent && (
              <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">{nextEvent.name}</p>
                      <p className="text-xs text-muted-foreground">in {nextEvent.countdown}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{nextEvent.time}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={loadRamadanTimes}
              disabled={loadingTimes}
            >
              {loadingTimes ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating Times...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Prayer Times
                </>
              )}
            </Button>
          </div>

          {/* Fasting Tracker */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                <span className="font-medium">Fasting Progress</span>
              </div>
              <span className="text-sm text-muted-foreground">{data.fastingDays.length}/30 days</span>
            </div>

            <Progress value={fastingPercentage} className="h-3" />

            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 30 }).map((_, i) => {
                const dayDate = new Date(data.startDate);
                dayDate.setDate(dayDate.getDate() + i);
                const isFasted = data.fastingDays.includes(dayDate.toDateString());
                const isToday = i + 1 === currentDay;

                return (
                  <div
                    key={i}
                    className={`aspect-square rounded flex items-center justify-center text-xs font-medium ${isFasted
                      ? 'bg-green-500 text-white'
                      : isToday
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-muted'
                      }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>

            <Button
              className="w-full"
              variant={todayFasted ? "outline" : "default"}
              onClick={toggleTodayFast}
            >
              {todayFasted ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Today Fasted ✓
                </>
              ) : (
                "Mark Today as Fasted"
              )}
            </Button>
          </Card>

          {/* Quran Reading Tracker */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-medium">Quran Reading</span>
              </div>
              <span className="text-sm text-muted-foreground">Juz {juzCompleted}/30</span>
            </div>

            <Progress value={quranPercentage} className="h-3" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">{data.quranProgress}</p>
                <p className="text-xs text-muted-foreground">pages read (of 604)</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuranProgress(-1)}
                  disabled={data.quranProgress <= 0}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuranProgress(1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="default"
                  onClick={() => updateQuranProgress(data.dailyQuranGoal)}
                >
                  +{data.dailyQuranGoal}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Daily goal: {data.dailyQuranGoal} pages ({Math.round(604 / 30)} pages/day to finish)
            </p>
          </Card>

          {/* Calendar View */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium">Ramadan Calendar</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-xs text-muted-foreground font-medium py-1">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Calculate starting day offset */}
              {Array.from({ length: new Date(data.startDate).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: 30 }).map((_, i) => {
                const dayDate = new Date(data.startDate);
                dayDate.setDate(dayDate.getDate() + i);
                const isFasted = data.fastingDays.includes(dayDate.toDateString());
                const isToday = i + 1 === currentDay;

                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-full flex items-center justify-center text-xs ${isFasted
                      ? 'bg-green-500 text-white'
                      : isToday
                        ? 'bg-primary text-primary-foreground'
                        : i + 1 < currentDay
                          ? 'bg-muted text-muted-foreground'
                          : 'text-foreground'
                      }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Reset */}
          <Button variant="outline" className="w-full" onClick={resetRamadan}>
            Reset Ramadan Tracker
          </Button>
        </div>
      </div>
    </LayoutManager>
  );
}
