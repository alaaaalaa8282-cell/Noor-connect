import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Loader2, LocateFixed, RefreshCw, Navigation, MapPin } from 'lucide-react';
import { GeolocationService, type LocationCoordinates } from '@/lib/geolocation-service';
import {
  calculateDistanceToKaabaKm,
  calculateQiblaBearing,
  getCardinalDirection,
  normalizeDegrees,
  shortestSignedAngle,
  isFacingQibla,
  getRotationInstruction,
  type QiblaResult,
} from '@/lib/qibla';
import { useI18n } from '@/hooks/useI18n';

// ─── Types ────────────────────────────────────────────────────
type CompassState =
  | 'idle'
  | 'activating'
  | 'active'
  | 'permission-required'
  | 'denied'
  | 'unsupported'
  | 'no-data';

type DeviceOrientationConstructorWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<string>;
};

// ─── Constants ────────────────────────────────────────────────
const ALIGNMENT_THRESHOLD_DEG = 8;
const HEADING_SMOOTHING = 0.12;
const SENSOR_TIMEOUT_MS = 8000;
const LS_CALIBRATION_SHOWN = 'qibla-calibration-shown-v2';

// ─── Colors ───────────────────────────────────────────────────
const THEME = {
  primary: '#d4af37',      // Classic gold
  primaryLight: '#f4d03f',
  accent: '#b8860b',       // Dark goldenrod
  accentLight: '#daa520',  // Goldenrod
  cream: '#fdf5e6',        // Old lace cream
  creamDark: '#f5e6d3',    // Darker cream
  white: '#ffffff',
  offWhite: '#faf8f5',     // Warm white
  warmWhite: '#f9f6f0',    // Creamy white background
  text: '#2c2416',         // Dark brown text
  textLight: '#5c4a32',    // Medium brown
  textMuted: '#8b7355',    // Light brown
  success: '#d4af37',      // Gold for success
  // Aliases for backward compatibility
  surface: '#fdf5e6',      // = cream
  surfaceLight: '#f5e6d3', // = creamDark
  dark: '#f5e6d3',         // = creamDark
  darker: '#f9f6f0',       // = warmWhite
};

// Tick marks every 5 degrees
const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);

// ─── Kaaba SVG Icon ─────────────────────────────────────────────
const KaabaIcon = ({ size = 40 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Base */}
    <rect x="6" y="16" width="36" height="28" rx="2" fill={THEME.surface} stroke={THEME.accent} strokeWidth="2" />
    {/* Roof */}
    <path d="M6 16 L24 6 L42 16" fill={THEME.darker} stroke={THEME.accent} strokeWidth="2" strokeLinejoin="round" />
    {/* Door */}
    <rect x="17" y="26" width="14" height="18" rx="1" fill={THEME.accent} opacity="0.9" />
    {/* Kiswa bands */}
    <line x1="6" y1="24" x2="42" y2="24" stroke={THEME.accent} strokeWidth="1.5" opacity="0.6" />
    <line x1="6" y1="32" x2="42" y2="32" stroke={THEME.accent} strokeWidth="1" opacity="0.4" />
    {/* Golden thread detail */}
    <rect x="23" y="26" width="2" height="18" fill={THEME.accentLight} opacity="0.8" />
  </svg>
);

// ─── Decorative Ornament ─────────────────────────────────────────
const IslamicOrnament = () => (
  <svg width="120" height="24" viewBox="0 0 120 24" fill="none" className="opacity-30">
    <path d="M60 2 L60 22" stroke={THEME.accent} strokeWidth="1" />
    <circle cx="60" cy="12" r="4" stroke={THEME.accent} strokeWidth="1" fill="none" />
    <path d="M20 12 Q40 2 60 12 Q80 22 100 12" stroke={THEME.accent} strokeWidth="1" fill="none" />
    <circle cx="20" cy="12" r="2" fill={THEME.accent} />
    <circle cx="100" cy="12" r="2" fill={THEME.accent} />
  </svg>
);

