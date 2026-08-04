import AsyncStorage from '@react-native-async-storage/async-storage';

// Single point of contact for persisting the operator's detection-radii
// overrides (docs/02) — no component/context imports `@react-native-async-
// storage/async-storage` directly for this. Device preference, not mission
// data (src/persistence/ is for the local-first SQLite mission model,
// docs/07/docs/08 — this is a plain UI setting, a different concern).
export type DetectionRadiiOverride = {
  approachRadiusMeters?: number;
  workRadiusMeters?: number;
};

export type DetectionRadiiStorage = {
  load(): Promise<DetectionRadiiOverride>;
  save(value: DetectionRadiiOverride): Promise<void>;
};

const STORAGE_KEY = '@reca-operateur/detectionRadii';

export function createAsyncStorageDetectionRadii(): DetectionRadiiStorage {
  return {
    async load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return {};
        const { approachRadiusMeters, workRadiusMeters } = parsed as DetectionRadiiOverride;
        return {
          ...(typeof approachRadiusMeters === 'number' ? { approachRadiusMeters } : {}),
          ...(typeof workRadiusMeters === 'number' ? { workRadiusMeters } : {}),
        };
      } catch {
        // Corrupted/unreadable storage — fall back to the engine's own
        // defaults rather than crashing the app over a saved preference.
        return {};
      }
    },
    async save(value) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    },
  };
}
