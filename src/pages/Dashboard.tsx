import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Moon, Sun, Sunset, Cloud, CloudMoon, Calendar, BookOpen, Navigation, Calculator, Trophy, Star, Search, Loader2, Compass } from "lucide-react";
import { AppBar } from "@/components/AppBar";
import { SalahTracker } from "@/components/SalahTracker";
import { WeeklySalahChart } from "@/components/WeeklySalahChart";
import { QazaTracker } from "@/components/QazaTracker";
import { DailyAyah } from "@/components/DailyAyah";
import { DailyHadith } from "@/components/DailyHadith";
import { DhikrReminder } from "@/components/DhikrReminder";
import { IslamicGreeting } from "@/components/IslamicGreeting";
import { LocationSearch } from "@/components/LocationSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Suspense, lazy } from "react";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { LayoutManager } from "@/components/LayoutManager";

// Dynamic imports for code splitting
const PrayerCountdown = lazy(() => import("@/components/PrayerCountdown").then(module => ({ default: module.PrayerCountdown })));
const PrayerTimesList = lazy(() => import("@/components/PrayerTimesList").then(module => ({ default: module.PrayerTimesList })));
import { getTimeFormat, formatTime, setTimeFormat } from "@/lib/time-formatter";
import { useLocationState } from "@/lib/location-state";
import { AladhanAPI } from "@/lib/aladhan-api";
import { localNotifications, type PrayerTime } from "@/lib/local-notifications";
import { useToast } from "@/hooks/use-toast";
import { LocationCardSkeleton, PrayerTimeSkeleton, CountdownCardSkeleton, LoadingSpinner } from "@/components/LoadingSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const prayerIcons: Record<string, React.ReactNode> = {
  Fajr: <Moon className="w-5 h-5" />,
  Dhuhr: <Sun className="w-5 h-5" />,
  Asr: <Cloud className="w-5 h-5" />,
  Maghrib: <Sunset className="w-5 h-5" />,
  Isha: <CloudMoon className="w-5 h-5" />,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [hijriDate, setHijriDate] = useState<string>("");
  const [timeFormat, setTimeFormat] = useState<'12' | '24'>('24');
  const [nextPrayerName, setNextPrayerName] = useState<string>("");
  const [nextEventCountdown, setNextEventCountdown] = useState<{ name: string; time: string; countdown: string } | null>(null);
  const [loadingAPI, setLoadingAPI] = useState(false);
  const [timezone, setTimezone] = useState<string>("");
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();

  // Global location state
  const location = useLocationState();

  const [showManualLocationDialog, setShowManualLocationDialog] = useState(false);



  // Visual feedback for clicks
  const handleCardClick = (cardName: string, route: string) => {


    // Visual feedback
    const card = event?.currentTarget as HTMLElement;
    if (card) {
      card.style.backgroundColor = 'hsl(var(--primary) / 0.2)';
      setTimeout(() => {
        card.style.backgroundColor = '';
      }, 200);
    }

    // Navigate
    navigate(route);
  };

  const prayerTimesHook = usePrayerTimes();

  const prayerLocation = prayerTimesHook.location;
  const locationLabel = prayerLocation?.city && prayerLocation?.country
    ? `${prayerLocation.city}, ${prayerLocation.country}`
    : location.locationName;

  useEffect(() => {
    setTimeFormat(getTimeFormat());
  }, [setTimeFormat]);

  // Helper function to format time from API using global formatter
  const formatTimeFromAPI = useCallback((timeStr: string): string => {
    return formatTime(timeStr, timeFormat);
  }, [timeFormat]);

  // Helper function to parse time string to Date
  const parseTimeToDate = useCallback((timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }, []);

  // Load prayer times using global location
  const loadPrayerTimes = useCallback(async () => {
    setLoadingAPI(true);

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

      // Get timezone from stored data
      const storedData = AladhanAPI.getStoredMonthlyData();
      if (storedData?.data?.length) {
        // Find today's data or fallback to first entry
        const today = storedData.data.find(d => {
          const apiDate = new Date(d.date.gregorian.date);
          return apiDate.toDateString() === new Date().toDateString();
        }) || storedData.data[0];

        if (today?.meta?.timezone) {
          setTimezone(today.meta.timezone);
        }
      }

      // Get today's prayer times
      const timings = await AladhanAPI.getTodaysPrayerTimes(location.latitude, location.longitude, 1);

      const prayerList: PrayerTime[] = [
        { name: "Fajr", time: formatTimeFromAPI(timings.Fajr), date: parseTimeToDate(timings.Fajr) },
        { name: "Dhuhr", time: formatTimeFromAPI(timings.Dhuhr), date: parseTimeToDate(timings.Dhuhr) },
        { name: "Asr", time: formatTimeFromAPI(timings.Asr), date: parseTimeToDate(timings.Asr) },
        { name: "Maghrib", time: formatTimeFromAPI(timings.Maghrib), date: parseTimeToDate(timings.Maghrib) },
        { name: "Isha", time: formatTimeFromAPI(timings.Isha), date: parseTimeToDate(timings.Isha) },
      ];

      setPrayers(prayerList);

      // Schedule prayer notifications
      await localNotifications.schedulePrayerNotifications(prayerList);

      // Get next prayer countdown
      const nextEvent = await AladhanAPI.getNextEventCountdown(location.latitude, location.longitude, 1, false);
      if (nextEvent) {
        setNextPrayerName(nextEvent.name);
        setNextEventCountdown(nextEvent);
      }
    } catch (error) {
      console.error('Failed to load API prayer times:', error);
      // Fallback to offline calculation
      const { calculatePrayerTimes, formatPrayerTime } = await import('@/lib/prayer-calculator');
      const times = calculatePrayerTimes(location.latitude, location.longitude, new Date());

      setPrayers([
        { name: "Fajr", time: formatTimeFromAPI(times.fajr.toTimeString().slice(0, 5)), date: times.fajr },
        { name: "Dhuhr", time: formatTimeFromAPI(times.dhuhr.toTimeString().slice(0, 5)), date: times.dhuhr },
        { name: "Asr", time: formatTimeFromAPI(times.asr.toTimeString().slice(0, 5)), date: times.asr },
        { name: "Maghrib", time: formatTimeFromAPI(times.maghrib.toTimeString().slice(0, 5)), date: times.maghrib },
        { name: "Isha", time: formatTimeFromAPI(times.isha.toTimeString().slice(0, 5)), date: times.isha },
      ]);

      // Schedule prayer notifications for fallback times
      await localNotifications.schedulePrayerNotifications([
        { name: "Fajr", time: formatTimeFromAPI(times.fajr.toTimeString().slice(0, 5)), date: times.fajr },
        { name: "Dhuhr", time: formatTimeFromAPI(times.dhuhr.toTimeString().slice(0, 5)), date: times.dhuhr },
        { name: "Asr", time: formatTimeFromAPI(times.asr.toTimeString().slice(0, 5)), date: times.asr },
        { name: "Maghrib", time: formatTimeFromAPI(times.maghrib.toTimeString().slice(0, 5)), date: times.maghrib },
        { name: "Isha", time: formatTimeFromAPI(times.isha.toTimeString().slice(0, 5)), date: times.isha },
      ]);

      const { getNextPrayer } = await import('@/lib/prayer-calculator');
      const nextPrayer = getNextPrayer(location.latitude, location.longitude);
      if (nextPrayer) {
        setNextPrayerName(nextPrayer.name);
      }
    } finally {
      setLoadingAPI(false);
      setInitialLoad(false);
    }
  }, [location.latitude, location.longitude, formatTimeFromAPI]); // Add dependencies

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    return () => clearInterval(timer);
  }, []);

  // Handle location detection
  const handleDetectLocation = async () => {
    const success = await location.detectLocation();
    if (success) {
      toast({ title: "Location detected", description: `Updated to ${location.locationName}` });
      // Reload prayer times with new location
      await loadPrayerTimes();
    } else {
      toast({ title: "Location detection failed", description: "Please enable location permissions", variant: "destructive" });
    }
  };

  // Initialize prayer times when location changes
  useEffect(() => {
    if (location.latitude && location.longitude) {
      loadPrayerTimes();
    }
  }, [location.latitude, location.longitude, timeFormat, loadPrayerTimes]); // Add loadPrayerTimes to dependencies

  // Memoize prayer cards to prevent re-renders during countdown updates
  const prayerCards = useMemo(() => {
    if (loadingAPI) {
      return Array.from({ length: 5 }).map((_, i) => (
        <PrayerTimeSkeleton key={`skeleton-${i}`} />
      ));
    }

    return prayers.map((prayer, index) => {
      const isNext = prayer.name === nextPrayerName;
      const icon = prayerIcons[prayer.name as keyof typeof prayerIcons];
      return (
        <div
          key={prayer.name}
          className="animate-slide-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <Card className={`p-3 border-0 transition-colors ${isNext ? "bg-primary text-primary-foreground" : "bg-card"
            }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isNext ? "bg-primary-foreground/20" : "bg-primary/10"
                }`}>
                <span className={isNext ? "" : "text-primary"}>{icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">{prayer.name}</h3>
                {isNext && <p className="text-xs opacity-80">Next Prayer</p>}
              </div>
              <div className="text-xl font-bold font-mono">
                {prayer.time}
              </div>
            </div>
          </Card>
        </div>
      );
    });
  }, [prayers, nextPrayerName, loadingAPI]);

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = async () => {
      try {
        if (location.latitude && location.longitude) {
          const nextEvent = await AladhanAPI.getNextEventCountdown(
            location.latitude,
            location.longitude,
            1,
            false
          );
          if (nextEvent) {
            setNextPrayerName(nextEvent.name);
            setNextEventCountdown(nextEvent);
          }
        }
      } catch (error) {
        console.error('Failed to update countdown:', error);
      }
    };

    const interval = setInterval(updateCountdown, 1000); // Update every second
    return () => clearInterval(interval);
  }, [location.latitude, location.longitude]);

  return (
    <LayoutManager>
      <div className="min-h-screen bg-background">
        <AppBar title="Noor Connect" />

        <div className="max-w-lg mx-auto p-4 space-y-4">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-6 animate-fade-in">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-2xl"></div>

            <div className="relative z-10 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  {greeting}!
                </h1>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              {locationLabel && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">
                    {locationLabel}
                  </span>
                  {prayerLocation?.source === 'manual' && (
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      Manual
                    </span>
                  )}
                  {prayerLocation?.source === 'default' && (
                    <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
                      Default
                    </span>
                  )}
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 blur-xl"></div>
                <div className="relative bg-card/50 backdrop-blur-sm rounded-xl border border-primary/20 px-6 py-3">
                  <div className="text-2xl font-mono font-bold text-primary tracking-wider">
                    {currentTime.toLocaleTimeString("en-US", {
                      hour: timeFormat === '12' ? 'numeric' : '2-digit',
                      minute: "2-digit",
                      hour12: timeFormat === '12',
                      timeZone: timezone || undefined
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hijri Date */}
          {hijriDate && (
            <Card className="p-3 bg-primary text-primary-foreground border-0">
              <p className="text-center font-arabic text-lg">{hijriDate}</p>
            </Card>
          )}

          {/* Islamic Greeting (shows on special days) */}
          <IslamicGreeting />

          {/* Prayer Countdown Widget */}
          <ErrorBoundary>
            <Suspense fallback={<div className="h-40 bg-muted/20 animate-pulse rounded-lg" />}>
              <PrayerCountdown
                timings={prayerTimesHook.prayerTimesWithEnd}
                location={prayerTimesHook.location}
                isLoading={prayerTimesHook.isLoading}
                error={prayerTimesHook.error}
                needsManualLocation={prayerTimesHook.needsManualLocation}
                refresh={prayerTimesHook.refresh}
                setManualLocation={prayerTimesHook.setManualLocation}
              />
            </Suspense>
          </ErrorBoundary>

          {/* Prayer Times List */}
          <ErrorBoundary>
            <Suspense fallback={<div className="space-y-3">
              <div className="h-6 bg-muted/20 animate-pulse rounded-lg w-32" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-lg" />
              ))}
            </div>}>
              <PrayerTimesList
                timings={prayerTimesHook.prayerTimesWithEnd}
                location={prayerTimesHook.location}
                isLoading={prayerTimesHook.isLoading}
                error={prayerTimesHook.error}
                needsManualLocation={prayerTimesHook.needsManualLocation}
                refresh={prayerTimesHook.refresh}
                setManualLocation={prayerTimesHook.setManualLocation}
              />
            </Suspense>
          </ErrorBoundary>

          {/* Daily Ayah */}
          <DailyAyah />

          {/* Daily Hadith */}
          <DailyHadith />

          {/* Dhikr Reminder */}
          <DhikrReminder />

          {/* Quick Access */}
          <div className="grid grid-cols-2 gap-3">
            <Card
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors interactive-layer"
              onClick={() => handleCardClick('Qibla Compass', '/qibla')}
            >
              <Compass className="w-6 h-6 text-primary mb-2" />
              <p className="font-medium text-sm">Qibla Compass</p>
              <p className="text-xs text-muted-foreground">Find prayer direction</p>
            </Card>
            <Card
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors interactive-layer"
              onClick={() => handleCardClick('Qaza Tracker', '/qaza')}
            >
              <Calendar className="w-6 h-6 text-primary mb-2" />
              <p className="font-medium text-sm">Qaza Tracker</p>
              <p className="text-xs text-muted-foreground">Manage missed prayers</p>
            </Card>
            <Card
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors interactive-layer"
              onClick={() => handleCardClick('Ramadan Mode', '/ramadan')}
            >
              <BookOpen className="w-6 h-6 text-primary mb-2" />
              <p className="font-medium text-sm">Ramadan Mode</p>
              <p className="text-xs text-muted-foreground">Fasting & Quran tracker</p>
            </Card>
            <Card
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors interactive-layer"
              onClick={() => handleCardClick('Zakat Calculator', '/zakat')}
            >
              <Calculator className="w-6 h-6 text-primary mb-2" />
              <p className="font-medium text-sm">Zakat Calculator</p>
              <p className="text-xs text-muted-foreground">Calculate your zakat</p>
            </Card>
            <Card
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors interactive-layer"
              onClick={() => handleCardClick('Islamic Quiz', '/quiz')}
            >
              <Trophy className="w-6 h-6 text-primary mb-2" />
              <p className="font-medium text-sm">Islamic Quiz</p>
              <p className="text-xs text-muted-foreground">Test your knowledge</p>
            </Card>
            <Card
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors col-span-2 interactive-layer"
              onClick={() => handleCardClick('99 Names of Allah', '/names-of-allah')}
            >
              <Star className="w-6 h-6 text-primary mb-2" />
              <p className="font-medium text-sm">99 Names of Allah</p>
              <p className="text-xs text-muted-foreground">Learn the beautiful names</p>
            </Card>
          </div>

          {/* Salah Tracker */}
          <SalahTracker />

          {/* Weekly Progress Chart */}
          <WeeklySalahChart />

          {/* Qaza Tracker (compact view) */}
          <QazaTracker compact />

          {/* Location Detection Card */}
          {initialLoad ? (
            <LocationCardSkeleton />
          ) : (
            <Card className="p-4 border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm">Location</h3>
                  <p className="text-xs text-muted-foreground">{location.locationName}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowManualLocationDialog(true)}
                    className="gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Manual
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDetectLocation}
                    disabled={location.isDetecting}
                    className="gap-2"
                  >
                    {location.isDetecting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        Detect Location
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}



          {/* Manual Location Dialog */}
          {showManualLocationDialog && (
            <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
              <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Set Manual Location</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManualLocationDialog(false)}
                    >
                      ×
                    </Button>
                  </div>
                  <LocationSearch
                    onLocationSelect={async (city, country) => {
                      await prayerTimesHook.setManualLocation(city, country);
                      setShowManualLocationDialog(false);
                      toast({
                        title: "Location Updated",
                        description: `Prayer times updated for ${city}, ${country}`
                      });
                    }}
                    isLoading={prayerTimesHook.isLoading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-center text-base text-primary">
                100% Private • Offline-first
              </CardTitle>
              <CardDescription className="text-center text-xs">
                No tracking • FOSS Architecture
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-center text-xs text-muted-foreground italic">
                "In the remembrance of Allah do hearts find rest." — 13:28
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutManager>
  );
}
