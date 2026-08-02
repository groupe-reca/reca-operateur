import type { GpsCoordinate } from './types';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Great-circle distance — accurate enough for the radii involved here
// (tens/hundreds of metres), no need for a geodesic library.
export function haversineDistanceMeters(a: GpsCoordinate, b: GpsCoordinate): number {
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinDeltaLat = Math.sin(deltaLat / 2);
  const sinDeltaLon = Math.sin(deltaLon / 2);
  const h = sinDeltaLat * sinDeltaLat + Math.cos(lat1) * Math.cos(lat2) * sinDeltaLon * sinDeltaLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_METERS * c;
}
