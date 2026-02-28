export const KAABA_COORDINATES = {
  latitude: 21.4225,
  longitude: 39.8262,
} as const;

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function shortestSignedAngle(from: number, to: number): number {
  const difference = normalizeDegrees(to - from);
  return difference > 180 ? difference - 360 : difference;
}

export function shortestAngleDistance(from: number, to: number): number {
  return Math.abs(shortestSignedAngle(from, to));
}

export function getCardinalDirection(angle: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(normalizeDegrees(angle) / 45) % directions.length;
  return directions[index];
}

export function calculateQiblaBearing(latitude: number, longitude: number): number {
  const phi = (latitude * Math.PI) / 180;
  const phiK = (KAABA_COORDINATES.latitude * Math.PI) / 180;
  const lambda = (longitude * Math.PI) / 180;
  const lambdaK = (KAABA_COORDINATES.longitude * Math.PI) / 180;

  const bearingRadians = Math.atan2(
    Math.sin(lambdaK - lambda),
    Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda),
  );

  return normalizeDegrees((bearingRadians * 180) / Math.PI);
}

export function calculateDistanceToKaabaKm(latitude: number, longitude: number): number {
  const earthRadiusKm = 6371;
  const dLat = ((KAABA_COORDINATES.latitude - latitude) * Math.PI) / 180;
  const dLng = ((KAABA_COORDINATES.longitude - longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((latitude * Math.PI) / 180) *
      Math.cos((KAABA_COORDINATES.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}