// ─── Component ────────────────────────────────────────────────
const QiblaCompassModern = () => {
  const { t: ti18n } = useI18n();

  // ── Location State ───────────────────────────────────────────
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [qiblaResult, setQiblaResult] = useState<QiblaResult | null>(null);
  const [cityName, setCityName] = useState<string>('');

  // ── Compass State ────────────────────────────────────────────
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [compassState, setCompassState] = useState<CompassState>('idle');
  const [showCalibrationHint, setShowCalibrationHint] = useState(false);
  const [sensorError, setSensorError] = useState<string | null>(null);

  // ── Refs ─────────────────────────────────────────────────────
  const orientationListenerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const sensorTimeoutRef = useRef<number | null>(null);
  const hasSensorEventRef = useRef(false);
  const smoothedHeadingRef = useRef<number | null>(null);
  const calibrationShownRef = useRef(false);
  const hapticFiredRef = useRef(false);
  const motionListenerRef = useRef<{ remove: () => void } | null>(null);
  const distanceUpdateIntervalRef = useRef<number | null>(null);

  // ── Error Handler ───────────────────────────────────────────
  const handleSensorError = useCallback((err: unknown) => {
    const msg = err instanceof Error ? err.message : 'Sensor error';
    console.error('QiblaCompass sensor error:', msg);
    setSensorError(msg);
    setCompassState('unsupported');
  }, []);

  // ── Stop Tracking ───────────────────────────────────────────
  const stopCompassTracking = useCallback(() => {
    if (orientationListenerRef.current) {
      window.removeEventListener('deviceorientationabsolute', orientationListenerRef.current, true);
      window.removeEventListener('deviceorientation', orientationListenerRef.current, true);
      orientationListenerRef.current = null;
    }
    if (sensorTimeoutRef.current !== null) {
      window.clearTimeout(sensorTimeoutRef.current);
      sensorTimeoutRef.current = null;
    }
    if (motionListenerRef.current) {
      motionListenerRef.current.remove();
      motionListenerRef.current = null;
    }
    if (distanceUpdateIntervalRef.current !== null) {
      window.clearInterval(distanceUpdateIntervalRef.current);
      distanceUpdateIntervalRef.current = null;
    }
    hasSensorEventRef.current = false;
    smoothedHeadingRef.current = null;
    setDeviceHeading(null);
  }, []);

  // ── Continuous Distance Updates ─────────────────────────────
  const startDistanceTracking = useCallback(() => {
    // Clear any existing interval
    if (distanceUpdateIntervalRef.current !== null) {
      window.clearInterval(distanceUpdateIntervalRef.current);
    }

    // Update distance every second (GPS only, no API calls)
    distanceUpdateIntervalRef.current = window.setInterval(async () => {
      if (!location) return;

      try {
        // Get fresh location with high accuracy but allow cached results (5 seconds old to reduce geolocation calls)
        const freshPosition = await GeolocationService.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 5000, // Allow 5-second-old cached positions
        });

        // Only update if position changed significantly (more than 10 meters)
        const distanceMoved = calculateDistanceToKaabaKm(
          freshPosition.latitude, 
          freshPosition.longitude
        ) - calculateDistanceToKaabaKm(location.latitude, location.longitude);

        if (Math.abs(distanceMoved) > 0.01) { // 10 meters = 0.01 km
          setLocation(freshPosition);
          
          const bearing = calculateQiblaBearing(freshPosition.latitude, freshPosition.longitude);
          const distanceKm = calculateDistanceToKaabaKm(freshPosition.latitude, freshPosition.longitude);
          
          setQiblaResult(prev => prev ? {
            ...prev,
            bearing,
            distanceKm,
            cardinalDirection: getCardinalDirection(bearing),
            formattedBearing: `${Math.round(bearing)}°`,
            formattedDistance: `${Math.round(distanceKm)} km`,
          } : null);
        }
      } catch (error) {
        // Silent fail for continuous updates - don't show errors to user
        console.warn('Continuous location update failed:', error);
      }
    }, 3000); // Update every 3 seconds instead of 1 to reduce geolocation calls
  }, [location]);

  // ── Read Heading from Event ───────────────────────────────────
  const readHeadingFromEvent = useCallback((event: DeviceOrientationEvent): number | null => {
    const e = event as DeviceOrientationEvent & { webkitCompassHeading?: number };
    if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
      return normalizeDegrees(e.webkitCompassHeading);
    }
    if (event.alpha !== null && typeof event.alpha === 'number' && !Number.isNaN(event.alpha)) {
      return normalizeDegrees(360 - event.alpha);
    }
    return null;
  }, []);

  // ── Attach Compass Tracking ───────────────────────────────────
  const attachCompassTracking = useCallback(() => {
    try {
      stopCompassTracking();
      setCompassState('activating');
      setSensorError(null);

      const listener = (event: DeviceOrientationEvent) => {
        try {
          const rawHeading = readHeadingFromEvent(event);
          if (rawHeading === null) return;

          hasSensorEventRef.current = true;
          const prev = smoothedHeadingRef.current;
          const next =
            prev === null
              ? rawHeading
              : normalizeDegrees(prev + shortestSignedAngle(prev, rawHeading) * HEADING_SMOOTHING);

          smoothedHeadingRef.current = next;
          setDeviceHeading(next);
          setCompassState('active');
          
          if (!calibrationShownRef.current) {
            const alreadyShown = localStorage.getItem(LS_CALIBRATION_SHOWN) === 'true';
            if (!alreadyShown) {
              calibrationShownRef.current = true;
              setShowCalibrationHint(true);
              localStorage.setItem(LS_CALIBRATION_SHOWN, 'true');
              setTimeout(() => setShowCalibrationHint(false), 5000);
            }
          }
        } catch (err) {
          handleSensorError(err);
        }
      };

      orientationListenerRef.current = listener;
      window.addEventListener('deviceorientationabsolute', listener, true);
      window.addEventListener('deviceorientation', listener, true);

      // Capacitor Motion fallback
      try {
        import('@capacitor/motion')
          .then(({ Motion }) => {
            Motion.addListener('orientation', (evt) => {
              try {
                if (hasSensorEventRef.current) return;
                const alpha = (evt as unknown as { alpha: number }).alpha;
                if (typeof alpha === 'number' && !Number.isNaN(alpha)) {
                  const rawHeading = normalizeDegrees(360 - alpha);
                  hasSensorEventRef.current = true;
                  const prev = smoothedHeadingRef.current;
                  const next =
                    prev === null
                      ? rawHeading
                      : normalizeDegrees(prev + shortestSignedAngle(prev, rawHeading) * HEADING_SMOOTHING);
                  smoothedHeadingRef.current = next;
                  setDeviceHeading(next);
                  setCompassState('active');
                }
              } catch {}
            }).then((listener) => {
              motionListenerRef.current = listener;
            }).catch(() => {});
          })
          .catch(() => {});
      } catch {}

      sensorTimeoutRef.current = window.setTimeout(() => {
        if (!hasSensorEventRef.current) {
          stopCompassTracking();
          setCompassState('no-data');
        }
      }, SENSOR_TIMEOUT_MS);
    } catch (err) {
      handleSensorError(err);
    }
  }, [readHeadingFromEvent, stopCompassTracking, handleSensorError]);

  // ── Detect Compass Availability ───────────────────────────────
  const detectCompassAvailability = useCallback(() => {
    try {
      if (typeof window === 'undefined' || typeof window.DeviceOrientationEvent === 'undefined') {
        setCompassState('unsupported');
        return;
      }
      const ctor = window.DeviceOrientationEvent as DeviceOrientationConstructorWithPermission;
      if (typeof ctor.requestPermission === 'function') {
        setCompassState('permission-required');
        return;
      }
      attachCompassTracking();
    } catch (err) {
      handleSensorError(err);
    }
  }, [attachCompassTracking, handleSensorError]);

  // ── Enable Compass (with permission) ──────────────────────────
  const enableCompass = useCallback(async () => {
    try {
      setSensorError(null);
      if (typeof window === 'undefined' || typeof window.DeviceOrientationEvent === 'undefined') {
        setCompassState('unsupported');
        return;
      }
      const ctor = window.DeviceOrientationEvent as DeviceOrientationConstructorWithPermission;
      if (typeof ctor.requestPermission === 'function') {
        setCompassState('activating');
        try {
          const result = await ctor.requestPermission();
          if (result !== 'granted') {
            setCompassState('denied');
            return;
          }
        } catch {
          setCompassState('permission-required');
          return;
        }
      }
      attachCompassTracking();
    } catch (err) {
      handleSensorError(err);
    }
  }, [attachCompassTracking, handleSensorError]);

  // ── Refresh Location ───────────────────────────────────────────
  const refreshLocation = useCallback(async (mode: 'initial' | 'manual' = 'manual') => {
    mode === 'initial' ? setIsLoadingLocation(true) : setIsRefreshingLocation(true);
    setLocationError(null);
    
    try {
      const position = await GeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
      
      setLocation(position);
      
      const bearing = calculateQiblaBearing(position.latitude, position.longitude);
      const distanceKm = calculateDistanceToKaabaKm(position.latitude, position.longitude);
      
      setQiblaResult({
        bearing,
        distanceKm,
        cardinalDirection: getCardinalDirection(bearing),
        formattedBearing: `${Math.round(bearing)}°`,
        formattedDistance: `${Math.round(distanceKm)} km`,
      });

      // Start continuous distance tracking
      startDistanceTracking();

      // Skip city name fetching due to CORS issues - use coordinates instead
      setCityName('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to detect location.';
      setLocationError(message);
    } finally {
      setIsLoadingLocation(false);
      setIsRefreshingLocation(false);
    }
  }, [startDistanceTracking]);

  // ── Initialize ───────────────────────────────────────────────
  useEffect(() => {
    void refreshLocation('initial');
    detectCompassAvailability();
    return () => { stopCompassTracking(); };
  }, [detectCompassAvailability, refreshLocation, stopCompassTracking]);

  // ── Derived Values ─────────────────────────────────────────────
  const alignment = useMemo(() => {
    if (deviceHeading === null || qiblaResult === null) return null;
    return {
      isAligned: isFacingQibla(deviceHeading, qiblaResult.bearing, ALIGNMENT_THRESHOLD_DEG),
      instruction: getRotationInstruction(deviceHeading, qiblaResult.bearing),
    };
  }, [deviceHeading, qiblaResult]);

  const isLiveCompass = compassState === 'active' && deviceHeading !== null;
  const compassUnavailable = compassState === 'unsupported' || compassState === 'no-data';

  // ── Haptic Feedback on Alignment ─────────────────────────────
  useEffect(() => {
    if (deviceHeading === null || qiblaResult === null) return;
    
    const deviation = Math.abs(shortestSignedAngle(deviceHeading, qiblaResult.bearing));
    
    // Strong haptic when perfectly aligned
    if (alignment?.isAligned && !hapticFiredRef.current) {
      hapticFiredRef.current = true;
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    } 
    // Gentle haptic when getting close (within 15 degrees)
    else if (deviation <= 15 && deviation > 8 && !hapticFiredRef.current) {
      if ('vibrate' in navigator) navigator.vibrate(30);
    }
    // Reset when moving away from alignment
    else if (!alignment?.isAligned) {
      hapticFiredRef.current = false;
    }
  }, [alignment?.isAligned, deviceHeading, qiblaResult]);

  // ── Dial & Needle Rotation ────────────────────────────────────
  const dialRotation = deviceHeading === null ? 0 : -deviceHeading;
  // Convert mathematical degrees (0°=East) to compass degrees (0°=North)
  const needleRotation = qiblaResult ? (qiblaResult.bearing + 90) % 360 : 0;

  // ── Loading State ─────────────────────────────────────────────
  if (isLoadingLocation && !location) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6" style={{ background: THEME.cream }}>
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
          <Compass className="absolute inset-0 m-auto h-8 w-8 text-amber-600" />
        </div>
        <p className="text-amber-700/70 text-sm tracking-widest uppercase font-medium">Locating...</p>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────
  if (!location || !qiblaResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-6 text-center" style={{ background: THEME.cream }}>
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
          <Compass className="h-10 w-10 text-amber-600" />
        </div>
        <div>
          <p className="text-amber-900 font-semibold text-lg mb-2">Location Unavailable</p>
          <p className="text-amber-700/70 text-sm">{locationError ?? 'Please allow location access and try again.'}</p>
        </div>
        <button
          onClick={() => void refreshLocation('manual')}
          disabled={isRefreshingLocation}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30"
        >
          {isRefreshingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Try Again
        </button>
      </div>
    );
  }

  // ── Main Render ───────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-[80vh] relative overflow-hidden" style={{ background: THEME.cream }}>
      {/* ── Background Pattern ───────────────────────────────────── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${THEME.accent} 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Gradient Orbs - warm gold tones */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-30 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${THEME.creamDark} 0%, transparent 70%)`, filter: 'blur(60px)' }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${THEME.accentLight} 0%, transparent 70%)`, filter: 'blur(50px)' }} />

      {/* ── Header Section ────────────────────────────────────────── */}
      <div className="relative z-10 px-6 pt-8 pb-4">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <IslamicOrnament />
          </div>
          <p className="text-amber-600 text-xs tracking-[0.3em] uppercase font-semibold">Qibla Direction</p>
          
          {/* Large Bearing Display */}
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-6xl font-bold text-amber-900 tracking-tight">
              {Math.round(qiblaResult.bearing)}°
            </span>
            <span className="text-2xl font-medium text-amber-600">
              {qiblaResult.cardinalDirection}
            </span>
          </div>
          
          {/* Location Info */}
          <div className="flex items-center justify-center gap-2 text-amber-700/60 text-sm">
            <MapPin className="h-3.5 w-3.5" />
            {cityName ? (
              <span>{cityName}</span>
            ) : (
              <span>{location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Calibration Hint ────────────────────────────────────── */}
      {showCalibrationHint && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full text-xs font-medium bg-amber-100 border border-amber-300 text-amber-700 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg whitespace-nowrap">
          📱 Move in figure-8 pattern for accuracy
        </div>
      )}

      {/* ── Compass Section ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center relative z-10 py-4">
        <div className="relative" style={{ width: 'min(85vw, 380px)', height: 'min(85vw, 380px)' }}>
          
          {/* Outer Glow Ring */}
          <div 
            className="absolute inset-0 rounded-full transition-all duration-500"
            style={{
              background: alignment?.isAligned 
                ? `radial-gradient(circle, ${THEME.primary}20 0%, transparent 70%)`
                : `radial-gradient(circle, ${THEME.accent}10 0%, transparent 70%)`,
            }}
          />

          {/* Main Compass Ring */}
          <div
            className="absolute inset-2 rounded-full transition-shadow duration-500"
            style={{
              background: `linear-gradient(145deg, ${THEME.surface} 0%, ${THEME.dark} 100%)`,
              boxShadow: alignment?.isAligned && isLiveCompass
                ? `0 0 0 3px ${THEME.primary}, 0 0 60px ${THEME.primary}40, inset 0 0 40px rgba(0,0,0,0.4)`
                : `0 0 0 2px ${THEME.accent}30, 0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)`,
            }}
          >
            {/* Inner Ring Decoration */}
            <div 
              className="absolute inset-4 rounded-full border border-slate-600/30"
              style={{ background: `radial-gradient(circle at 30% 30%, ${THEME.surfaceLight}20 0%, transparent 50%)` }}
            />

            {/* Rotating Dial */}
            <div
              className="absolute inset-6 rounded-full"
              style={{
                transform: `rotate(${dialRotation}deg)`,
                transition: isLiveCompass ? 'transform 0.12s ease-out' : 'none',
              }}
            >
              {/* Degree Numbers */}
              {[0, 90, 180, 270].map((deg) => (
                <div
                  key={deg}
                  className="absolute inset-0 flex items-start justify-center"
                  style={{ transform: `rotate(${deg}deg)` }}
                >
                  <span 
                    className="text-xs font-bold mt-3"
                    style={{ color: deg === 0 ? THEME.accent : THEME.textMuted }}
                  >
                    {deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : 'W'}
                  </span>
                </div>
              ))}

              {/* Tick Marks */}
              {TICKS.map((angle) => {
                const isCardinal = angle % 90 === 0;
                const isMajor = angle % 30 === 0;
                return (
                  <div
                    key={angle}
                    className="absolute left-1/2 top-0 h-full -translate-x-1/2"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: isCardinal ? '3px' : isMajor ? '2px' : '1px',
                        height: isCardinal ? '18px' : isMajor ? '10px' : '6px',
                        background: isCardinal ? THEME.accent : isMajor ? THEME.textMuted : `${THEME.textMuted}40`,
                        marginTop: isCardinal ? '2px' : '8px',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Qibla Arrow Container */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Arrow (rotates to qibla bearing) */}
              <div
                style={{
                  transform: `rotate(${needleRotation}deg)`,
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Arrow Head */}
                <div className="relative">
                  <svg width="24" height="140" viewBox="0 0 24 140" className="overflow-visible">
                    {/* Arrow pointer */}
                    <polygon points="12,2 4,28 20,28" fill={alignment?.isAligned ? THEME.primary : THEME.accent} />
                    {/* Arrow shaft */}
                    <rect x="10" y="26" width="4" height="80" rx="2" fill={alignment?.isAligned ? THEME.primary : THEME.accent} opacity="0.9" />
                    {/* Tail indicator */}
                    <rect x="10" y="108" width="4" height="24" rx="2" fill={THEME.textMuted} opacity="0.3" />
                  </svg>
                  
                  {/* Glow effect when aligned */}
                  {alignment?.isAligned && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-24 rounded-full animate-pulse"
                      style={{ background: `linear-gradient(to bottom, ${THEME.primary}60, transparent)`, filter: 'blur(8px)' }} />
                  )}
                </div>
              </div>
            </div>

            {/* Center Kaaba Icon */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: `linear-gradient(145deg, ${THEME.surface}, ${THEME.dark})`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)',
                  border: `2px solid ${alignment?.isAligned ? THEME.primary : THEME.accent}50`,
                }}
              >
                <KaabaIcon size={36} />
              </div>
            </div>

            {/* Alignment Ring Animation */}
            {alignment?.isAligned && isLiveCompass && (
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 pointer-events-none"
                style={{ border: `2px solid ${THEME.primary}` }} />
            )}
          </div>
        </div>
      </div>

      {/* ── Status & Controls Section ───────────────────────────── */}
      <div className="relative z-10 px-6 pb-8 space-y-4">
        
        {/* Status Badge */}
        <div className="flex justify-center">
          {alignment?.isAligned ? (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-100 border border-amber-400 text-amber-700 animate-in fade-in zoom-in duration-300 shadow-sm">
              <Navigation className="h-4 w-4" />
              <span className="font-semibold text-sm tracking-wide">FACING QIBLA</span>
            </div>
          ) : isLiveCompass && alignment?.instruction ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-amber-200 text-amber-800 shadow-sm">
              <Compass className="h-4 w-4 text-amber-600" />
              <span className="text-sm">
                Turn <span className="font-semibold text-amber-600">{alignment.instruction.degrees}°</span> {alignment.instruction.direction}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 border border-amber-200/50 text-amber-700/60 text-sm">
              {compassState === 'permission-required' ? 'Tap Enable Compass' : 
               compassState === 'denied' ? 'Compass permission denied' :
               compassState === 'activating' ? 'Starting compass...' :
               compassUnavailable ? 'No compass sensor available' : 'Enable compass for live guidance'}
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          {/* Enhanced Distance Card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-amber-100 shadow-sm relative overflow-hidden">
            {/* Distance indicator decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            
            <div className="relative z-10">
              <p className="text-amber-700/60 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                <span>🕋</span> Distance to Kaaba
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-amber-900">
                  {qiblaResult.formattedDistance.split(' ')[0]}
                </span>
                <span className="text-sm text-amber-700/60 font-medium">
                  {qiblaResult.formattedDistance.split(' ')[1] || 'km'}
                </span>
              </div>
              
              {/* Distance Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-amber-700/50 mb-1">
                  <span>Very Near</span>
                  <span>Very Far</span>
                </div>
                <div className="h-2 bg-amber-200/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.min(100, Math.max(5, (qiblaResult.distanceKm / 15000) * 100))}%` 
                    }}
                  />
                </div>
              </div>
              
              <p className="text-amber-700/40 text-xs mt-2">
                {qiblaResult.distanceKm < 100 
                  ? `Very close! Only ${Math.round(qiblaResult.distanceKm * 1000)} meters away`
                  : qiblaResult.distanceKm < 1000
                  ? `${Math.round(qiblaResult.distanceKm * 1000)} meters away`
                  : qiblaResult.distanceKm < 5000
                  ? `${Math.round(qiblaResult.distanceKm / 50)} hours by car`
                  : `Approximately ${Math.round(qiblaResult.distanceKm / 800)} hours by plane`
                }
              </p>
            </div>
          </div>

          {/* Heading Card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-amber-100 shadow-sm">
            <p className="text-amber-700/60 text-xs uppercase tracking-wider mb-1">Current Heading</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-amber-900">
                {isLiveCompass ? `${Math.round(deviceHeading)}°` : '--'}
              </span>
              <span className="text-sm text-amber-700/60">
                {isLiveCompass ? getCardinalDirection(deviceHeading) : 'No compass'}
              </span>
            </div>
            <p className="text-amber-700/40 text-xs mt-1">
              {isLiveCompass ? 'Device orientation' : 'Enable compass for direction'}
            </p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              // Button press haptic
              if ('vibrate' in navigator) navigator.vibrate(50);
              void enableCompass();
            }}
            disabled={compassState === 'activating'}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            style={{
              background: isLiveCompass ? `${THEME.primary}20` : `${THEME.accent}15`,
              border: `1px solid ${isLiveCompass ? `${THEME.primary}50` : `${THEME.accent}40`}`,
              color: isLiveCompass ? THEME.accent : THEME.accent,
            }}
          >
            <div className="flex items-center gap-2">
              {compassState === 'activating' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Compass className="h-4 w-4" />
              )}
              {isLiveCompass ? 'Recalibrate' : 'Enable Compass'}
            </div>
            <span className="text-xs opacity-70 font-normal">
              {isLiveCompass ? 'Reset compass sensor' : 'Activate device compass'}
            </span>
          </button>

          <button
            onClick={() => {
              // Button press haptic
              if ('vibrate' in navigator) navigator.vibrate(50);
              void refreshLocation('manual');
            }}
            disabled={isRefreshingLocation}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 bg-white/60 hover:bg-white border border-amber-200 text-amber-800 shadow-sm"
          >
            <div className="flex items-center gap-2">
              {isRefreshingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
              Refresh Location
            </div>
            <span className="text-xs opacity-70 font-normal">
              Update GPS coordinates
            </span>
          </button>
        </div>

        {/* Sensor Error */}
        {sensorError && (
          <p className="text-center text-xs text-red-500/80">{sensorError}</p>
        )}
      </div>
    </div>
  );
};

export default QiblaCompassModern;
