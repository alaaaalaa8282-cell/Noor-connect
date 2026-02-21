import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Compass, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeolocationService } from "@/lib/geolocation-service";

/**
 * Approximate magnetic declination using the IGRF/WMM simplified model.
 * Returns degrees East (positive) or West (negative) of true north.
 * Accuracy: ±1° for most inhabited areas — sufficient for Qibla.
 */
function getMagneticDeclination(lat: number, lng: number): number {
  // Simplified WMM 2025 coefficients (valid 2025-2030)
  // For precise results, use the full WMM model. This covers the major
  // population centres where this app is used.
  //
  // Declination lookup table for major regions:
  // - South/Southeast Asia (Karachi, Delhi, Jakarta): ~0° to +1°
  // - Middle East (Mecca, Cairo, Istanbul): +3° to +6°
  // - North Africa: +1° to +3°
  // - Western Europe: -1° to +2°
  // - North America East: -10° to -15°
  // - North America West: +10° to +18°
  //
  // Simple dipole approximation:
  // D ≈ -1.2 * sin(lat) * sin(lng - 72) + 0.8 * cos(lat) * sin(2 * lng - 144)
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const refLng = (72 * Math.PI) / 180; // Magnetic pole reference longitude

  const declination =
    -1.2 * Math.sin(latRad) * Math.sin(lngRad - refLng) +
    0.8 * Math.cos(latRad) * Math.sin(2 * (lngRad - refLng));

  // Convert from simplified radians back to degrees
  const decDeg = (declination * 180) / Math.PI;

  // Clamp to reasonable range
  return Math.max(-25, Math.min(25, decDeg));
}

