/**
 * Qibla Direction Calculator
 * Provides accurate qibla bearing calculation and compass utilities
 */

// Kaaba coordinates - The Sacred Mosque in Mecca
export const KAABA_COORDINATES = {
  latitude: 21.4225,
  longitude: 39.8262,
} as const;

// Earth's radius in kilometers for distance calculations
const EARTH_RADIUS_KM = 6371;

/**
 * Normalize angle to 0-360 range
 */
export function normalizeDegrees(value: number): number {
  let normalized = value % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

/**
 * Calculate the shortest signed angle between two headings
 * Returns value between -180 and 180
 * Positive = turn right, Negative = turn left
 */
export function shortestSignedAngle(from: number, to: number): number {
  const difference = normalizeDegrees(to - from);
  // If difference > 180, it's shorter to turn the other way
  return difference > 180 ? difference - 360 : difference;
}

/**
 * Calculate absolute shortest angle distance
 */
export function shortestAngleDistance(from: number, to: number): number {
  return Math.abs(shortestSignedAngle(from, to));
}

/**
 * Get cardinal direction from angle
 */
export function getCardinalDirection(angle: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const normalized = normalizeDegrees(angle);
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate qibla bearing from any location using the spherical law of cosines
 * Returns bearing in degrees from true North (0° = North, 90° = East, etc.)
 */
export function calculateQiblaBearing(
  latitude: number,
  longitude: number
): number {
  const latRad = toRadians(latitude);
  const kaabaLatRad = toRadians(KAABA_COORDINATES.latitude);

  const dLng = toRadians(KAABA_COORDINATES.longitude - longitude);

  // Spherical law of cosines for qibla direction
  const y = Math.sin(dLng);
  const x =
    Math.cos(latRad) * Math.tan(kaabaLatRad) -
    Math.sin(latRad) * Math.cos(dLng);

  let bearing = toDegrees(Math.atan2(y, x));
  bearing = normalizeDegrees(bearing);

  return bearing;
}

/**
 * Calculate distance to Kaaba using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistanceToKaabaKm(
  latitude: number,
  longitude: number
): number {
  const latRad = toRadians(latitude);
  const kaabaLatRad = toRadians(KAABA_COORDINATES.latitude);
  const dLat = toRadians(KAABA_COORDINATES.latitude - latitude);
  const dLng = toRadians(KAABA_COORDINATES.longitude - longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(latRad) *
      Math.cos(kaabaLatRad) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km > 1000) {
    return `${(km / 1000).toFixed(1)}k km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Format bearing for display
 */
export function formatBearing(degrees: number): string {
  return `${Math.round(degrees)}°`;
}

/**
 * Check if user is facing qibla within threshold
 */
export function isFacingQibla(
  deviceHeading: number,
  qiblaBearing: number,
  thresholdDegrees: number = 7
): boolean {
  const deviation = Math.abs(shortestSignedAngle(deviceHeading, qiblaBearing));
  return deviation <= thresholdDegrees;
}

/**
 * Get rotation instruction text
 */
export function getRotationInstruction(
  deviceHeading: number,
  qiblaBearing: number
): { direction: 'left' | 'right'; degrees: number } {
  const delta = shortestSignedAngle(deviceHeading, qiblaBearing);
  return {
    direction: delta > 0 ? 'right' : 'left',
    degrees: Math.round(Math.abs(delta)),
  };
}

/**
 * Qibla calculation result type
 */
export interface QiblaResult {
  bearing: number;
  distanceKm: number;
  cardinalDirection: string;
  formattedBearing: string;
  formattedDistance: string;
}

/**
 * Calculate complete qibla information from coordinates
 */
export function calculateQibla(
  latitude: number,
  longitude: number
): QiblaResult {
  const bearing = calculateQiblaBearing(latitude, longitude);
  const distanceKm = calculateDistanceToKaabaKm(latitude, longitude);

  return {
    bearing,
    distanceKm,
    cardinalDirection: getCardinalDirection(bearing),
    formattedBearing: formatBearing(bearing),
    formattedDistance: formatDistance(distanceKm),
  };
}
