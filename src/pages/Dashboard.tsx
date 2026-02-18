import { useEffect, useState, useMemo, useCallback, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Moon, Sun, Sunset, Cloud, CloudMoon, Calendar, BookOpen, Navigation, Calculator, Trophy, Star, Search, Loader2, Compass, Heart } from "lucide-react";
import { AppBar } from "@/components/AppBar";
const SalahTracker = lazy(() => import("@/components/SalahTracker").then(module => ({ default: module.SalahTracker })));
const WeeklySalahChart = lazy(() => import("@/components/WeeklySalahChart").then(module => ({ default: module.WeeklySalahChart })));
import { PrayerCountdown } from "@/components/PrayerCountdown";
import { PrayerTimesList } from "@/components/PrayerTimesList";
import { QazaTracker } from "@/components/QazaTracker";
import { DailyAyah } from "@/components/DailyAyah";
import { DailyHadith } from "@/components/DailyHadith";
import { DhikrReminder } from "@/components/DhikrReminder";
import { IslamicGreeting } from "@/components/IslamicGreeting";
import { LocationSearch } from "@/components/LocationSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoodSelector } from "@/components/MoodSelector";

import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useIslamicCalendar } from "@/hooks/useIslamicCalendar";
import { LayoutManager } from "@/components/LayoutManager";
import { useLanguage } from "@/contexts/LanguageContext";
import { shouldShowMenstrualFeatures } from "@/lib/gender-settings";

// Dynamic imports for code splitting
// const PrayerCountdown = lazy(() => import("@/components/PrayerCountdown").then(module => ({ default: module.PrayerCountdown })));
// const PrayerTimesList = lazy(() => import("@/components/PrayerTimesList").then(module => ({ default: module.PrayerTimesList })));
import { getTimeFormat, formatTime, setTimeFormat } from "@/lib/time-formatter";
import { useLocationState } from "@/lib/location-state";
import { AladhanAPI } from "@/lib/aladhan-api";
import { localNotifications, type PrayerTime } from "@/lib/local-notifications";
import { useToast } from "@/hooks/use-toast";
import { LocationCardSkeleton, PrayerTimeSkeleton, CountdownCardSkeleton, LoadingSpinner } from "@/components/LoadingSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GeocodingService } from "@/lib/geocoding";
import { PageTransition } from "@/components/PageTransition";
import { motion } from "framer-motion";

