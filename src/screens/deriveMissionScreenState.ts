import { colors } from '@/config/theme';
import type { MissionContextValue } from '@/context/MissionContext';
import type { MissionItem } from '@/domain/entities';
import { haversineDistanceMeters } from '@/engines/gps';
import type { SyncState } from '@/types/sync';

import type { ActiveResidenceState, MissionScreenState } from './missionScreenState';

const STATE_LABEL: Record<ActiveResidenceState, string> = {
  EN_ROUTE: 'EN ROUTE',
  APPROACHING: 'EN APPROCHE',
  IN_PROGRESS: 'EN COURS',
  PROBLEM: 'PROBLÈME',
};

const STATE_COLOR: Record<ActiveResidenceState, string> = {
  EN_ROUTE: colors.navigation,
  APPROACHING: colors.warning,
  IN_PROGRESS: colors.success,
  PROBLEM: colors.danger,
};

// docs/07 status vocabulary -> presentation SyncState (SyncIndicator/
// MissionCard) — direct 1:1 mapping, no logic of its own.
const SYNC_STATUS_MAP: Record<MissionContextValue['synchronizationState']['status'], SyncState> = {
  SYNCED: 'synced',
  SYNCING: 'syncing',
  PENDING: 'pending',
  OFFLINE: 'offline',
  ERROR: 'error',
};

function elapsedSeconds(sinceIso: string | null, now: Date): number {
  if (!sinceIso) return 0;
  return Math.max(0, Math.round((now.getTime() - new Date(sinceIso).getTime()) / 1000));
}

// Same "1,2 km" convention already used by missionScreenMocks.ts —
// straight-line distance (haversine), not a routed distance (no Directions
// API call wired here, that would be its own feature).
function formatDistanceMeters(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

// Sprint 017 (partie 1/N) — translates real MissionContext data into the
// exact shape MissionScreen already consumes (missionScreenMocks.ts), so
// MissionScreen itself never changes. `null` means no residence to show
// right now (no active item, no problem) — the real "Aucune mission" screen
// (docs/11 Phase 11) is out of scope this pass; the caller shows a minimal
// fallback instead of inventing that screen here.
//
// Several fields have no real data source yet and are left honestly empty/
// placeholder rather than invented (docs/10 "ne jamais masquer une erreur
// par une valeur fictive") — residence ETA (would need a routed duration,
// e.g. Directions API, not just a straight-line distance — its own
// feature), total mission ETA, tasks (no per-residence service list
// modeled yet), alerts (mission_alerts table exists but nothing populates
// it yet). `missionSeconds`/`timerSeconds` are computed once at derivation
// time, not a live ticking clock — same "Timer affiche, ne compte pas"
// convention already used everywhere else, MissionScreen was never given a
// ticker.
export function deriveMissionScreenState(
  ctx: Pick<
    MissionContextValue,
    'mission' | 'activeMissionItem' | 'nextMissionItems' | 'allMissionItems' | 'synchronizationState' | 'offlineState' | 'gpsState'
  >,
  now: Date
): MissionScreenState | null {
  const { mission, activeMissionItem, nextMissionItems, allMissionItems, synchronizationState, offlineState, gpsState } = ctx;
  if (!mission) return null;

  // PROBLEM items are deliberately excluded from ACTIVE_ITEM_STATES
  // (docs/09 "Résidence active" — see itemTransitions.ts), so
  // `activeMissionItem` alone can't surface one; look for it explicitly.
  const problemItem = allMissionItems.find((item) => item.status === 'PROBLEM') ?? null;
  const highlighted = problemItem ?? activeMissionItem;
  if (!highlighted) return null;

  const activeState: ActiveResidenceState = problemItem ? 'PROBLEM' : (highlighted.status as ActiveResidenceState);

  const total = allMissionItems.length;
  const completedCount = allMissionItems.filter((item) => item.status === 'COMPLETED').length;
  const index = Math.min(total, completedCount + 1);
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const timerSeconds =
    activeState === 'PROBLEM'
      ? 0 // overridden by `problem.frozenSeconds` below, MissionScreen ignores this field for PROBLEM.
      : activeState === 'IN_PROGRESS'
        ? elapsedSeconds(highlighted.enCoursAt, now)
        : activeState === 'APPROACHING'
          ? elapsedSeconds(highlighted.enApprocheAt, now)
          : elapsedSeconds(highlighted.enRouteAt, now);

  const missionSeconds = elapsedSeconds(mission.actualStartAt, now);

  const residences = nextMissionItems
    .filter((item): item is MissionItem & { latitude: number; longitude: number } => item.latitude !== null && item.longitude !== null)
    .slice(0, 5)
    .map((item, i) => ({ n: item.ordre, rank: (i + 1) as 1 | 2 | 3 | 4 | 5, coordinate: [item.longitude, item.latitude] as [number, number] }));

  // Real GPS fix (Sprint 017 partie 2/N) when the sensor has one — falls
  // back to the highlighted residence's own coordinate only while no fix
  // has arrived yet (permission not granted, or just not received one),
  // honest about the limitation without a numeric lie. Bug found testing on
  // a real device (2026-08-03): this used to always fall back, never
  // reading the real position at all.
  const livePosition = gpsState.available ? gpsState.position : null;
  const position = livePosition
    ? { longitude: livePosition.longitude, latitude: livePosition.latitude, heading: livePosition.headingDegrees }
    : { longitude: highlighted.longitude ?? 0, latitude: highlighted.latitude ?? 0, heading: 0 };

  // Straight-line distance from the live fix to the residence — real
  // number once a fix and the residence's own coordinates both exist,
  // otherwise the same honest "—" placeholder as before.
  const residenceDistanceLabel =
    livePosition && highlighted.latitude !== null && highlighted.longitude !== null
      ? formatDistanceMeters(
          haversineDistanceMeters(livePosition, { latitude: highlighted.latitude, longitude: highlighted.longitude })
        )
      : '—';

  return {
    activeState,
    color: STATE_COLOR[activeState],
    stateLabel: STATE_LABEL[activeState],
    mission: {
      missionId: mission.id,
      secteur: mission.route ?? '—',
      index,
      total,
      progressPct,
      missionSeconds,
      syncState: SYNC_STATUS_MAP[synchronizationState.status],
      totalEtaLabel: 'Estimation indisponible',
    },
    address: highlighted.address,
    residenceDistanceLabel,
    residenceEtaLabel: '—',
    timerSeconds,
    problem: problemItem
      ? {
          type: problemItem.problemCode ?? 'Problème',
          note: problemItem.notes ?? '',
          frozenSeconds: elapsedSeconds(problemItem.updatedAt, now),
        }
      : undefined,
    alerts: [],
    offline: offlineState.status !== 'ONLINE' ? { pendingOperations: synchronizationState.pendingCount } : undefined,
    map: {
      position,
      residences,
      routeWaypoints: [[position.longitude, position.latitude], ...residences.map((r) => r.coordinate)],
    },
  };
}

