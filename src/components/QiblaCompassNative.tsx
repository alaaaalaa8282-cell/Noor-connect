import { useCallback, useEffect, useMemo, useState } from "react";
import { Compass, Loader2, LocateFixed, MapPin, RefreshCw, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/hooks/useI18n";
import { nativeQiblaService, type QiblaDirectionData } from "@/lib/native-qibla-service";
import { 
  calculateDistanceToKaabaKm, 
  getCardinalDirection, 
  normalizeDegrees 
} from "@/lib/qibla";

type CompassState = "idle" | "activating" | "active" | "permission-required" | "denied" | "unsupported" | "no-data";

interface CompassStateMeta {
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  label: string;
  help: string;
}

const ALIGNMENT_THRESHOLD_DEG = 7;
const KAABA_COORDINATES = { latitude: 21.4225, longitude: 39.8262 };

const COMPASS_STATE_META: Record<CompassState, CompassStateMeta> = {
  idle: {
    badgeVariant: "secondary",
    label: "compassIdle",
    help: "sensorNotActiveYet",
  },
  activating: {
    badgeVariant: "outline",
    label: "startingCompass",
    help: "holdPhoneSteady",
  },
  active: {
    badgeVariant: "default",
    label: "liveCompassActive",
    help: "liveHeadingDetected",
  },
  "permission-required": {
    badgeVariant: "outline",
    label: "permissionRequired",
    help: "tapEnableCompass",
  },
  denied: {
    badgeVariant: "destructive",
    label: "compassPermissionDenied",
    help: "allowMotionAccess",
  },
  unsupported: {
    badgeVariant: "secondary",
    label: "sensorUnsupported",
    help: "deviceNoCompassSensor",
  },
  "no-data": {
    badgeVariant: "secondary",
    label: "noSensorData",
    help: "noOrientationEvents",
  },
};

const CARDINAL_POINTS = [
  { label: "N", angle: 0 },
  { label: "E", angle: 90 },
  { label: "S", angle: 180 },
  { label: "W", angle: 270 },
];

const QiblaCompassNative = () => {
  const { t: ti18n } = useI18n();
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [qiblaData, setQiblaData] = useState<QiblaDirectionData | null>(null);
  const [compassState, setCompassState] = useState<CompassState>("idle");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  const startCompass = useCallback(async () => {
    try {
      console.log('🔄 Starting compass...');
      setCompassState("activating");
      setLocationError(null); // Clear previous errors

      const result = await nativeQiblaService.startCompass();

      console.log('Compass start result:', result);

      if (result.success) {
        setCompassState("active");
        console.log('✅ Compass started successfully:', result.message);
      } else {
        setCompassState("permission-required");
        setLocationError(result.message);
        console.error('❌ Compass start failed:', result.message);
      }
    } catch (error) {
      console.error("💥 Failed to start compass:", error);
      setCompassState("permission-required");
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setLocationError(errorMessage);
    }
  }, []);

  const stopCompass = useCallback(async () => {
    try {
      await nativeQiblaService.stopCompass();
      setCompassState("idle");
    } catch (error) {
      console.error("Failed to stop compass:", error);
    }
  }, []);

  const refreshLocation = useCallback(async () => {
    setIsRefreshingLocation(true);
    setLocationError(null);
    
    try {
      // The native plugin handles location updates automatically
      // We just need to restart the compass to get fresh data
      if (nativeQiblaService.getIsListening()) {
        await stopCompass();
        await startCompass();
      } else {
        await startCompass();
      }
    } catch (error) {
      console.error("Location refresh error:", error);
      setLocationError(error instanceof Error ? error.message : "Unable to detect location.");
    } finally {
      setIsRefreshingLocation(false);
      setIsLoadingLocation(false);
    }
  }, [startCompass, stopCompass]);

  useEffect(() => {
    // Don't auto-initialize - let user click the button
    console.log('Qibla component mounted, waiting for user interaction');

    // Set initial mock data for web to prevent error state
    if (!nativeQiblaService.getIsNative()) {
      console.log('Setting initial mock data for web platform');
      setQiblaData({
        isFacingQibla: false,
        compassAngle: 0,
        needleAngle: 245, // Approximate Qibla direction
        qiblaBearing: 245,
        latitude: 21.4225,
        longitude: 39.8262,
        accuracy: 1000
      });
      setDistanceKm(calculateDistanceToKaabaKm(21.4225, 39.8262));
    }

    return () => {
      stopCompass();
    };
  }, []);

  useEffect(() => {
    // Subscribe to Qibla direction changes
    const unsubscribe = nativeQiblaService.onQiblaDirectionChange((data: QiblaDirectionData) => {
      console.log('Qibla direction updated:', data);
      setQiblaData(data);
      
      if (data.latitude && data.longitude) {
        const distance = calculateDistanceToKaabaKm(data.latitude, data.longitude);
        setDistanceKm(distance);
      }
    });

    return unsubscribe;
  }, []);

  const isAligned = useMemo(() => {
    if (!qiblaData) return false;
    const angleDiff = Math.abs(normalizeDegrees(qiblaData.compassAngle - qiblaData.qiblaBearing));
    return angleDiff <= ALIGNMENT_THRESHOLD_DEG;
  }, [qiblaData]);

  const isLiveCompass = compassState === "active" && qiblaData !== null;
  const compassMeta = COMPASS_STATE_META[compassState];

  const turnInstruction = useMemo(() => {
    if (!qiblaData) {
      return ti18n('usePhysicalCompass');
    }

    const angleDiff = normalizeDegrees(qiblaData.qiblaBearing - qiblaData.compassAngle);
    const amount = Math.round(Math.abs(angleDiff));
    
    if (amount <= ALIGNMENT_THRESHOLD_DEG) {
      return ti18n('alignedWithQibla');
    }

    return angleDiff > 0 
      ? `${ti18n('turnRight')} ${amount} ${ti18n('deg')}` 
      : `${ti18n('turnLeft')} ${amount} ${ti18n('deg')}`;
  }, [qiblaData]);

  const dialRotation = qiblaData?.compassAngle ? -qiblaData.compassAngle : 0;
  const formattedHeading = qiblaData?.compassAngle ? `${Math.round(qiblaData.compassAngle)} deg` : "--";
  const formattedQibla = qiblaData?.qiblaBearing ? `${Math.round(qiblaData.qiblaBearing)} deg` : "--";
  const formattedDistance = distanceKm 
    ? distanceKm > 1000 
      ? `${(distanceKm / 1000).toFixed(1)}k km` 
      : `${Math.round(distanceKm)} km`
    : "--";

  if (isLoadingLocation && !qiblaData) {
    return (
      <div className="px-4 pb-20 pt-10">
        <Card className="mx-auto w-full max-w-md border-border/60 bg-card/80">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{ti18n('detectingLocationQibla')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!qiblaData && compassState !== "activating") {
    return (
      <div className="px-4 pb-20 pt-6">
        <Card className="mx-auto w-full max-w-md border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <TriangleAlert className="h-10 w-10 text-destructive" />
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{ti18n('unableToStartQibla')}</h2>
              <p className="text-sm text-muted-foreground">{locationError ?? ti18n('pleaseTryAgain')}</p>
            </div>
            <Button onClick={() => void refreshLocation()} disabled={isRefreshingLocation}>
              {isRefreshingLocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {ti18n('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4">
        <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-[#0f2f2f] via-[#194545] to-[#2c6868] text-white shadow-lg">
          <CardContent className="relative p-4">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#f5d19a]/25 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-[#a2f5d3]/15 blur-2xl" />

            <div className="relative flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-white/75">Qibla direction</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{formattedQibla}</p>
                <p className="text-sm text-white/75 truncate">
                  {qiblaData ? getCardinalDirection(qiblaData.qiblaBearing) : '--'} • {formattedDistance}
                </p>
              </div>
              <Badge className={`${isAligned ? "bg-emerald-500 text-white" : "bg-white/15 text-white hover:bg-white/15"} px-3 py-1 flex-shrink-0`}>
                {isAligned ? "✓ Aligned" : "Adjust"}
              </Badge>
            </div>

            <div className="relative mt-4 overflow-hidden rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isAligned ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span className="text-sm text-white/90 truncate">{turnInstruction}</span>
                </div>
                <span className="text-xs text-white/80 flex-shrink-0">{formattedDistance}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Compass className="h-4 w-4 text-primary" />
                  <span>Native Compass Status</span>
                </div>
                <p className="text-xs text-muted-foreground">{ti18n(compassMeta.help)}</p>
                {!isLiveCompass && compassState !== "unsupported" && compassState !== "denied" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    💡 Click "Enable Compass" to activate native tracking
                  </p>
                )}
              </div>
              <Badge variant={compassMeta.badgeVariant} className="px-3 py-1">{ti18n(compassMeta.label)}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/60 bg-muted/25 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-2 w-2 rounded-full ${isLiveCompass ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span className="text-xs font-medium">Native Sensor</span>
                </div>
                <p className="text-sm font-semibold">{isLiveCompass ? "Active" : "Inactive"}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/25 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-2 w-2 rounded-full ${isAligned ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span className="text-xs font-medium">Alignment</span>
                </div>
                <p className="text-sm font-semibold">{isAligned ? "Perfect" : "Adjust"}</p>
              </div>
            </div>

            <div className="relative mx-auto h-72 w-72 max-w-full sm:h-80 sm:w-80">
              <div className={`absolute inset-0 rounded-full border ${isAligned && isLiveCompass ? "border-emerald-500/70 shadow-lg shadow-emerald-500/30" : "border-primary/25 shadow-inner"} bg-gradient-to-b from-card to-muted/25`}>
                {isAligned && isLiveCompass && (
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-pulse" />
                )}
              </div>

              <div
                className="absolute inset-4 rounded-full border border-border/70 transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${dialRotation}deg)` }}
              >
                {Array.from({ length: 72 }).map((_, index) => {
                  const angle = index * 5;
                  const major = angle % 30 === 0;
                  const cardinal = angle % 90 === 0;
                  return (
                    <div
                      key={angle}
                      className="absolute inset-0"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      <div
                        className={`absolute inset-x-1/2 top-1 -translate-x-1/2 rounded-full ${
                          cardinal ? "h-3 w-[3px] bg-primary" : major ? "h-2 w-[2px] bg-primary/70" : "h-1 w-px bg-border/70"
                        }`}
                      />
                      {cardinal && (
                        <span className="absolute inset-x-1/2 top-5 -translate-x-1/2 text-xs font-bold text-primary">
                          {angle === 0 ? "N" : angle === 90 ? "E" : angle === 180 ? "S" : "W"}
                        </span>
                      )}
                    </div>
                  );
                })}
                
                {qiblaData && (
                  <div className="absolute inset-0" style={{ transform: `rotate(${qiblaData.qiblaBearing}deg)` }}>
                    <div className="absolute inset-x-1/2 top-2 -translate-x-1/2">
                      <div className="h-0 w-0 border-x-[6px] border-x-transparent border-b-[8px] border-b-emerald-400/60" />
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute inset-0">
                <div className="absolute inset-x-1/2 top-3 -translate-x-1/2">
                  <div className="relative">
                    <div className="h-0 w-0 border-x-[12px] border-x-transparent border-b-[20px] border-b-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                    <div className="absolute inset-x-1/2 top-2 -translate-x-1/2 h-0 w-0 border-x-[8px] border-x-transparent border-b-[12px] border-b-emerald-400" />
                  </div>
                </div>
              </div>

              {isLiveCompass && (
                <div className="absolute inset-x-1/2 top-2 -translate-x-1/2 text-center">
                  <div className="h-0 w-0 border-x-[8px] border-x-transparent border-b-[14px] border-b-primary" />
                  <p className="mt-1 text-[10px] font-semibold text-primary">PHONE FRONT</p>
                </div>
              )}

              <div className="absolute inset-x-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 border-background bg-gradient-to-b from-card to-muted/50 shadow-xl">
                <img src="/qibla3.png" alt="Qibla marker" className="h-10 w-10" />
                <p className="mt-1 text-[10px] font-bold text-muted-foreground">QIBLA</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-gradient-to-b from-muted/50 to-muted/25 p-3 text-center shadow-sm">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Qibla</p>
                <p className="text-lg font-bold text-primary">{formattedQibla}</p>
                <p className="text-xs text-muted-foreground">{qiblaData ? getCardinalDirection(qiblaData.qiblaBearing) : '--'}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-gradient-to-b from-muted/50 to-muted/25 p-3 text-center shadow-sm">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Heading</p>
                <p className="text-lg font-bold text-primary">{formattedHeading}</p>
                <p className="text-xs text-muted-foreground">Current</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-gradient-to-b from-muted/50 to-muted/25 p-3 text-center shadow-sm">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Distance</p>
                <p className="text-lg font-bold text-primary">{formattedDistance}</p>
                <p className="text-xs text-muted-foreground">To Kaaba</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button 
                className="w-full min-w-0" 
                onClick={() => void startCompass()} 
                disabled={compassState === "activating"}
                title={compassState === "active" ? "Recalibrate native compass sensor for better accuracy" : "Enable native device compass for live Qibla tracking"}
              >
                {compassState === "activating" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Compass className="mr-2 h-4 w-4" />}
                {isLiveCompass ? ti18n('recalibrate') : ti18n('enableCompass')}
              </Button>
              <Button
                variant="outline"
                className="w-full min-w-0"
                onClick={() => void refreshLocation()}
                disabled={isRefreshingLocation}
                title="Get fresh GPS coordinates for accurate Qibla direction"
              >
                {isRefreshingLocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
                Refresh Location
              </Button>
            </div>

            {locationError && locationError.includes('permission') && (
              <div className="mt-3 rounded-lg border border-amber-200/60 bg-amber-50/50 p-3">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
                  📱 Permission Required
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {locationError}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  💡 On iOS: Go to Settings → Safari → Motion & Orientation Access
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {qiblaData && qiblaData.latitude && qiblaData.longitude && (
          <Card className="border-border/60 bg-card/70">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Location Details</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-border/60 bg-muted/25 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Coordinates</p>
                  <p className="text-sm font-mono font-semibold">
                    {qiblaData.latitude.toFixed(5)}, {qiblaData.longitude.toFixed(5)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/25 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">GPS Accuracy</p>
                  <p className="text-sm font-semibold">
                    {qiblaData.accuracy ? `±${Math.round(qiblaData.accuracy)} m` : "Unknown"}
                  </p>
                </div>
                {locationError && (
                  <div className="rounded-lg border border-destructive/60 bg-destructive/10 p-3">
                    <p className="text-xs font-medium text-destructive">{locationError}</p>
                  </div>
                )}
                {!locationError && qiblaData.accuracy && qiblaData.accuracy > 50 && (
                  <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 p-3">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      💡 Consider "Refresh Location" for better accuracy
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <div className="h-4 w-4 rounded bg-amber-500" />
              <span>Native Implementation</span>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-200/60 bg-white/50 p-3">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">Enhanced Accuracy</p>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Using native Android sensors for improved precision
                </p>
              </div>
              <div className="rounded-lg border border-amber-200/60 bg-white/50 p-3">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  {nativeQiblaService.getIsNative() ? "✅ Native Active" : "⚠️ Web Fallback"}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {nativeQiblaService.getIsNative() 
                    ? "Native compass-qibla library is active" 
                    : "Running in web fallback mode"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QiblaCompassNative;
