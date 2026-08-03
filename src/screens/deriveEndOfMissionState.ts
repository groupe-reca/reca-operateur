import { isActiveItemState } from '@/engines/state-machine';
import type { MissionContextValue } from '@/context/MissionContext';
import type { SyncState } from '@/types/sync';

// docs/07 status vocabulary -> presentation SyncState — same 1:1 mapping as
// deriveMissionScreenState.ts (kept local rather than shared to avoid a
// premature abstraction over a 5-entry map).
const SYNC_STATUS_MAP: Record<MissionContextValue['synchronizationState']['status'], SyncState> = {
  SYNCED: 'synced',
  SYNCING: 'syncing',
  PENDING: 'pending',
  OFFLINE: 'offline',
  ERROR: 'error',
};

export type EndOfMissionProblemItem = {
  address: string;
  problemCode: string | null;
  note: string | null;
};

export type EndOfMissionState = {
  secteur: string;
  date: string | null;
  total: number;
  completedCount: number;
  problemItems: EndOfMissionProblemItem[];
  missionDurationSeconds: number;
  syncState: SyncState;
  pendingOperations: number;
};

function elapsedSeconds(sinceIso: string | null, now: Date): number {
  if (!sinceIso) return 0;
  return Math.max(0, Math.round((now.getTime() - new Date(sinceIso).getTime()) / 1000));
}

// Sprint 018 — mirrors deriveMissionScreenState.ts's shape and conventions
// (pure, `null` when not applicable, no ticking clock). `null` unless the
// mission is eligible to close: loaded, not already COMPLETED, and no
// MissionItem left WAITING or in an active state — the exact same condition
// `requestMissionComplete` (state-machine) enforces server-side, read from
// its own source (`isActiveItemState`) rather than duplicated here, so the
// two can never drift. A remaining PROBLEM/SKIPPED item does NOT block
// eligibility — that is the "terminee_avec_anomalies" case, a confirmed
// business rule (see memory.md), not an error state for this screen.
export function deriveEndOfMissionState(
  ctx: Pick<MissionContextValue, 'mission' | 'allMissionItems' | 'synchronizationState'>,
  now: Date
): EndOfMissionState | null {
  const { mission, allMissionItems, synchronizationState } = ctx;
  if (!mission || mission.status === 'COMPLETED') return null;

  const hasUnresolvedItem = allMissionItems.some(
    (item) => item.status === 'WAITING' || isActiveItemState(item.status)
  );
  if (hasUnresolvedItem) return null;

  const problemItems = allMissionItems
    .filter((item) => item.status === 'PROBLEM' || item.status === 'SKIPPED')
    .map((item) => ({ address: item.address, problemCode: item.problemCode, note: item.notes }));

  return {
    secteur: mission.route ?? '—',
    date: mission.date,
    total: allMissionItems.length,
    completedCount: allMissionItems.filter((item) => item.status === 'COMPLETED').length,
    problemItems,
    missionDurationSeconds: elapsedSeconds(mission.actualStartAt, now),
    syncState: SYNC_STATUS_MAP[synchronizationState.status],
    pendingOperations: synchronizationState.pendingCount,
  };
}
