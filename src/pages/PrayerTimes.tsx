import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Loader2, Search, Navigation, X, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PrayerAlarmControl } from "@/components/PrayerAlarmControl";
import { useToast } from "@/hooks/use-toast";
import { getTimeFormat, getPrayerSettings, setPrayerSettings } from "@/lib/storage";
import { AladhanAPI } from "@/lib/aladhan-api";

interface PrayerTime {
  name: string;
  time: string;
  date?: Date;
}

const PrayerTimes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [location, setLocation] = useState<string>("Fetching location...");
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [hijriDate, setHijriDate] = useState<string>("");
  const [timeFormat, setTimeFormatState] = useState<'12' | '24'>('24');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [nextPrayerName, setNextPrayerName] = useState<string>("");
  const [nextEventCountdown, setNextEventCountdown] = useState<{ name: string; time: string; countdown: string } | null>(null);
  const [loadingAPI, setLoadingAPI] = useState(false);

  useEffect(() => {
    setTimeFormatState(getTimeFormat());
  }, []);

  // Load prayer times using Aladhan API with offline fallback
  const loadPrayerTimes = async (latitude: number, longitude: number, locationName?: string) => {
    setLoading(true);
    setLoadingAPI(true);
    
    try {
      // Check if we have cached data
      const hasValidCache = AladhanAPI.isCachedDataValid();
      
      if (!hasValidCache) {
        // Fetch fresh data for current month
        await AladhanAPI.fetchMonthlyCalendar(
          latitude,
          longitude,
          undefined,
          undefined,
          1 // Pakistan/Karachi method
        );
      }

      // Get today's prayer times
      const timings = await AladhanAPI.getTodaysPrayerTimes(latitude, longitude, 1);
      
      setPrayers([
        { name: "Fajr", time: formatTime(timings.Fajr) },
        { name: "Dhuhr", time: formatTime(timings.Dhuhr) },
        { name: "Asr", time: formatTime(timings.Asr) },
        { name: "Maghrib", time: formatTime(timings.Maghrib) },
        { name: "Isha", time: formatTime(timings.Isha) },
      ]);

      // Get next prayer countdown
      const nextEvent = await AladhanAPI.getNextEventCountdown(latitude, longitude, 1, false);
      if (nextEvent) {
        setNextPrayerName(nextEvent.name);
        setNextEventCountdown(nextEvent);
      }

      setLocation(locationName || "Current Location");
      setPrayerSettings({ latitude, longitude, locationName: locationName || "Current Location" });
    } catch (error) {
      console.error('Failed to load API prayer times:', error);
      // Fallback to offline calculation
      const { calculatePrayerTimes, formatPrayerTime } = await import('@/lib/prayer-calculator');
      const times = calculatePrayerTimes(latitude, longitude, new Date());
      
      setPrayers([
        { name: "Fajr", time: formatPrayerTime(times.fajr, timeFormat) },
        { name: "Dhuhr", time: formatPrayerTime(times.dhuhr, timeFormat) },
        { name: "Asr", time: formatPrayerTime(times.asr, timeFormat) },
        { name: "Maghrib", time: formatPrayerTime(times.maghrib, timeFormat) },
        { name: "Isha", time: formatPrayerTime(times.isha, timeFormat) },
      ]);

      const { getNextPrayer } = await import('@/lib/prayer-calculator');
      const nextPrayer = getNextPrayer(latitude, longitude);
      if (nextPrayer) {
        setNextPrayerName(nextPrayer.name);
      }

      setLocation(locationName || "Current Location");
      setPrayerSettings({ latitude, longitude, locationName: locationName || "Current Location" });
    } finally {
      setLoading(false);
      setLoadingAPI(false);
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

  // Fetch Hijri date from API (optional)
  const fetchHijriDate = async () => {
    try {
      const today = new Date();
      const response = await fetch(
        `https://api.aladhan.com/v1/gToH/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`
      );
      if (response.ok) {
        const data = await response.json();
        const hijri = data.data.hijri;
        setHijriDate(`${hijri.day} ${hijri.month.en} ${hijri.year}`);
      }
    } catch {
      // Hijri date is optional
    }
  };

  const useCurrentLocation = async () => {
    setLoading(true);
    try {
      if (!navigator.geolocation) {
        throw new Error("Location services not supported by your browser");
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      await loadPrayerTimes(latitude, longitude, "Current Location");
      setShowLocationInput(false);
      toast({ title: "Location updated successfully" });
    } catch (error: any) {
      console.error('Error fetching prayer times for alarm:', error);
      
      // Handle specific geolocation errors gracefully
      let errorMessage = "Could not get your location";
      if (error.code === 1) {
        errorMessage = "Location permission denied. Please enable location access or search manually.";
      } else if (error.code === 2) {
        errorMessage = "Location unavailable. Please check your GPS or search manually.";
      } else if (error.code === 3) {
        errorMessage = "Location request timed out. Please try again or search manually.";
      }
      
      toast({ 
        title: errorMessage, 
        variant: "destructive",
        description: "You can search for your city manually below."
      });
      setShowLocationInput(true);
    } finally {
      setLoading(false);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      // Use CORS proxy to avoid CORS issues
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
      
      const response = await fetch(
        proxyUrl + apiUrl,
        { 
          headers: { 
            'User-Agent': 'IslamicCompanion/1.0',
            'Origin': window.location.origin
          } 
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const results = await response.json();
      
      if (results.length === 0) {
        toast({ 
          title: "Location not found", 
          description: "Please try a different city name",
          variant: "destructive" 
        });
        return;
      }

      const result = results[0];
      const locationName = result.display_name.split(",").slice(0, 2).join(", ");
      
      await loadPrayerTimes(parseFloat(result.lat), parseFloat(result.lon), locationName);
      setShowLocationInput(false);
      setSearchQuery("");
      toast({ 
        title: `Prayer times for ${locationName}`,
        description: "Location updated successfully"
      });
    } catch (error: any) {
      console.error('Search error:', error);
      
      let errorMessage = "Failed to search location";
      if (error.message.includes('CORS')) {
        errorMessage = "Search blocked by browser. Please use location services instead.";
      } else if (error.message.includes('403')) {
        errorMessage = "Search service unavailable. Please try again later.";
      }
      
      toast({ 
        title: errorMessage, 
        variant: "destructive",
        description: "Try using your current location or a different search term."
      });
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const saved = getPrayerSettings();
      
      if (saved.latitude && saved.longitude) {
        await loadPrayerTimes(saved.latitude, saved.longitude, saved.locationName);
      } else {
        await useCurrentLocation();
      }
      
      fetchHijriDate();
    };

    init();
  }, [timeFormat]);

  // Update countdown every minute
  useEffect(() => {
    const updateCountdown = async () => {
      try {
        const settings = getPrayerSettings();
        if (settings.latitude && settings.longitude) {
          const nextEvent = await AladhanAPI.getNextEventCountdown(
            settings.latitude,
            settings.longitude,
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

    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Prayer Times</h1>
            <button onClick={() => setShowLocationInput(!showLocationInput)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[180px]">{location}</span>
            </button>
          </div>
        </div>

        {showLocationInput && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Set Location</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowLocationInput(false)} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter city name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchLocation()}
                className="flex-1"
              />
              <Button onClick={searchLocation} disabled={searching || !searchQuery.trim()} size="icon">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={useCurrentLocation} disabled={loading}>
              <Navigation className="w-4 h-4 mr-2" />
              Use Current Location
            </Button>
          </Card>
        )}

        {hijriDate && (
          <Card className="p-3 bg-primary text-primary-foreground border-0">
            <p className="text-center font-arabic">{hijriDate}</p>
          </Card>
        )}

        {/* Next Prayer Countdown */}
        {nextEventCountdown && (
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
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
        )}

        {/* Refresh Button */}
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={async () => {
            const settings = getPrayerSettings();
            if (settings.latitude && settings.longitude) {
              await loadPrayerTimes(settings.latitude, settings.longitude, settings.locationName);
              toast({ title: "Prayer times updated" });
            }
          }}
          disabled={loadingAPI}
        >
          {loadingAPI ? (
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

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {prayers.map((prayer, index) => (
              <Card key={index} className={`p-3 border-0 ${
                prayer.name === nextPrayerName ? "bg-primary text-primary-foreground" : "bg-card"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{prayer.name}</h3>
                    {prayer.name === nextPrayerName && <p className="text-xs opacity-80">Next Prayer</p>}
                  </div>
                  <div className="text-xl font-bold font-mono">{prayer.time}</div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <PrayerAlarmControl />
      </div>
    </div>
  );
};

export default PrayerTimes;
