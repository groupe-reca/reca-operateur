// docs/04-GPS-Engine.md "Détection GPS" — one fix, whatever its origin (real
// expo-location sensor or the test simulator — not decided/wired this
// sprint, see plans.md).
export type GpsPosition = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  headingDegrees: number | null;
  speedMetersPerSecond: number | null;
  timestamp: Date;
};

export type GpsCoordinate = { latitude: number; longitude: number };

// docs/04 "Paramètres" — values are the documented defaults. Two fields
// (`maxAccuracyMeters`, `gpsLostTimeoutSeconds`) have NO numeric value given
// by docs/04 (it only says "seuil configuré" / "attendre le retour du
// signal") — defaults below are placeholders pending product validation,
// not an invented business rule (the *behaviour* — filter/detect — is
// documented, only the number is missing).
export type GpsThresholds = {
  approachRadiusMeters: number;
  workRadiusMeters: number;
  completionRadiusMeters: number;
  headingValidationSeconds: number;
  radiusEntryValidationSeconds: number;
  radiusExitValidationSeconds: number;
  adjacentResidenceTravelTimeSeconds: number;
  /** @assumption pas de valeur numérique dans docs/04 — à valider. */
  maxAccuracyMeters: number;
  /** @assumption pas de valeur numérique dans docs/04 — à valider. */
  gpsLostTimeoutSeconds: number;
};

export const DEFAULT_GPS_THRESHOLDS: GpsThresholds = {
  approachRadiusMeters: 250,
  workRadiusMeters: 30,
  completionRadiusMeters: 50,
  headingValidationSeconds: 3,
  radiusEntryValidationSeconds: 5,
  radiusExitValidationSeconds: 5,
  adjacentResidenceTravelTimeSeconds: 5,
  maxAccuracyMeters: 50,
  gpsLostTimeoutSeconds: 15,
};

export type ActiveResidence = {
  missionItemId: string;
  coordinate: GpsCoordinate;
  /** Overrides `workRadiusMeters` for this residence — docs/03 "rayon de détection". */
  detectionRadiusMeters: number | null;
};

export type NextResidence = {
  missionItemId: string;
  coordinate: GpsCoordinate;
};

// docs/04 "Événements publiés" — observability only, never a business
// transition by themselves (those go through the State Machine commands).
export type GpsEngineEvent =
  | { type: 'HeadingChanged'; headingDegrees: number; at: string }
  | { type: 'GpsLost'; at: string }
  | { type: 'GpsRecovered'; at: string }
  | { type: 'GpsAccuracyChanged'; accuracyMeters: number; accepted: boolean; at: string };

export type GpsEventListener = (event: GpsEngineEvent) => void;
