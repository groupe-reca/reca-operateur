export { haversineDistanceMeters } from './distance';
export { createGpsEngine } from './gpsEngine';
export type { GpsEngine, GpsEngineDependencies } from './gpsEngine';
export { createGpsSimulator } from './simulator';
export type { GpsFixOptions, GpsSimulator } from './simulator';
export { DEFAULT_GPS_THRESHOLDS } from './types';
export type {
  ActiveResidence,
  GpsCoordinate,
  GpsEngineEvent,
  GpsEventListener,
  GpsPosition,
  GpsThresholds,
  NextResidence,
} from './types';
