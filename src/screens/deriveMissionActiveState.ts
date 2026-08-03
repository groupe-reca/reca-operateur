import type { MissionContextValue } from '@/context/MissionContext';
import type { MissionAlertLevel } from '@/domain/entities';
import type { SyncState } from '@/types/sync';

// docs/07 status vocabulary -> presentation SyncState — same 1:1 mapping as
// deriveMissionScreenState.ts/deriveEndOfMissionState.ts (kept local rather
// than shared to avoid a premature abstraction over a 5-entry map).
const SYNC_STATUS_MAP: Record<MissionContextValue['synchronizationState']['status'], SyncState> = {
  SYNCED: 'synced',
  SYNCING: 'syncing',
  PENDING: 'pending',
  OFFLINE: 'offline',
  ERROR: 'error',
};

export type MissionActiveAlert = {
  level: MissionAlertLevel;
  text: string;
};

export type MissionActiveState = {
  secteur: string;
  date: string | null;
  equipment: string | null;
  residenceCount: number;
  syncState: SyncState;
  connectivityStatus: MissionContextValue['offlineState']['status'];
  alerts: MissionActiveAlert[];
};

// docs/11 "Mission active": consulter la mission, démarrer, vérifier la
// préparation hors ligne, voir le nombre de résidences, voir les alertes
// importantes, voir l'équipement. `null` unless there's an actual mission
// still waiting to be started — `requestMissionStart` (state-machine) only
// allows READY -> IN_PROGRESS (docs/09 Mission graph), ASSIGNED is never
// produced anywhere in this repo (see plans.md), so READY is the only
// state this screen needs to recognize.
export function deriveMissionActiveState(
  ctx: Pick<MissionContextValue, 'mission' | 'allMissionItems' | 'missionAlerts' | 'synchronizationState' | 'offlineState'>
): MissionActiveState | null {
  const { mission, allMissionItems, missionAlerts, synchronizationState, offlineState } = ctx;
  if (!mission || mission.status !== 'READY') return null;

  return {
    secteur: mission.route ?? '—',
    date: mission.date,
    equipment: mission.equipment,
    residenceCount: allMissionItems.length,
    syncState: SYNC_STATUS_MAP[synchronizationState.status],
    connectivityStatus: offlineState.status,
    alerts: missionAlerts.map((alert) => ({ level: alert.level, text: alert.text })),
  };
}
