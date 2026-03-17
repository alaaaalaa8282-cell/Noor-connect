import { useState, useEffect, useCallback, useMemo, Suspense, lazy, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Moon, Sun, Sunset, Cloud, CloudMoon, Calendar, BookOpen, Navigation, Calculator, Trophy, Star, Search, Loader2, Compass, Heart, ToggleLeft, ToggleRight, Sparkles, MessageCircle, Clock, TrendingUp, Award, Grid3X3, Building } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppBar } from "@/components/AppBar";
const DailyAyah = lazy(() => import("@/components/EnhancedDailyAyah").then(module => ({ default: module.EnhancedDailyAyah })));
const DailyHadith = lazy(() => import("@/components/EnhancedDailyHadith").then(module => ({ default: module.EnhancedDailyHadith })));
const PrayerTimesList = lazy(() => import("@/components/PrayerTimesList").then(module => ({ default: module.PrayerTimesList })));
import { LocationSearch } from "@/components/LocationSearch";
import { LayoutManager } from "@/components/LayoutManager";
import { useLanguage } from "@/contexts/LanguageContext-new";
import { useI18n } from "@/hooks/useI18n";
import { shouldShowMenstrualFeatures } from "@/lib/gender-settings";
import { isMenstrualModeActive, getMenstrualModeData, activateMenstrualMode, deactivateMenstrualMode } from "@/lib/menstrual-mode";

import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useIslamicCalendar } from "@/hooks/useIslamicCalendar";
import { getTimeFormat, formatTime } from "@/lib/time-formatter";
import { useLocationState } from "@/lib/location-state";
import { AladhanAPI } from "@/lib/aladhan-api";
import { type PrayerTime } from "@/lib/local-notifications";
import { useToast } from "@/hooks/use-toast";
import { LocationCardSkeleton, LoadingSpinner } from "@/components/LoadingSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GeocodingService } from "@/lib/geocoding";
import { PRAYER_ALARM_CONTROL_EVENT, PRAYER_ALARM_TOGGLE_EVENT } from "@/lib/prayer-alarm-events";
import { PageTransition } from "@/components/PageTransition";
import { widgetRefreshManager } from "@/lib/widget-refresh";

const prayerIcons: Record<string, React.ReactNode> = {
  Fajr: <Moon className="w-5 h-5 text-indigo-400" />,
  Dhuhr: <Sun className="w-5 h-5 text-amber-400" />,
  Asr: <Cloud className="w-5 h-5 text-blue-400" />,
  Maghrib: <Sunset className="w-5 h-5 text-orange-400" />,
  Isha: <CloudMoon className="w-5 h-5 text-purple-400" />,
};

