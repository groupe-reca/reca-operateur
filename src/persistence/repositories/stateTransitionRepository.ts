import type { StateTransition } from '@/domain/entities';

import type { Db, SqlParam } from '../types';
import { createRepository } from './createRepository';

const COLUMNS = [
  'id',
  'mission_id',
  'mission_item_id',
  'from_state',
  'to_state',
  'source',
  'occurred_at_utc',
  'occurred_at_local',
  'timezone',
  'gps_accuracy_meters',
  'latitude',
  'longitude',
  'reason',
];

function toRow(transition: StateTransition): SqlParam[] {
  return [
    transition.id,
    transition.missionId,
    transition.missionItemId,
    transition.fromState,
    transition.toState,
    transition.source,
    transition.occurredAtUtc,
    transition.occurredAtLocal,
    transition.timezone,
    transition.gpsAccuracyMeters,
    transition.latitude,
    transition.longitude,
    transition.reason,
  ];
}

function fromRow(row: Record<string, unknown>): StateTransition {
  return {
    id: row.id as string,
    missionId: row.mission_id as string,
    missionItemId: (row.mission_item_id as string | null) ?? null,
    fromState: row.from_state as string,
    toState: row.to_state as string,
    source: row.source as StateTransition['source'],
    occurredAtUtc: row.occurred_at_utc as string,
    occurredAtLocal: row.occurred_at_local as string,
    timezone: row.timezone as string,
    gpsAccuracyMeters: (row.gps_accuracy_meters as number | null) ?? null,
    latitude: (row.latitude as number | null) ?? null,
    longitude: (row.longitude as number | null) ?? null,
    reason: (row.reason as string | null) ?? null,
  };
}

export function createStateTransitionRepository(db: Db) {
  return createRepository<StateTransition>(db, 'state_transitions', COLUMNS, toRow, fromRow);
}
