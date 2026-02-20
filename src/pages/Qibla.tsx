import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Compass, AlertTriangle, RefreshCw, Settings, Sparkles, Target, Activity, Zap, Map, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import qiblaCompass from "@/assets/qibla-compass.jpg";
import { GeolocationService } from "@/lib/geolocation-service";

const Qibla = () => {
  const navigate = useNavigate();
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [location, setLocation] = useState<string>("Detecting location...");
  const [distance, setDistance] = useState<string>("");
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("compass");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate direction to a place
  const calculateDirection = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon);
    const brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
  };

  // Calculate Qibla direction to Kaaba
  const calculateQibla = async () => {
    try {
      setIsLoading(true);
      setError("");
      setIsRetrying(false);
      
      // Check if geolocation is supported
      if (!GeolocationService.isSupported()) {
        throw new Error("Geolocation is not supported on this device");
      }

      // Check current permission status
      const permissions = await GeolocationService.checkPermissions();
      setLocationPermission(permissions.location || permissions.coarseLocation || 'prompt');
      
      // Request permissions if not granted
      if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
        const granted = await GeolocationService.requestPermissions();
        if (!granted) {
          setLocationPermission('denied');
          throw new Error("Location permission denied. Please enable location access in your device settings.");
        }
        setLocationPermission('granted');
      }

      const position = await GeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      const { latitude, longitude } = position;
      
      // Kaaba coordinates
      const kaabaLat = 21.4225;
      const kaabaLng = 39.8262;

      // Calculate qibla direction
      const phiK = (kaabaLat * Math.PI) / 180.0;
      const lambdaK = (kaabaLng * Math.PI) / 180.0;
      const phi = (latitude * Math.PI) / 180.0;
      const lambda = (longitude * Math.PI) / 180.0;
      const psi = (180.0 / Math.PI) *
        Math.atan2(
          Math.sin(lambdaK - lambda),
          Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
        );
      
      setQiblaDirection((psi + 360) % 360);

      // Calculate distance to Mecca
      const R = 6371; // Earth's radius in km
      const dLat = ((kaabaLat - latitude) * Math.PI) / 180;
      const dLon = ((kaabaLng - longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((latitude * Math.PI) / 180) *
          Math.cos((kaabaLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;
      
      setDistance(`${Math.round(distanceKm).toLocaleString()} km to Mecca`);
      setLocation(`${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
      setLocationPermission('granted');
    } catch (error) {
      console.error("Error calculating Qibla:", error);
      const errorMessage = error instanceof Error ? error.message : "Unable to detect location";
      setError(errorMessage);
      setLocation("Unable to detect location");
      
      if (errorMessage.includes("permission denied")) {
        setLocationPermission('denied');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Retry function
  const retryLocationDetection = () => {
    setIsRetrying(true);
    calculateQibla();
  };

  // Only calculate Qibla on initial mount
  useEffect(() => {
    calculateQibla();
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Islamic geometric pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23d4af37" fill-opacity="1"%3E%3Cpath d="M30 30l15-15v30L30 30zm0 0L15 15v30l15-15z"/%3E%3C/g%3E%3C/svg%3E')`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Enhanced Header with glassmorphism effect */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full backdrop-blur-md bg-white/10 dark:bg-gray-900/20 hover:bg-white/20 dark:hover:bg-gray-800/30 border border-white/20 dark:border-gray-700/30 shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold text-foreground font-serif bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Qibla Compass
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="truncate max-w-[200px]">{location}</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-primary/60 to-primary/20 shadow-xl flex items-center justify-center">
            <Compass className="w-8 h-8 text-primary-foreground drop-shadow-lg" />
          </div>
        </div>

        {/* Tabs for Compass and Instructions */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border-slate-700/50">
            <TabsTrigger value="compass" className="flex items-center gap-2 data-[state=active]:bg-slate-700/50">
              <Compass className="w-4 h-4" />
              Compass
            </TabsTrigger>
            <TabsTrigger value="instructions" className="flex items-center gap-2 data-[state=active]:bg-slate-700/50">
              <Navigation className="w-4 h-4" />
              Instructions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compass" className="mt-6">
            {/* Premium Qibla Compass Card */}
            <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-slate-700/50 shadow-2xl">
              <div className="space-y-6">
                {/* Header with premium styling */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
                      <Compass className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Qibla Compass</h2>
                      <p className="text-sm text-slate-400">Find direction to Kaaba</p>
                    </div>
                  </div>
                  {isCalibrating && (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
                      <Activity className="w-3 h-3 mr-1 animate-pulse" />
                      Calibrating
                    </Badge>
                  )}
                </div>

                {/* Premium Compass Container */}
                <div className="relative mx-auto" style={{ width: '320px', height: '320px' }}>
                  {/* Outer decorative ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/20 shadow-inner">
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-600/30">
                      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/40">
                        
                        {/* Premium degree markers */}
                        {['N', 'E', 'S', 'W'].map((direction, index) => (
                          <div
                            key={direction}
                            className="absolute text-sm font-bold text-amber-400/90"
                            style={{
                              top: index === 0 ? '8px' : index === 2 ? 'auto' : '50%',
                              bottom: index === 2 ? '8px' : 'auto',
                              left: index === 3 ? '8px' : index === 1 ? 'auto' : '50%',
                              right: index === 1 ? '8px' : 'auto',
                              transform: index === 0 || index === 2 ? 'translateX(-50%)' : 'translateY(-50%)'
                            }}
                          >
                            {direction}
                          </div>
                        ))}
                        
                        {/* Fine degree markers */}
                        {Array.from({ length: 72 }, (_, i) => i % 3 === 0 && (
                          <div
                            key={`fine-${i}`}
                            className="absolute w-0.5 h-2 bg-gradient-to-t from-amber-500/40 to-transparent left-1/2 -translate-x-1/2"
                            style={{
                              top: '4px',
                              transformOrigin: `center ${156}px`,
                              transform: `translateX(-50%) rotate(${i * 5}deg)`
                            }}
                          />
                        ))}
                        
                        {/* Rotating compass base */}
                        <div
                          className="absolute inset-4 transition-transform duration-1000 ease-out"
                          style={{ transform: `rotate(${qiblaDirection}deg)` }}
                        >
                          {/* Cardinal directions with premium styling */}
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-lg font-bold text-amber-400 drop-shadow-lg">N</div>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-slate-400">S</div>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-400">E</div>
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-slate-400">W</div>
                        </div>
                        
                        {/* Premium Qibla indicator */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className="transition-transform duration-700 ease-out"
                            style={{ transform: `rotate(${qiblaDirection}deg)` }}
                          >
                            <div className="relative w-40 h-40 flex items-center justify-center">
                              {/* Central Kaaba indicator with premium styling */}
                              <div className="relative">
                                <div className="text-5xl filter drop-shadow-lg">🕋</div>
                                <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl animate-pulse"></div>
                              </div>
                              
                              {/* Premium compass image */}
                              <img 
                                src={qiblaCompass} 
                                alt="Qibla Direction" 
                                className="absolute w-36 h-36 drop-shadow-2xl opacity-90"
                                loading="lazy"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Premium golden arrow with enhanced effects */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                          <div className="relative">
                            <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[24px] border-l-transparent border-r-transparent border-b-amber-400 drop-shadow-2xl transition-all duration-500" 
                                 style={{ 
                                   filter: 'drop-shadow(0 0 20px hsl(45deg 100% 50% / 0.6))',
                                 }} />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Accuracy indicator */}
                  {accuracy > 0 && (
                    <div className="absolute -top-2 -right-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        accuracy < 10 ? 'bg-green-500/20 border-green-500/40 text-green-400' :
                        accuracy < 20 ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' :
                        'bg-red-500/20 border-red-500/40 text-red-400'
                      } border`}>
                        {accuracy}°
                      </div>
                    </div>
                  )}
                </div>

                {/* Premium Direction Info Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-2xl backdrop-blur-sm border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-amber-400" />
                      <p className="text-xs text-amber-400/80 font-medium">Qibla Direction</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">{Math.round(qiblaDirection)}°</p>
                    <p className="text-xs text-slate-400 mt-1">From North</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-2xl backdrop-blur-sm border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Navigation className="w-4 h-4 text-blue-400" />
                      <p className="text-xs text-blue-400/80 font-medium">Device Heading</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">{Math.round(deviceHeading)}°</p>
                    <p className="text-xs text-slate-400 mt-1">Current Direction</p>
                  </div>
                </div>

                {/* Distance with premium styling */}
                {distance && (
                  <div className="flex items-center justify-center gap-3 p-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 flex items-center justify-center">
                      <Navigation className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-400">{distance}</p>
                      <p className="text-xs text-slate-400">Distance to Mecca</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="instructions" className="mt-6">
            <Card className="p-5 backdrop-blur-sm bg-muted/30 border-border/50">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
                    <Navigation className="w-3 h-3 text-amber-400" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">How to use</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hold your device flat and rotate your body until the Kaaba icon points upward toward the golden arrow. When aligned, you're facing Qibla.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Qibla;