// Premium high-fidelity gradient definitions for main features
const featureCards = [
  {
    id: 'quran',
    title: 'Quran',
    description: 'Read & Listen',
    icon: BookOpen,
    gradient: 'from-[#10b981] via-[#059669] to-[#047857]', // Rich emerald
    route: '/quran',
    stats: '114 Surahs'
  },
  {
    id: 'prayer',
    title: 'Prayer',
    description: 'Times & Qibla',
    icon: Building,
    gradient: 'from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]', // Deep blue
    route: '/qibla',
    stats: '5 Daily'
  },
  {
    id: 'services',
    title: 'Services',
    description: 'All Features',
    icon: Grid3X3,
    gradient: 'from-[#f59e0b] via-[#d97706] to-[#b45309]', // Vibrant amber
    route: '/services',
    stats: '15+ Features'
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { t: ti18n } = useI18n();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  // Use Islamic calendar hook for accurate Hijri dates
  const { hijriDate } = useIslamicCalendar();
  const [timeFormat, setTimeFormat] = useState<'12' | '24'>('24');
  const [nextPrayerName, setNextPrayerName] = useState<string>("");
  const [nextEventCountdown, setNextEventCountdown] = useState<{ name: string; time: string; countdown: string } | null>(null);
  const [loadingAPI, setLoadingAPI] = useState(false);
  const [timezone, setTimezone] = useState<string>("");
  const [initialLoad, setInitialLoad] = useState(true);
  const [targetTime, setTargetTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Global location state
  const location = useLocationState();

  const [showManualLocationDialog, setShowManualLocationDialog] = useState(false);
  const [menstrualModeData, setMenstrualModeData] = useState(getMenstrualModeData());


  const prayerTimesHook = usePrayerTimes();

  const prayerLocation = prayerTimesHook.location;

  // Priority: GPS location > VPN/API location
  // If GPS location is set, use it regardless of whether it's default
  const locationLabel = useMemo(() => {
    // If GPS location has coordinates, use it (even if default Karachi)
    if (location.latitude && location.longitude) {
      return location.locationName;
    }

    // Otherwise, use VPN/API location if available
    if (prayerLocation?.city && prayerLocation?.country) {
      return `${prayerLocation.city}, ${prayerLocation.country}`;
    }

    // Fallback to default location
    return location.locationName;
  }, [location, prayerLocation]);

  // Similar priority for timezone
  const timezoneLabel = useMemo(() => {
    // If GPS location is set, use it (even if default Karachi)
    if (location.latitude && location.longitude && location.timeZone) {
      return location.timeZone;
    }

    // Otherwise, use VPN/API location if available
    if (prayerLocation?.timeZone) {
      return prayerLocation.timeZone;
    }

    // Fallback to default location timezone
    return location.timeZone;
  }, [location, prayerLocation]);


  useEffect(() => {
    const currentFormat = getTimeFormat();
    setTimeFormat(currentFormat);
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
        if (nextEvent.targetDate) {
          setTargetTime(nextEvent.targetDate);
        }
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
  }, [location.latitude, location.longitude, location.timeZone, location.locationName, location.setLocation, formatTimeFromAPI, parseTimeToDate, timeFormat]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Add online listener to refresh prayer times as soon as internet is back
    const handleOnline = () => {
      loadPrayerTimes();
      widgetRefreshManager.refreshAll(); // Refresh all widgets when online
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
    };
  }, [loadPrayerTimes]);

  // Update greeting (simplified to As-salamu alaykum)
  useEffect(() => {
    setGreeting("As-salamu alaykum");
  }, []);

  // Handle location detection
  const handleDetectLocation = async () => {
    const success = await location.detectLocation();
    if (success) {
      toast({ title: ti18n('locationDetected'), description: `Updated to ${location.locationName}` });


      // Reload prayer times with new location
      await loadPrayerTimes();
    } else {
      toast({ title: ti18n('locationDetectionFailed'), description: ti18n('pleaseEnableLocationPermissions'), variant: "destructive" });
    }
  };


  // Handle menstrual mode toggle
  const handleMenstrualModeToggle = async () => {
    if (menstrualModeData.isActive) {
      const updated = deactivateMenstrualMode(new Date());
      setMenstrualModeData(updated);
      toast({
        title: ti18n('menstrualModeEnded'),
        description: ti18n('prayerReminderSchedulingResumed'),
      });
    } else {
      const updated = activateMenstrualMode(new Date());
      setMenstrualModeData(updated);

      // Disable the web adhan alarm state immediately while mode is active.
      localStorage.setItem("prayer-alarm-enabled", "false");
      window.dispatchEvent(
        new CustomEvent(PRAYER_ALARM_TOGGLE_EVENT, { detail: { enabled: false } })
      );
      window.dispatchEvent(
        new CustomEvent(PRAYER_ALARM_CONTROL_EVENT, { detail: { action: "stop" } })
      );

      if (updated.pausePrayerNotifications) {
        try {
          const { localNotifications } = await import("@/lib/local-notifications");
          await localNotifications.clearPrayerNotifications();
        } catch (error) {
          console.error(ti18n('failedToClearPrayerNotifications'), error);
        }
      }

      toast({
        title: ti18n('menstrualModeEnabled'),
        description: ti18n('prayerRemindersPaused'),
      });
    }
  };

  // Listen for menstrual mode updates
  useEffect(() => {
    const handleModeUpdate = () => {
      setMenstrualModeData(getMenstrualModeData());
    };

    window.addEventListener("menstrual-mode-updated", handleModeUpdate);
    return () => {
      window.removeEventListener("menstrual-mode-updated", handleModeUpdate);
    };
  }, []);

  // Initialize prayer times when location changes
  useEffect(() => {
    if (location.latitude && location.longitude) {
      loadPrayerTimes();
    }
  }, [location.latitude, location.longitude, timeFormat, loadPrayerTimes]); // Add loadPrayerTimes to dependencies

  // Listen for time format changes from settings
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'time-format' && e.newValue) {
        setTimeFormat(e.newValue as '12' | '24');
        // Reload prayer times to apply new format
        if (location.latitude && location.longitude) {
          loadPrayerTimes();
        }
      }
    };

    const handleCustomTimeFormatChange = (e: CustomEvent) => {
      if (e.detail?.format) {
        setTimeFormat(e.detail.format as '12' | '24');
        // Reload prayer times to apply new format
        if (location.latitude && location.longitude) {
          loadPrayerTimes();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('time-format-changed', handleCustomTimeFormatChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('time-format-changed', handleCustomTimeFormatChange as EventListener);
    };
  }, [setTimeFormat, location.latitude, location.longitude, loadPrayerTimes]);

  // Clear stale location data on mount to prevent ISTRES issue
  useEffect(() => {
    // Clear any stale IP-based location that might show wrong city
    const staleKeys = ['user-location-data', 'location-storage'];
    staleKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          // Clear if it contains ISTRES or other problematic location data
          if (parsed.city === 'Istres' || parsed.locationName?.includes('Istres') ||
            parsed.city === 'ISTRES' || parsed.locationName?.includes('ISTRES')) {
            localStorage.removeItem(key);
            console.log('Cleared stale location data containing ISTRES');
            // Force reload page to refresh location
            window.location.reload();
          }
        }
      } catch (error) {
        console.warn('Failed to check location data:', error);
      }
    });

    // Also force clear any problematic data if location is showing ISTRES
    if (location.locationName?.includes('Istres') || location.locationName?.includes('ISTRES')) {
      localStorage.removeItem('user-location-data');
      localStorage.removeItem('location-storage');
      console.log('Cleared location data due to ISTRES detection');
      // Force reload to get fresh location
      window.location.reload();
    }
  }, []);



  // Update countdown every second
  // Optimize countdown: Fetch target time ONCE, then countdown locally
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
        <AppBar
          title={t('appTitle')}
        />

        <div className="max-w-lg mx-auto p-4 space-y-4">
          {/* Header */}
          {/* Premium Hero Card */}
          <div className="relative overflow-hidden rounded-[28px] shadow-[var(--elevation-4)] transition-all duration-500 hover:shadow-[var(--elevation-6)] group">
            {/* Animated Mesh Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a4a4a] via-[#2c6e6e] to-[#b38b5d] opacity-100"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent opacity-60 animate-pulse"></div>

            {/* Subtle Islamic Pattern (CSS-based) */}
            <div className="absolute inset-0 opacity-[0.03] bg-gradient-to-br from-emerald-50/20 via-transparent to-blue-50/10"></div>

            {/* Static Glow Orbs optimized for mobile rendering */}
            <div className="absolute top-[-60px] right-[-60px] w-48 h-48 bg-[#e0c097] rounded-full blur-2xl opacity-10"></div>
            <div className="absolute bottom-[-40px] left-[-40px] w-40 h-40 bg-[#4fd1c5] rounded-full blur-2xl opacity-5"></div>
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-primary/20 rounded-full blur-2xl opacity-10"></div>

            {/* Glassmorphism Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>

            {/* Content Container */}
            <div className="relative z-10 p-6 sm:p-8 flex flex-col text-white space-y-6">

              {/* Top Row: Date & Hijri with premium badges */}
              <div className="w-full flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 glass-card px-3 py-1.5 text-white/90 w-fit">
                    <Calendar className="w-3.5 h-3.5 text-[#e0c097]" />
                    <span className="text-xs font-medium">
                      {currentTime.toLocaleDateString("en-US", {
                        weekday: "long",
                        day: "numeric",
                        month: "short"
                      })}
                    </span>
                  </div>
                  {hijriDate && (
                    <div className="text-[10px] text-[#e0c097]/80 font-arabic tracking-wide ps-1">
                      {hijriDate}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <p className="text-[10px] text-white/60 font-medium tracking-wide uppercase flex items-center gap-1.5 glass-card px-3 py-1">
                    <MapPin className="w-3 h-3 text-[#e0c097]" />
                    {locationLabel.split(',')[0]}
                  </p>
                </div>
              </div>

              {/* Center: Greeting & Time with premium typography */}
              <div className="flex flex-col items-center justify-center space-y-1 py-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#e0c097]" />
                  <span className="text-xs font-semibold tracking-[0.1em] uppercase text-white">
                    {greeting}
                  </span>
                </div>

                <div className="relative flex items-baseline">
                  <h1 className="text-7xl sm:text-8xl font-bold tracking-tighter text-white drop-shadow-2xl font-mono">
                    {currentTime.toLocaleTimeString("en-US", {
                      hour: timeFormat === '12' ? 'numeric' : '2-digit',
                      minute: "2-digit",
                      hour12: timeFormat === '12',
                      timeZone: timezoneLabel || undefined
                    }).replace(/\s+[APap][Mm]/, '')}
                  </h1>
                  {timeFormat === '12' && (
                    <span className="text-xl sm:text-2xl ms-2 font-bold text-[#e0c097] tracking-tight uppercase">
                      {currentTime.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezoneLabel }).split(' ')[1]}
                    </span>
                  )}
                </div>

                {nextEventCountdown && (
                  <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/5 group-hover:bg-black/30 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-[#e0c097] animate-pulse" />
                    <span className="text-xs font-medium text-white/90">
                      {nextEventCountdown.name}: <span className="text-[#e0c097]">{nextEventCountdown.countdown}</span>
                    </span>
                  </div>
                )}
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



          {/* Enhanced Premium Feature Cards Grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            <AnimatePresence>
              {featureCards.map((card, index) => {
                const Icon = card.icon;
                const isFullWidth = index === 2; // Making the 3rd card span full width for better symmetry
                
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(card.route)}
                    className={`relative overflow-hidden rounded-[24px] cursor-pointer group shadow-lg sm:shadow-xl shadow-${card.gradient.split('-')[1]}/20 ${isFullWidth ? 'col-span-2' : ''}`}
                  >
                    {/* Base Vivid Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
                    
                    {/* Dynamic Lighting Effects */}
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all duration-700" />
                    <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-black/20 rounded-full blur-xl group-hover:bg-black/10 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 opacity-80" />
                    
                    {/* Premium Noise / Pattern Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_#ffffff_1px,_transparent_1px)] bg-[length:12px_12px]" />

                    {/* Content Container */}
                    <div className={`relative z-10 p-5 ${isFullWidth ? 'flex flex-row items-center justify-between h-28' : 'flex flex-col h-36 justify-between'}`}>
                      {/* Top / Left Section: Icon & Stat */}
                      <div className={`flex ${isFullWidth ? 'flex-col items-start gap-3' : 'items-start justify-between w-full'}`}>
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                          <Icon className="w-5 h-5 text-white drop-shadow-md" strokeWidth={2.5} />
                        </div>
                        {isFullWidth && (
                           <div>
                             <h3 className="font-bold text-white text-xl tracking-tight leading-none mb-1">{card.title}</h3>
                             <p className="text-white/80 text-xs font-medium uppercase tracking-wider">{card.description}</p>
                           </div>
                        )}
                        {!isFullWidth && (
                          <div className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-sm">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-white shadow-black/10 drop-shadow-sm">{card.stats}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Bottom / Right Section: Title & Description */}
                      {!isFullWidth && (
                        <div className="pt-2">
                          <h3 className="font-bold text-white text-lg tracking-tight leading-none mb-1">{card.title}</h3>
                          <p className="text-white/80 text-xs font-medium">{card.description}</p>
                        </div>
                      )}
                      {isFullWidth && (
                        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm shrink-0">
                           <span className="text-xs uppercase tracking-wider font-bold text-white shadow-black/10 drop-shadow-sm">{card.stats}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Premium Prayer Times Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[24px] p-6 shadow-xl shadow-blue-900/5 group bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50"
          >
            {/* Subtle background flair */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] shadow-lg shadow-blue-500/30 text-white shrink-0 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500">
                    <Building className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Prayer Times</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{locationLabel}</p>
                  </div>
                </div>
                <div className="text-right bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400 mb-0.5">Next Prayer</p>
                  <p className="font-bold text-lg text-blue-700 dark:text-blue-300 leading-none">{nextPrayerName || '---'}</p>
                </div>
              </div>
              
              {/* Full Prayer Times List - Always Show All Prayers */}
              <Suspense fallback={
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="h-14 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              }>
                <div className="bg-white/40 dark:bg-black/20 rounded-[20px] p-2 border border-white/50 dark:border-white/5 shadow-inner">
                  <PrayerTimesList
                    timings={prayerTimesHook.prayerTimesWithEnd}
                    location={prayerTimesHook.location}
                    isLoading={prayerTimesHook.isLoading}
                    error={prayerTimesHook.error}
                    needsManualLocation={prayerTimesHook.needsManualLocation}
                    refresh={prayerTimesHook.refresh}
                    setManualLocation={prayerTimesHook.setManualLocation}
                    timeZone={timezoneLabel}
                  />
                </div>
              </Suspense>
            </div>
          </motion.div>

          {/* Premium Daily Content Section */}
          <div className="grid grid-cols-1 gap-5">
            {/* Daily Ayah Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
              className="relative overflow-hidden rounded-[24px] p-6 shadow-xl shadow-emerald-900/5 group bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50"
            >
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors duration-500 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] shadow-lg shadow-emerald-500/30 text-white shrink-0 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500">
                    <BookOpen className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Daily Ayah</h3>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Quranic Inspiration</p>
                  </div>
                </div>
                <Suspense fallback={<div className="h-32 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />}>
                  <DailyAyah />
                </Suspense>
              </div>
            </motion.div>

            {/* Daily Hadith Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
              className="relative overflow-hidden rounded-[24px] p-6 shadow-xl shadow-indigo-900/5 group bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50"
            >
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors duration-500 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#6366f1] via-[#4f46e5] to-[#4338ca] shadow-lg shadow-indigo-500/30 text-white shrink-0 group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-500">
                    <MessageCircle className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Daily Hadith</h3>
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Prophetic Wisdom</p>
                  </div>
                </div>
                <Suspense fallback={<div className="h-32 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />}>
                  <DailyHadith />
                </Suspense>
              </div>
            </motion.div>
          </div>

          {/* Menstrual Mode Toggle - Only show for female users */}
          {shouldShowMenstrualFeatures() && (
            <div
              className={`relative overflow-hidden rounded-[24px] p-5 transition-all duration-500 shadow-xl ${menstrualModeData.isActive
                ? 'bg-gradient-to-br from-rose-50/90 to-rose-100/50 border border-rose-200/50 shadow-rose-900/5'
                : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-slate-900/5'
                }`}
            >
              {menstrualModeData.isActive && (
                 <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              )}
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3.5 rounded-2xl shadow-sm border ${menstrualModeData.isActive
                    ? 'bg-rose-500 border-rose-400 shadow-rose-500/30 text-white'
                    : 'bg-white border-slate-100 text-rose-500 shadow-slate-200/50'
                    } transition-colors duration-300`}>
                    <Heart className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-xl tracking-tight ${menstrualModeData.isActive ? 'text-rose-950' : 'text-slate-900 dark:text-white'}`}>{t('menstrualMode')}</h3>
                    <p className={`text-[10px] uppercase tracking-wider font-bold ${menstrualModeData.isActive ? 'text-rose-600' : 'text-slate-500'}`}>
                      {menstrualModeData.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleMenstrualModeToggle}
                  variant={menstrualModeData.isActive ? "destructive" : "default"}
                  className={`rounded-xl font-bold shadow-lg transition-all active:scale-95 ${menstrualModeData.isActive ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'} w-full sm:w-auto h-12 sm:h-auto`}
                >
                  {menstrualModeData.isActive ? (
                    <>
                      <ToggleLeft className="w-5 h-5 me-2" />
                      End
                    </>
                  ) : (
                    <>
                      <ToggleRight className="w-5 h-5 me-2" />
                      Start
                    </>
                  )}
                </Button>
              </div>

              {menstrualModeData.isActive && menstrualModeData.startedAt && (
                <div className="mt-4 pt-3 border-t border-rose-200/50 text-[11px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-2 relative z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Started: {new Date(menstrualModeData.startedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {/* AI Reciter Recognition Feature - REMOVED */}



          {/* Location Detection Card */}
          {initialLoad ? (
            <LocationCardSkeleton />
          ) : (
            <div className="relative overflow-hidden rounded-[24px] p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl shadow-slate-900/5 group">
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-500/10 rounded-full blur-2xl group-hover:bg-slate-500/20 transition-colors duration-500 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 shadow-sm border border-white/50 dark:border-slate-600 shrink-0 group-hover:scale-105 transition-transform duration-500">
                    <MapPin className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">{t('location')}</h3>
                    <p className="text-sm font-medium text-slate-500 line-clamp-1">{location.locationName}</p>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setShowManualLocationDialog(true)}
                    className="flex-1 sm:flex-none gap-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm h-12 sm:h-10"
                  >
                    <MapPin className="w-4 h-4 text-slate-500" />
                    {t('manual')}
                  </Button>
                  <Button
                    onClick={handleDetectLocation}
                    disabled={location.isDetecting}
                    className="flex-1 sm:flex-none gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 font-semibold active:scale-95 transition-all h-12 sm:h-10"
                  >
                    {location.isDetecting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        {t('detecting')}
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        Detect
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
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
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 shadow-inner p-6 text-center">
            {/* Decorative Top Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
            
            <div className="flex flex-col items-center gap-3">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-800/50 shadow-sm border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#b8860b]">100% Private</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-xs font-bold uppercase tracking-widest text-[#b8860b]">Offline-first</span>
              </div>
              
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mt-1">
                No tracking • FOSS Architecture
              </p>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-3" />

              <p className="text-sm text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed max-w-sm">
                "In the remembrance of Allah do hearts find rest." <span className="not-italic text-xs font-bold text-slate-400">— 13:28</span>
              </p>

              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/50 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                App Version 1.1.2
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
