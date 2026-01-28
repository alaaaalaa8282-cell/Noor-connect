import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import qiblaCompass from "@/assets/qibla-compass.jpg";

const Qibla = () => {
  const navigate = useNavigate();
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [location, setLocation] = useState<string>("Detecting location...");
  const [distance, setDistance] = useState<string>("");

  useEffect(() => {
    const calculateQibla = async () => {
      try {
        if (!navigator.geolocation) {
          throw new Error("Geolocation is not supported by your browser");
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        });

        const { latitude, longitude } = position.coords;
        
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
      } catch (error) {
        console.error("Error calculating Qibla:", error);
        setLocation("Unable to detect location");
      }
    };

    calculateQibla();

    // Device orientation
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setDeviceHeading(360 - event.alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  const compassRotation = qiblaDirection - deviceHeading;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Islamic geometric pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='1'%3E%3Cpath d='M30 30l15-15v30L30 30zm0 0L15 15v30l15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full backdrop-blur-sm bg-card/50 hover:bg-card/80 border border-border/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground font-serif">Qibla Compass</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{location}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center shadow-glow">
            <Compass className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>

        {/* Main Compass Card */}
        <Card className="relative overflow-hidden border-0 shadow-elegant">
          <div className="absolute inset-0 bg-gradient-primary" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          
          <div className="relative p-8 text-primary-foreground">
            <div className="text-center space-y-6">
              {/* Compass container */}
              <div className="relative w-72 h-72 mx-auto">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full bg-primary-foreground/5 shadow-glow" />
                
                {/* Compass circle with degree markings */}
                <div className="absolute inset-2 rounded-full border-4 border-primary-foreground/30 backdrop-blur-sm">
                  {/* Degree markers */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <div
                      key={deg}
                      className="absolute w-1 h-4 bg-primary-foreground/50 left-1/2 -translate-x-1/2 rounded-full"
                      style={{
                        top: '4px',
                        transformOrigin: `center ${132}px`,
                        transform: `translateX(-50%) rotate(${deg}deg)`
                      }}
                    />
                  ))}
                  
                  {/* Fine degree markers */}
                  {Array.from({ length: 72 }, (_, i) => i * 5).map((deg) => (
                    <div
                      key={`fine-${deg}`}
                      className="absolute w-0.5 h-2 bg-primary-foreground/20 left-1/2 -translate-x-1/2"
                      style={{
                        top: '4px',
                        transformOrigin: `center ${132}px`,
                        transform: `translateX(-50%) rotate(${deg}deg)`
                      }}
                    />
                  ))}
                </div>

                {/* Rotating compass base with cardinal directions */}
                <div
                  className="absolute inset-4 transition-transform duration-300 ease-out"
                  style={{ transform: `rotate(${-deviceHeading}deg)` }}
                >
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 text-lg font-bold text-primary-foreground">N</div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm opacity-70">S</div>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-sm opacity-70">W</div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-70">E</div>
                </div>

                {/* Qibla compass pointing to Qibla */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="transition-transform duration-500 ease-out"
                    style={{ transform: `rotate(${compassRotation}deg)` }}
                  >
                    <img 
                      src={qiblaCompass} 
                      alt="Qibla Direction" 
                      className="w-36 h-36 drop-shadow-2xl"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Your heading indicator (golden arrow at top) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
                  <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[14px] border-l-transparent border-r-transparent border-b-primary drop-shadow-lg" 
                    style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))' }}
                  />
                </div>
              </div>

              {/* Direction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary-foreground/10 rounded-xl backdrop-blur-sm border border-primary-foreground/20">
                  <p className="text-xs opacity-75 mb-1">Qibla Direction</p>
                  <p className="text-3xl font-bold">{Math.round(qiblaDirection)}°</p>
                </div>
                <div className="p-4 bg-primary-foreground/10 rounded-xl backdrop-blur-sm border border-primary-foreground/20">
                  <p className="text-xs opacity-75 mb-1">Your Heading</p>
                  <p className="text-3xl font-bold">{Math.round(deviceHeading)}°</p>
                </div>
              </div>

              {/* Distance */}
              {distance && (
                <div className="flex items-center justify-center gap-2 text-sm opacity-75">
                  <Navigation className="w-4 h-4" />
                  <span>{distance}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Instructions Card */}
        <Card className="p-5 backdrop-blur-sm bg-muted/30 border-border/50">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-gold flex items-center justify-center">
                <Navigation className="w-3 h-3 text-primary-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">How to use</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hold your device flat and rotate your body until the Kaaba icon points upward toward the golden arrow. When aligned, you're facing Qibla.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Qibla;
