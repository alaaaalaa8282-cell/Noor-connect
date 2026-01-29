import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Moon, Sun, Sunset, Cloud, CloudMoon, Calendar, BookOpen, Navigation, Calculator, Trophy, Star, Search, Loader2 } from "lucide-react";
import { AppBar } from "@/components/AppBar";
import { SalahTracker } from "@/components/SalahTracker";
import { WeeklySalahChart } from "@/components/WeeklySalahChart";
import { QazaTracker } from "@/components/QazaTracker";
import { PrayerCountdown } from "@/components/PrayerCountdown";
import { DailyAyah } from "@/components/DailyAyah";
import { DailyHadith } from "@/components/DailyHadith";
import { DhikrReminder } from "@/components/DhikrReminder";
import { IslamicGreeting } from "@/components/IslamicGreeting";
import { NotificationSettings } from "@/components/NotificationSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTimeFormat } from "@/lib/storage";
import { useLocationState } from "@/lib/location-state";
import { AladhanAPI } from "@/lib/aladhan-api";
import { localNotifications, type PrayerTime } from "@/lib/local-notifications";
import { useToast } from "@/hooks/use-toast";
import { LocationCardSkeleton, PrayerTimeSkeleton, CountdownCardSkeleton, LoadingSpinner } from "@/components/LoadingSkeleton";

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
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();
  
  // Location search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  
  // Global location state
  const location = useLocationState();

  useEffect(() => {
    setTimeFormat(getTimeFormat());
  }, []);

  // Search for location
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      // First try our city database for instant results
      const commonCities: Record<string, {lat: number, lon: number, name: string}> = {
        'karachi': { lat: 24.8607, lon: 67.0011, name: 'Karachi, Pakistan' },
        'islamabad': { lat: 33.6844, lon: 73.0479, name: 'Islamabad, Pakistan' },
        'lahore': { lat: 31.5204, lon: 74.3587, name: 'Lahore, Pakistan' },
        'peshawar': { lat: 34.0151, lon: 71.5249, name: 'Peshawar, Pakistan' },
        'quetta': { lat: 30.1798, lon: 66.9750, name: 'Quetta, Pakistan' },
        'makkah': { lat: 21.3891, lon: 39.8579, name: 'Makkah, Saudi Arabia' },
        'madinah': { lat: 24.4686, lon: 39.6119, name: 'Madinah, Saudi Arabia' },
        'dubai': { lat: 25.2048, lon: 55.2708, name: 'Dubai, UAE' },
        'cairo': { lat: 30.0444, lon: 31.2357, name: 'Cairo, Egypt' },
        'jakarta': { lat: -6.2088, lon: 106.8456, name: 'Jakarta, Indonesia' },
        'delhi': { lat: 28.6139, lon: 77.2090, name: 'Delhi, India' },
        'mumbai': { lat: 19.0760, lon: 72.8777, name: 'Mumbai, India' },
        'london': { lat: 51.5074, lon: -0.1278, name: 'London, UK' },
        'newyork': { lat: 40.7128, lon: -74.0060, name: 'New York, USA' },
        'paris': { lat: 48.8566, lon: 2.3522, name: 'Paris, France' },
        'tokyo': { lat: 35.6762, lon: 139.6503, name: 'Tokyo, Japan' },
        'singapore': { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
        'istanbul': { lat: 41.0082, lon: 28.9784, name: 'Istanbul, Turkey' },
        'riyadh': { lat: 24.7136, lon: 46.6753, name: 'Riyadh, Saudi Arabia' },
        'kuwait': { lat: 29.3117, lon: 47.4818, name: 'Kuwait City, Kuwait' }
      };
      
      const searchLower = searchQuery.toLowerCase().trim();
      const city = commonCities[searchLower] || 
                   Object.values(commonCities).find(city => 
                     city.name.toLowerCase().includes(searchLower)
                   );
      
      if (city) {
        // Update global location state
        location.setLocation(city.lat, city.lon, city.name);
        setSearchQuery("");
        setShowLocationSearch(false);
        toast({
          title: "Location Updated",
          description: `Prayer times updated for ${city.name}`,
        });
        return;
      }
      
      // If no city found in our database, try geocoding API if key is available
      const apiKey = process.env.VITE_OPENCAGE_API_KEY;
      if (apiKey && apiKey !== 'demo') {
        const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(searchQuery)}&key=${apiKey}&limit=1`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.results.length > 0) {
          const result = data.results[0];
          const lat = result.geometry.lat;
          const lon = result.geometry.lng;
          const name = result.formatted;
          
          location.setLocation(lat, lon, name);
          setSearchQuery("");
          setShowLocationSearch(false);
          toast({
            title: "Location Updated",
            description: `Prayer times updated for ${name}`,
          });
          return;
        }
      }
      
      // If we reach here, no location was found
      toast({
        title: "Location Not Found",
        description: "Try a major city name like Karachi, Dubai, London, etc.",
        variant: "destructive",
      });
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Unable to find location. Try a major city name.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  // Load prayer times using global location
  const loadPrayerTimes = async () => {
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

      // Get today's prayer times
      const timings = await AladhanAPI.getTodaysPrayerTimes(location.latitude, location.longitude, 1);
      
      const prayerList: PrayerTime[] = [
        { name: "Fajr", time: formatTime(timings.Fajr), date: parseTimeToDate(timings.Fajr) },
        { name: "Dhuhr", time: formatTime(timings.Dhuhr), date: parseTimeToDate(timings.Dhuhr) },
        { name: "Asr", time: formatTime(timings.Asr), date: parseTimeToDate(timings.Asr) },
        { name: "Maghrib", time: formatTime(timings.Maghrib), date: parseTimeToDate(timings.Maghrib) },
        { name: "Isha", time: formatTime(timings.Isha), date: parseTimeToDate(timings.Isha) },
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
        { name: "Fajr", time: formatPrayerTime(times.fajr, timeFormat), date: times.fajr },
        { name: "Dhuhr", time: formatPrayerTime(times.dhuhr, timeFormat), date: times.dhuhr },
        { name: "Asr", time: formatPrayerTime(times.asr, timeFormat), date: times.asr },
        { name: "Maghrib", time: formatPrayerTime(times.maghrib, timeFormat), date: times.maghrib },
        { name: "Isha", time: formatPrayerTime(times.isha, timeFormat), date: times.isha },
      ]);

      // Schedule prayer notifications for fallback times
      await localNotifications.schedulePrayerNotifications([
        { name: "Fajr", time: formatPrayerTime(times.fajr, timeFormat), date: times.fajr },
        { name: "Dhuhr", time: formatPrayerTime(times.dhuhr, timeFormat), date: times.dhuhr },
        { name: "Asr", time: formatPrayerTime(times.asr, timeFormat), date: times.asr },
        { name: "Maghrib", time: formatPrayerTime(times.maghrib, timeFormat), date: times.maghrib },
        { name: "Isha", time: formatPrayerTime(times.isha, timeFormat), date: times.isha },
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
  };

  // Helper function to format time from API
  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    if (timeFormat === '12') {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    }
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  };

  // Helper function to parse time string to Date
  const parseTimeToDate = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

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
  }, [location.latitude, location.longitude, timeFormat]);

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
          <Card className={`p-3 border-0 transition-colors ${
            isNext ? "bg-primary text-primary-foreground" : "bg-card"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isNext ? "bg-primary-foreground/20" : "bg-primary/10"
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
    <div className="min-h-screen bg-background pb-24">
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
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 blur-xl"></div>
              <div className="relative bg-card/50 backdrop-blur-sm rounded-xl border border-primary/20 px-6 py-3">
                <div className="text-2xl font-mono font-bold text-primary tracking-wider">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
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
        <PrayerCountdown />

        {/* Daily Ayah */}
        <DailyAyah />

        {/* Daily Hadith */}
        <DailyHadith />

        {/* Notification Settings */}
        <NotificationSettings />

        {/* Dhikr Reminder */}
        <DhikrReminder />

        {/* Quick Access */}
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/qaza')}
          >
            <Calendar className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-sm">Qaza Tracker</p>
            <p className="text-xs text-muted-foreground">Manage missed prayers</p>
          </Card>
          <Card 
            className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/ramadan')}
          >
            <BookOpen className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-sm">Ramadan Mode</p>
            <p className="text-xs text-muted-foreground">Fasting & Quran tracker</p>
          </Card>
          <Card 
            className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/zakat')}
          >
            <Calculator className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-sm">Zakat Calculator</p>
            <p className="text-xs text-muted-foreground">Calculate your zakat</p>
          </Card>
          <Card 
            className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/quiz')}
          >
            <Trophy className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-sm">Islamic Quiz</p>
            <p className="text-xs text-muted-foreground">Test your knowledge</p>
          </Card>
          <Card 
            className="p-4 cursor-pointer hover:bg-accent/50 transition-colors col-span-2"
            onClick={() => navigate('/names-of-allah')}
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
          </Card>
        )}

        {/* Next Prayer Countdown */}
        {initialLoad ? (
          <CountdownCardSkeleton />
        ) : nextEventCountdown ? (
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">{nextEventCountdown.name}</p>
                  <p className="text-xs text-muted-foreground">in {nextEventCountdown.countdown}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{nextEventCountdown.time}</p>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Prayer Times */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Prayer Times</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="max-w-[120px] truncate">{location.locationName}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLocationSearch(!showLocationSearch)}
                className="text-xs"
              >
                {showLocationSearch ? "Cancel" : "Change"}
              </Button>
            </div>
          </div>

          {/* Location Search */}
          {showLocationSearch && (
            <div className="p-3 bg-muted/30 rounded-lg space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Search city (e.g., Karachi, London, Dubai)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                  className="flex-1"
                />
                <Button
                  onClick={searchLocation}
                  disabled={searching}
                  size="sm"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Try: Karachi, Islamabad, Lahore, Dubai, London, New York, etc.
              </p>
            </div>
          )}

          {loadingAPI ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <PrayerTimeSkeleton key={`skeleton-${i}`} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {prayerCards}
            </div>
          )}
        </div>

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
  );
}
