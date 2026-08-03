import * as Location from 'expo-location';

import type { GpsPosition } from '@/engines/gps';

// Single point of contact for `expo-location` — no component/engine imports
// it directly (docs/02). Foreground tracking only: docs/04 never documents a
// background-tracking requirement, and inventing one would pull in extra
// Android background-location permissions/Play Store review for no
// documented gain.
export type LocationProvider = {
  // Resolves once permission has been requested; `granted: false` means the
  // operator refused it — the caller must keep working with no live fix
  // (already the default behaviour every engine has had since Sprint 011-012,
  // never a crash).
  start(onFix: (fix: GpsPosition) => void): Promise<{ granted: boolean }>;
  stop(): void;
};

export function createExpoLocationProvider(): LocationProvider {
  let subscription: Location.LocationSubscription | null = null;

  return {
    async start(onFix) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { granted: false };
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          // docs/04 documents the GPS Engine's own validation delays
          // (heading/radius) numerically but never a sensor sampling cadence
          // — @assumption, same status as `maxAccuracyMeters`/
          // `gpsLostTimeoutSeconds` (src/engines/gps/types.ts).
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          onFix({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracyMeters: location.coords.accuracy ?? Number.POSITIVE_INFINITY,
            // expo-location reports -1 for "unknown heading", never a
            // negative real bearing — normalized to `null` (docs/04's own
            // "cap" field is optional).
            headingDegrees:
              location.coords.heading != null && location.coords.heading >= 0 ? location.coords.heading : null,
            speedMetersPerSecond: location.coords.speed ?? null,
            timestamp: new Date(location.timestamp),
          });
        }
      );
      return { granted: true };
    },
    stop() {
      subscription?.remove();
      subscription = null;
    },
  };
}