const prayerIcons: Record<string, React.ReactNode> = {
  Fajr: <Moon className="w-5 h-5" />,
  Dhuhr: <Sun className="w-5 h-5" />,
  Asr: <Cloud className="w-5 h-5" />,
  Maghrib: <Sunset className="w-5 h-5" />,
  Isha: <CloudMoon className="w-5 h-5" />,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  // Use Islamic calendar hook for accurate Hijri dates
  const { hijriDate, isRamadan } = useIslamicCalendar();
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

  // Helper function to parse time string to Date (handles "HH:MM (TZ)" from Aladhan API)
  const parseTimeToDate = useCallback((timeStr: string): Date => {
    const cleaned = timeStr.replace(/\s*\(.*?\)\s*/g, '').trim();
    const parts = cleaned.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const date = new Date();
    if (isNaN(hours) || isNaN(minutes)) return date;
    date.setHours(hours, minutes, 0, 0);
    return date;
  }, []);

  // Load prayer times using global location
  const loadPrayerTimes = useCallback(async () => {
    if (!location.latitude || !location.longitude) return;
    setLoadingAPI(true);

    try {
      // Check if we have cached data for this specific location
      const hasValidCache = AladhanAPI.isCachedDataValid(location.latitude, location.longitude);

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

      // Get today's prayer times and metadata (including timezone)
      const { timings, timezone: fetchedTimezone } = await AladhanAPI.getTodaysPrayerTimes(location.latitude, location.longitude, 1);

      // Update global location state with the fetched timezone if it's different or not set
      if (fetchedTimezone && fetchedTimezone !== location.timeZone) {
        location.setLocation(location.latitude, location.longitude, location.locationName, fetchedTimezone);
      }

      // Prayer times are loaded, Hijri date comes from useIslamicCalendar hook

      const prayerList: PrayerTime[] = [
        { name: "Fajr", time: formatTimeFromAPI(timings.Fajr), date: parseTimeToDate(timings.Fajr) },
        { name: "Dhuhr", time: formatTimeFromAPI(timings.Dhuhr), date: parseTimeToDate(timings.Dhuhr) },
        { name: "Asr", time: formatTimeFromAPI(timings.Asr), date: parseTimeToDate(timings.Asr) },
        { name: "Maghrib", time: formatTimeFromAPI(timings.Maghrib), date: parseTimeToDate(timings.Maghrib) },
        { name: "Isha", time: formatTimeFromAPI(timings.Isha), date: parseTimeToDate(timings.Isha) },
      ];

      setPrayers(prayerList);

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

      const { getNextPrayer } = await import('@/lib/prayer-calculator');
      const nextPrayer = getNextPrayer(location.latitude, location.longitude);
      if (nextPrayer) {
        setNextPrayerName(nextPrayer.name);
      }
    } finally {
      setLoadingAPI(false);
      setInitialLoad(false);
    }
  }, [location.latitude, location.longitude, location.timeZone, location.locationName, formatTimeFromAPI, parseTimeToDate]); // Add dependencies

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update greeting (simplified to As-salamu alaykum)
  useEffect(() => {
    setGreeting("As-salamu alaykum");
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



  // Update countdown every second
  // Optimize countdown: Fetch target time ONCE, then countdown locally
  const [targetTime, setTargetTime] = useState<Date | null>(null);

  // Fetch the next event target time whenever location changes
  useEffect(() => {
    const fetchNextEvent = async () => {
      if (location.latitude && location.longitude) {
        try {
          // Get the next event data (name + time string)
          const nextEvent = await AladhanAPI.getNextEventCountdown(
            location.latitude,
            location.longitude,
            1,
            false
          );

          if (nextEvent) {
            setNextPrayerName(nextEvent.name);

            // Use the authoritative targetDate from the API helper if available
            if (nextEvent.targetDate) {
              setTargetTime(nextEvent.targetDate);
            }
          }
        } catch (error) {
          console.error('Failed to fetch next event:', error);
        }
      }
    };

    fetchNextEvent();
  }, [location.latitude, location.longitude]);


  // Lightweight interval: just updates the string based on targetTime
  useEffect(() => {
    if (!targetTime) return;

    const updateDisplay = () => {
      const now = new Date();
      const diff = targetTime.getTime() - now.getTime();

      if (diff <= 0) {
        // Timer finished, trigger a re-fetch
        setTargetTime(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const countdownStr = hours > 0
        ? `${hours}h ${minutes}m ${seconds}s`
        : `${minutes}m ${seconds}s`; // Added seconds for liveness

      setNextEventCountdown(prev => prev ? { ...prev, countdown: countdownStr } : null);
    };

    updateDisplay(); // update immediately
    const interval = setInterval(updateDisplay, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <AppBar title={t('appTitle')} />

        <div className="max-w-lg mx-auto p-4 space-y-4">
          {/* Header */}
          {/* Premium Hero Card */}
          <div className="relative overflow-hidden rounded-[28px] shadow-[var(--elevation-4)] transition-all duration-500 hover:shadow-[var(--elevation-6)] group">
            {/* Animated Mesh Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a4a4a] via-[#2c6e6e] to-[#b38b5d] opacity-100"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent opacity-60 animate-pulse"></div>

            {/* Islamic Pattern Overlay (Abstract) */}
            <div className="absolute inset-0 opacity-[0.08] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] bg-repeat"></div>

            {/* Animated Glow Orbs with enhanced effects */}
            <div className="absolute top-[-60px] right-[-60px] w-48 h-48 bg-[#e0c097] rounded-full blur-[80px] opacity-30 animate-pulse"></div>
            <div className="absolute bottom-[-40px] left-[-40px] w-40 h-40 bg-[#4fd1c5] rounded-full blur-[70px] opacity-25 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-primary/30 rounded-full blur-[60px] opacity-20 animate-pulse"></div>

            {/* Glassmorphism Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>

            {/* Content Container */}
            <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center text-white space-y-5">

              {/* Top Row: Date & Hijri with premium badges */}
              <div className="w-full flex justify-between items-center text-xs sm:text-sm font-medium">
                <div className="flex items-center gap-2 glass-card px-3 py-1.5 text-white/90">
                  <Calendar className="w-3.5 h-3.5 text-[#e0c097]" />
                  <span>
                    {currentTime.toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "short"
                    })}
                  </span>
                </div>
                {hijriDate && (
                  <div className="glass-card px-3 py-1.5 font-arabic tracking-wide text-[#e0c097]">
                    {hijriDate}
                  </div>
                )}
              </div>

              {/* Center: Greeting & Time with premium typography */}
              <div className="flex flex-col items-center space-y-2 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium tracking-[0.2em] uppercase text-[#e0c097]/90">
                    {greeting}
                  </span>
                </div>

                <h1 className="text-6xl sm:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/70 drop-shadow-sm font-mono">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: timeFormat === '12' ? 'numeric' : '2-digit',
                    minute: "2-digit",
                    hour12: false,
                    timeZone: location.timeZone || undefined
                  })}
                  <span className="text-xl sm:text-2xl ml-2 font-light text-white/60 tracking-normal font-sans">
                    {timeFormat === '12' ? currentTime.toLocaleTimeString("en-US", { hour12: true, timeZone: location.timeZone }).split(' ')[1] : ''}
                  </span>
                </h1>

                <p className="text-xs text-white/60 font-medium tracking-wide uppercase flex items-center gap-1.5 mt-1 glass-card px-3 py-1">
                  <MapPin className="w-3 h-3" />
                  {locationLabel}
                  {location.timeZone && <span className="text-white/40">• {location.timeZone.split('/')[1]?.replace('_', ' ')}</span>}
                </p>
              </div>

            </div>

            {/* Premium Bottom Gradient Line */}
            <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[#e0c097]/70 to-transparent"></div>

            {/* Corner Accents */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/20 rounded-tl-lg"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white/20 rounded-tr-lg"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white/20 rounded-bl-lg"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white/20 rounded-br-lg"></div>
          </div>

          {/* Mood Based Remedies */}
          <MoodSelector />

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
                timeZone={location.timeZone}
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
                timeZone={location.timeZone}
              />
            </Suspense>
          </ErrorBoundary>

          {/* Daily Ayah */}
          <DailyAyah />

          {/* Daily Hadith */}
          <DailyHadith />

          {/* Dhikr Reminder */}
          <DhikrReminder />

          {/* Quick Access Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Compass, label: t('qibla'), sub: t('direction'), link: '/qibla', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
              { icon: Calendar, label: t('qazaTracker'), sub: t('tracker'), link: '/qaza', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
              { icon: BookOpen, label: t('ramadanMode'), sub: t('mode'), link: '/ramadan', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
              ...(true || shouldShowMenstrualFeatures() ? [
                { icon: Heart, label: t('menstrualMode'), sub: t('mode'), link: '/menstrual-mode', color: 'text-rose-500', bgColor: 'bg-rose-500/10' }
              ] : []),
              { icon: Calculator, label: t('zakatCalculator'), sub: t('calc'), link: '/zakat', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
              { icon: Trophy, label: t('islamicQuiz'), sub: t('islamic'), link: '/quiz', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
              { icon: Star, label: t('namesOfAllah'), sub: t('ofAllah'), link: '/names-of-allah', color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden rounded-[20px] bg-card border border-border/50 p-4 cursor-pointer touch-feedback"
                onClick={() => handleCardClick(item.label, item.link)}
              >
                {/* Hover Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                
                <div className="relative z-10 flex flex-col items-center text-center gap-2">
                  {/* Icon Container with Premium Styling */}
                  <div className={`p-3 rounded-2xl ${item.bgColor} shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-110`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} strokeWidth={2} />
                  </div>
                  
                  {/* Text Content */}
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors duration-300">{item.label}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.sub}</p>
                  </div>
                </div>
                
                {/* Corner Accent */}
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors duration-300" />
              </motion.div>
            ))}
          </div>

          {/* Salah Tracker */}
          <Suspense fallback={
            <div className="h-40 card-premium skeleton-premium" />
          }>
            <SalahTracker />
          </Suspense>

          {/* Weekly Progress Chart */}
          <Suspense fallback={
            <div className="h-60 card-premium skeleton-premium" />
          }>
            <WeeklySalahChart />
          </Suspense>

          {/* Qaza Tracker (compact view) */}
          <QazaTracker compact />

          {/* Location Detection Card */}
          {initialLoad ? (
            <LocationCardSkeleton />
          ) : (
            <Card className="p-4 border-border/50 hover:shadow-[var(--card-premium-shadow-hover)] transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{t('location')}</h3>
                    <p className="text-xs text-muted-foreground">{location.locationName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowManualLocationDialog(true)}
                    className="gap-2 rounded-xl hover:bg-primary/10"
                  >
                    <MapPin className="w-4 h-4" />
                    {t('manual')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDetectLocation}
                    disabled={location.isDetecting}
                    className="gap-2 rounded-xl border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                  >
                    {location.isDetecting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        {t('detecting')}
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        {t('location')}
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
                      try {
                        setLoadingAPI(true);

                        // Clear stale prayer data cache to force fresh fetch for new location
                        AladhanAPI.clearCachedData();

                        // Step 1: Get coordinates
                        const coords = await GeocodingService.getCityCoordinates(city, country);

                        // Step 2: Fetch EVERYTHING (times + timezone) from Aladhan API
                        const result = await AladhanAPI.getTodaysPrayerTimes(
                          coords.latitude,
                          coords.longitude,
                          1
                        );

                        const fetchedTimezone = result.timezone;

                        console.log(`[Dashboard] Selected ${city}, fetched timezone: ${fetchedTimezone}`);

                        // Step 3: Set state synchronously
                        location.setLocation(
                          coords.latitude,
                          coords.longitude,
                          `${city}, ${country}`,
                          fetchedTimezone
                        );

                        // Step 4: Refresh hook
                        await prayerTimesHook.setManualLocation(city, country);

                        setShowManualLocationDialog(false);
                        toast({
                          title: "Location Updated",
                          description: `Time adjusted to ${fetchedTimezone}`
                        });
                      } catch (err) {
                        console.error('[Dashboard] Location selection error:', err);
                        toast({
                          title: "Selection Failed",
                          description: "Could not sync timezone. Please try again.",
                          variant: "destructive"
                        });
                      } finally {
                        setLoadingAPI(false);
                      }
                    }}
                    isLoading={prayerTimesHook.isLoading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-muted/20">
            {/* Decorative gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <CardTitle className="text-center text-base font-semibold">
                  <span className="text-gradient-gold">100% Private</span>
                  <span className="text-muted-foreground mx-2">•</span>
                  <span className="text-gradient-gold">Offline-first</span>
                </CardTitle>
              </div>
              <CardDescription className="text-center text-xs font-medium uppercase tracking-wider">
                No tracking • FOSS Architecture
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="glass-card px-4 py-3 rounded-xl">
                <p className="text-center text-xs text-muted-foreground italic font-arabic">
                  "In the remembrance of Allah do hearts find rest." — 13:28
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
