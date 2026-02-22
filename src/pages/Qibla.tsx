import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronUp, Loader2, RefreshCw, AlertTriangle, Paintbrush, Info } from "lucide-react";
import { GeolocationService } from "@/lib/geolocation-service";
import { AppBar } from "@/components/AppBar";
import { PageTransition } from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

/**
 * Approximate magnetic declination
 */
function getMagneticDeclination(lat: number, lng: number): number {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const refLng = (72 * Math.PI) / 180;

  const declination =
    -1.2 * Math.sin(latRad) * Math.sin(lngRad - refLng) +
    0.8 * Math.cos(latRad) * Math.sin(2 * (lngRad - refLng));
  const decDeg = (declination * 180) / Math.PI;
  return Math.max(-25, Math.min(25, decDeg));
}

const QIBLA_ICONS = [
  "/qibla.png",
  "/qibla2.png",
  "/qibla3.png"
];

const Qibla = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [hasCompass, setHasCompass] = useState<boolean>(true); // Assume true initially to avoid UI flicker
  const [iconIndex, setIconIndex] = useState<number>(0);
  const [requiresActivation, setRequiresActivation] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const compassListenerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const compassRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  const qiblaDirectionRef = useRef<number>(0);
  const declinationRef = useRef<number>(0);
  const hasCompassRef = useRef<boolean>(true);
  const eventReceivedRef = useRef<boolean>(false);

  useEffect(() => {
    hasCompassRef.current = hasCompass;
  }, [hasCompass]);

  // Smooth rotation properties
  const currentRotationRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  // Lerp function for smooth compass movement
  const lerp = (start: number, end: number, factor: number) => {
    // Handle 360 boundary wrap around perfectly
    let difference = end - start;
    while (difference < -180) difference += 360;
    while (difference > 180) difference -= 360;
    return start + difference * factor;
  };

  const updateCompassUI = useCallback(() => {
    // Smooth interpolation
    currentRotationRef.current = lerp(currentRotationRef.current, targetRotationRef.current, 0.15);

    // Update DOM directly bypassing React rendering to prevent lag
    if (compassRef.current) {
      if (hasCompassRef.current) {
        compassRef.current.style.transform = `rotate(${currentRotationRef.current}deg)`;
      } else {
        // If device has no sensor, keep it straight
        compassRef.current.style.transform = `rotate(0deg)`;
      }
    }

    if (textRef.current) {
      if (hasCompassRef.current) {
        // Calculate how much to turn
        // Current rotation modulo 360
        let rot = currentRotationRef.current % 360;
        if (rot < 0) rot += 360;

        const diff = rot > 180 ? 360 - rot : rot;
        const dir = rot > 180 ? "Right" : "Left";

        if (diff < 2) {
          textRef.current.innerHTML = `<span style="color:hsl(var(--primary)); font-weight:700">You are facing Qibla</span>`;
          // Optional: Add haptic feedback here if we add the plugin later
        } else {
          textRef.current.innerHTML = `Turn <span style="font-weight:700; color:hsl(var(--primary))">${dir}</span> ${Math.round(diff)}° <span style="font-size: 10px; opacity: 0.5; margin-left: 4px;">(${Math.round(rot)}°)</span>`;
        }
      } else {
        textRef.current.innerHTML = `Qibla is <span style="font-weight:700; color:hsl(var(--primary))">${Math.round(qiblaDirectionRef.current)}°</span> from North`;
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateCompassUI);
  }, []);

  const startCompass = useCallback(() => {
    if (compassListenerRef.current) return;

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(updateCompassUI);

    const handler = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading is available on iOS devices
      let heading = (e as any).webkitCompassHeading;

      if (heading == null && e.alpha != null) {
        // Fallback or absolute orientation
        // Check if alpha is actually absolute or if we should use absolute event
        heading = (360 - e.alpha) % 360;
      }

      if (heading != null && !isNaN(heading)) {
        eventReceivedRef.current = true;
        setHasCompass(true);
        setRequiresActivation(false);
        setPermissionState('granted');
        // Calculate qibla rotation. declination applies if heading is based on magnetic north instead of true north
        const isMagnetic = !(e as any).absolute && !('webkitCompassHeading' in e);
        const rotation = qiblaDirectionRef.current - heading - (isMagnetic ? declinationRef.current : 0);
        targetRotationRef.current = rotation;
      }
    };

    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((state: string) => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handler, true);
            compassListenerRef.current = handler;
            setPermissionState('granted');
            setRequiresActivation(false);
          } else {
            setHasCompass(false);
            setPermissionState('denied');
          }
        })
        .catch(() => {
          setHasCompass(false);
          setRequiresActivation(true); // Shows button to try again with gesture
        });
    } else {
      // Use deviceorientationabsolute on Android Chrome for accurate true north tracking
      const eventType = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
      window.addEventListener(eventType, handler, true);
      compassListenerRef.current = handler;

      // Check if we get data
      setTimeout(() => {
        if (!eventReceivedRef.current) {
          // If 2s passed and still no sensor data, we might need a user gesture
          setRequiresActivation(true);
        }
      }, 2000);
    }
  }, [updateCompassUI]);

  useEffect(() => {
    return () => {
      if (compassListenerRef.current) {
        const eventType = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
        window.removeEventListener(eventType, compassListenerRef.current, true);
        window.removeEventListener('deviceorientation', compassListenerRef.current, true);
        compassListenerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const calculateQibla = async () => {
    try {
      setIsLoading(true);
      setError("");
      eventReceivedRef.current = false; // Reset for new attempt

      const position = await GeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      const { latitude, longitude } = position;
      const kaabaLat = 21.4225;
      const kaabaLng = 39.8262;

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
      const decl = getMagneticDeclination(latitude, longitude);

      qiblaDirectionRef.current = trueBearing;
      declinationRef.current = decl;

      // If we don't have compass working yet, point it to true north bearing
      if (!compassListenerRef.current) {
        // Do not incorrectly rotate the physical ring if there is no continuous compass sensor tracking.
        if (compassRef.current) compassRef.current.style.transform = `rotate(0deg)`;
      }

      startCompass();
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to detect location");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialize = () => {
    calculateQibla();
  };

  // Initialization is handled via user gesture (handleInitialize)

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col pb-32">

        {/* App Bar matches the rest of the application */}
        <AppBar title={t('qibla') || "Qibla Direction"} />

        <div className="flex-1 flex flex-col items-center justify-center p-6 mt-4">
          {!isInitialized ? (
            <div className="flex flex-col items-center max-w-sm w-full gap-8 text-center animate-in fade-in zoom-in duration-500">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-32 h-32 rounded-[40px] bg-card border border-border shadow-xl flex items-center justify-center rotate-12">
                  <div className="absolute inset-[-1px] rounded-[40px] bg-gradient-to-br from-primary/20 to-transparent -z-10"></div>
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <RefreshCw className="w-10 h-10 text-primary animate-spin-slow" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Qibla Compass</h2>
                <p className="text-muted-foreground leading-relaxed px-4">
                  To find the precise direction of Kaaba, we need to access your device orientation sensors and location.
                </p>
              </div>

              <Button
                onClick={handleInitialize}
                size="lg"
                className="w-full max-w-[280px] h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground"
              >
                Start Compass
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                <Info className="w-3 h-3" />
                <span>Requires orientation and location access</span>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-spin"></div>
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute inset-0"></div>
              </div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Calibrating sensor…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 gap-5 bg-card/60 rounded-[32px] p-8 border border-border/50 shadow-sm max-w-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-2">
                <AlertTriangle className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-xl text-foreground text-center">Location Error</h3>
              <p className="text-sm text-muted-foreground text-center px-2 leading-relaxed">{error}</p>
              <button
                onClick={calculateQibla}
                className="mt-2 w-full px-6 py-3.5 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold shadow-[0_4px_14px_0_hsl(var(--primary)/0.3)] hover:translate-y-[-2px] transition-all active:translate-y-[1px]"
              >
                <RefreshCw className="w-5 h-5 mr-2" /> Try Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full max-w-sm relative">

              {/* Decorative Subtle Glowing Background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

              {/* Top Chevron pointing to "forward/device top" */}
              <div className="mb-6 z-10 flex flex-col items-center gap-2">
                <ChevronUp className="w-12 h-12 text-primary font-black drop-shadow-md animate-bounce" strokeWidth={4} />
                {!requiresActivation && hasCompass && eventReceivedRef.current && (
                  <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live Sensor</span>
                  </div>
                )}
              </div>

              {/* Compass Interactive Area */}
              <div className="relative flex items-center justify-center w-[300px] h-[300px]">

                {/* 1st Decorative Ring (Static) */}
                <div className="absolute inset-2 rounded-full border border-primary/10 -z-10" />

                {/* 2nd Decorative Ring (Dashed, Static) */}
                <div className="absolute inset-6 rounded-full border-[1.5px] border-dashed border-primary/20 -z-10" />

                {/* 3rd Decorative Solid Background */}
                <div className="absolute inset-10 rounded-full bg-card shadow-[inset_0_2px_20px_rgba(0,0,0,0.03)] border border-border/50 -z-10" />

                {/* Main Image acting as the compass dial. It will rotate toward the Qibla bearing */}
                <div className="relative w-[220px] h-[220px] flex items-center justify-center will-change-transform rounded-full drop-shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition-shadow duration-300">
                  <img
                    ref={compassRef}
                    src={QIBLA_ICONS[iconIndex]}
                    alt="Qibla Compass Icon"
                    className="w-full h-full object-contain absolute inset-0"
                    style={{
                      transition: hasCompass ? 'none' : 'transform 0.5s ease-out'
                    }}
                  />
                </div>
              </div>

              {/* Dynamic Text updated without React renders */}
              <div className="mt-14 w-full flex flex-col items-center gap-1 bg-card border border-border/40 py-5 px-8 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground/70 mb-1">Direction</span>
                <p
                  ref={textRef}
                  className="text-[20px] tracking-wide text-foreground w-full text-center min-h-[30px]"
                >
                  Aligning...
                </p>
              </div>

              {/* Premium Icon Switcher Container */}
              <div className="mt-10 flex flex-col w-full px-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-border"></div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-2">
                    <Paintbrush className="w-3.5 h-3.5" />
                    Style
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-border"></div>
                </div>

                <div className="flex justify-center gap-4">
                  {QIBLA_ICONS.map((icon, idx) => (
                    <button
                      key={idx}
                      onClick={() => setIconIndex(idx)}
                      className={`relative w-16 h-16 rounded-[20px] flex items-center justify-center p-3 transition-all duration-300 ease-out ${iconIndex === idx
                        ? "bg-card shadow-[0_8px_16px_-6px_hsl(var(--primary)/0.3)] ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 z-10"
                        : "bg-muted/40 border border-transparent hover:bg-muted opacity-60 hover:opacity-100 hover:scale-105"
                        }`}
                    >
                      <img src={icon} alt={`Style ${idx + 1}`} className="w-full h-full object-contain filter drop-shadow-sm" />
                      {iconIndex === idx && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-background rounded-full"></span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Information and Errors Container */}
              <div className="mt-8 flex flex-col gap-3 w-full px-2">
                {/* Activation Button if gesture needed */}
                {requiresActivation && (
                  <Button
                    onClick={() => {
                      if (compassListenerRef.current) {
                        const eventType = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
                        window.removeEventListener(eventType, compassListenerRef.current, true);
                        compassListenerRef.current = null;
                      }
                      startCompass();
                    }}
                    className="w-full py-6 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg flex items-center justify-center gap-2 animate-pulse"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Enable Compass Sensor
                  </Button>
                )}

                {/* Compass Error Fallback */}
                {!hasCompass && !requiresActivation && (
                  <div className="w-full px-5 py-3.5 relative overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm flex items-center gap-3">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-2xl"></div>
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <p className="text-amber-700 dark:text-amber-300 text-[13px] font-medium leading-snug">
                      Compass sensor not detected. Please check permissions or use an external compass to find <span className="font-bold">{Math.round(qiblaDirectionRef.current)}°</span> from North.
                    </p>
                  </div>
                )}

                {/* Usage Guide */}
                <div className="w-full px-5 py-4 relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-foreground">How to use carefully</h4>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      Place your phone on a flat surface away from metallic objects or electronics to avoid magnetic interference. Turn your phone until it's aligned to Qibla.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Qibla;
