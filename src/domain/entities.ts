import type { MissionItemState } from './status';

// Local entity shapes — fields reused verbatim from docs/03-Data-Architecture.md
// (Mission/MissionItem) and docs/09-State-Machine.md (StateTransition example
// type). No invented fields. camelCase in TS; the SQL columns are snake_case
// (see src/persistence/repositories/*).

export type MissionStatus = 'ASSIGNED' | 'READY' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export type Mission = {
  id: string;
  date: string | null;
  route: string | null;
  operator: string | null;
  equipment: string | null;
  status: MissionStatus;
  scheduledStartAt: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MissionItem = {
  id: string;
  missionId: string;
  contractId: string | null;
  ordre: number;
  address: string;
  latitude: number | null;
  longitude: number | null;
  detectionRadiusMeters: number | null;
  status: MissionItemState;
  enRouteAt: string | null;
  enApprocheAt: string | null;
  enCoursAt: string | null;
  termineeAt: string | null;
  travelTimeSeconds: number | null;
  interventionTimeSeconds: number | null;
  notes: string | null;
  problemCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransitionSource = 'GPS' | 'MANUAL' | 'SYSTEM' | 'RECOVERY' | 'ADMIN';

export type StateTransition = {
  id: string;
  missionId: string;
  missionItemId: string | null;
  fromState: string;
  toState: string;
  source: TransitionSource;
  occurredAtUtc: string;
  occurredAtLocal: string;
  timezone: string;
  gpsAccuracyMeters: number | null;
  latitude: number | null;
  longitude: number | null;
  reason: string | null;
};

export type SyncOperationStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export type SyncOperation = {
  id: string;
  entityType: string;
  entityId: string;
  operation: string;
  payload: string;
  status: SyncOperationStatus;
  createdAt: string;
  syncedAt: string | null;
};

export type OperatorSession = {
  id: string;
  userId: string | null;
  missionId: string | null;
  openedAt: string;
  closedAt: string | null;
  appVersion: string | null;
  batteryLevel: number | null;
  offlineMode: boolean | null;
};

export type Problem = {
  id: string;
  missionItemId: string;
  code: string;
  note: string | null;
  reportedAt: string;
  resolvedAt: string | null;
};

export type MissionAlertLevel = 'danger' | 'warning' | 'info';

export type MissionAlertRecord = {
  id: string;
  missionItemId: string;
  level: MissionAlertLevel;
  text: string;
  createdAt: string;
};