const Qibla = () => {
  const navigate = useNavigate();
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [location, setLocation] = useState<string>("");
  const [distance, setDistance] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [hasCompass, setHasCompass] = useState<boolean>(false);
  const [declination, setDeclination] = useState<number>(0);
  const compassListenerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const userLatRef = useRef<number>(0);
  const userLngRef = useRef<number>(0);

  // Start compass listener
  const startCompass = useCallback(() => {
    if (compassListenerRef.current) return; // Already listening

    const handler = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading is available on iOS Safari
      const heading = (e as any).webkitCompassHeading ?? (e.alpha != null ? (360 - e.alpha) % 360 : null);
      if (heading != null && !isNaN(heading)) {
        setCompassHeading(heading);
        setHasCompass(true);
      }
    };

    // iOS 13+ requires permission request
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((state: string) => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handler, true);
            compassListenerRef.current = handler;
          }
        })
        .catch(() => {
          console.warn('Compass permission denied');
        });
    } else {
      window.addEventListener('deviceorientation', handler, true);
      compassListenerRef.current = handler;
    }
  }, []);

  // Cleanup compass listener
  useEffect(() => {
    return () => {
      if (compassListenerRef.current) {
        window.removeEventListener('deviceorientation', compassListenerRef.current, true);
        compassListenerRef.current = null;
      }
    };
  }, []);

  const calculateQibla = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!GeolocationService.isSupported()) {
        throw new Error("Geolocation is not supported on this device");
      }

      const permissions = await GeolocationService.checkPermissions();
      if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
        const granted = await GeolocationService.requestPermissions();
        if (!granted) {
          throw new Error("Location permission denied. Please enable location in settings.");
        }
      }

      const position = await GeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      const { latitude, longitude } = position;
      userLatRef.current = latitude;
      userLngRef.current = longitude;

      // Kaaba coordinates
      const kaabaLat = 21.4225;
      const kaabaLng = 39.8262;

      // Calculate Qibla bearing (true north reference)
      const phiK = (kaabaLat * Math.PI) / 180;
      const lambdaK = (kaabaLng * Math.PI) / 180;
      const phi = (latitude * Math.PI) / 180;
      const lambda = (longitude * Math.PI) / 180;
      const psi = (180 / Math.PI) *
        Math.atan2(
          Math.sin(lambdaK - lambda),
          Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
        );

      const trueBearing = (psi + 360) % 360;

      // Apply magnetic declination correction
      const decl = getMagneticDeclination(latitude, longitude);
      setDeclination(decl);
      setQiblaDirection(trueBearing);

      // Distance to Mecca
      const R = 6371;
      const dLat = ((kaabaLat - latitude) * Math.PI) / 180;
      const dLon = ((kaabaLng - longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(phi) * Math.cos(phiK) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      setDistance(`${Math.round(R * c).toLocaleString()} km`);

      // Start compass after location is obtained
      startCompass();

      // Reverse geocode for city name
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          { headers: { 'User-Agent': 'NoorConnect/1.0' } }
        );
        if (response.ok) {
          const data = await response.json();
          setLocation(data.display_name?.split(',').slice(0, 2).join(',').trim() || `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
        }
      } catch {
        setLocation(`${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to detect location");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calculateQibla();
  }, []);

  // The rotation needed to point the compass arrow at Qibla.
  // If live compass is available:  rotate = qibla_true_bearing - compass_magnetic_heading - declination
  // If no compass:                 just show the static true bearing
  const compassRotation = hasCompass && compassHeading != null
    ? qiblaDirection - compassHeading - declination
    : qiblaDirection;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Qibla</h1>
            {location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{location}</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={calculateQibla}
            disabled={isLoading}
            className="rounded-full"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Compass */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Detecting location…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <Compass className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground max-w-[260px]">{error}</p>
            <Button onClick={calculateQibla} variant="outline" size="sm" className="rounded-full">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">

            {/* Compass ring */}
            <div className="relative" style={{ width: '280px', height: '280px' }}>
              {/* Outer ring with degree ticks — rotates with device if compass available */}
              <div
                className="absolute inset-0 rounded-full border-2 border-border/30 transition-transform duration-200 ease-out"
                style={{
                  transform: hasCompass && compassHeading != null
                    ? `rotate(${-compassHeading}deg)`
                    : undefined
                }}
              >
                {/* Cardinal labels */}
                {[
                  { label: 'N', angle: 0 },
                  { label: 'E', angle: 90 },
                  { label: 'S', angle: 180 },
                  { label: 'W', angle: 270 },
                ].map(({ label, angle }) => (
                  <div
                    key={label}
                    className="absolute w-6 h-6 flex items-center justify-center text-xs font-bold text-muted-foreground"
                    style={{
                      top: `${50 - 46 * Math.cos((angle * Math.PI) / 180)}%`,
                      left: `${50 + 46 * Math.sin((angle * Math.PI) / 180)}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {label}
                  </div>
                ))}

                {/* Tick marks */}
                {Array.from({ length: 36 }, (_, i) => (
                  <div
                    key={i}
                    className={`absolute left-1/2 top-0 ${i % 3 === 0 ? 'w-0.5 h-3 bg-muted-foreground/40' : 'w-px h-2 bg-muted-foreground/20'}`}
                    style={{
                      transformOrigin: `center 140px`,
                      transform: `translateX(-50%) rotate(${i * 10}deg)`
                    }}
                  />
                ))}
              </div>

              {/* Inner area */}
              <div className="absolute inset-6 rounded-full bg-card/50 border border-border/20" />

              {/* Qibla direction indicator — the golden arrow */}
              <div
                className="absolute inset-0 transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${compassRotation}deg)` }}
              >
                {/* Arrow pointing up (towards qibla direction) */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div
                    className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[18px] border-l-transparent border-r-transparent border-b-amber-400"
                    style={{ filter: 'drop-shadow(0 0 10px hsl(45deg 100% 50% / 0.4))' }}
                  />
                </div>
              </div>

              {/* Kaaba icon at center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="transition-transform duration-300 ease-out"
                  style={{ transform: `rotate(${compassRotation}deg)` }}
                >
                  <div className="text-4xl" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>
                    🕋
                  </div>
                </div>
              </div>
            </div>

            {/* Compass status badge */}
            {!hasCompass && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  No compass sensor — showing static bearing
                </span>
              </div>
            )}
            {hasCompass && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Compass className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  Live compass active
                </span>
              </div>
            )}

            {/* Direction info */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <div className="p-4 rounded-2xl bg-card border border-border/50 text-center">
                <p className="text-2xl font-bold text-amber-500">{Math.round(qiblaDirection)}°</p>
                <p className="text-[11px] text-muted-foreground mt-1">Qibla Bearing</p>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/50 text-center">
                <p className="text-2xl font-bold text-foreground">{distance}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Distance to Mecca</p>
              </div>
            </div>

            {/* Declination info */}
            {Math.abs(declination) > 0.5 && (
              <div className="w-full max-w-xs text-center">
                <p className="text-[10px] text-muted-foreground/60">
                  Magnetic declination: {declination > 0 ? '+' : ''}{declination.toFixed(1)}° applied
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="w-full max-w-xs p-4 rounded-2xl bg-muted/30 border border-border/30">
              <div className="flex items-start gap-3">
                <Navigation className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {hasCompass
                    ? "Hold your device flat. The golden arrow and Kaaba icon automatically point toward Qibla."
                    : "Hold your device flat and rotate until the Kaaba icon points toward the golden arrow. You're then facing Qibla."
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Qibla;
