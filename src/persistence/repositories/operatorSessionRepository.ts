import type { OperatorSession } from '@/domain/entities';

import type { Db, SqlParam } from '../types';
import { createRepository } from './createRepository';

const COLUMNS = [
  'id',
  'user_id',
  'mission_id',
  'opened_at',
  'closed_at',
  'app_version',
  'battery_level',
  'offline_mode',
];

function toRow(session: OperatorSession): SqlParam[] {
  return [
    session.id,
    session.userId,
    session.missionId,
    session.openedAt,
    session.closedAt,
    session.appVersion,
    session.batteryLevel,
    session.offlineMode === null ? null : session.offlineMode ? 1 : 0,
  ];
}

function fromRow(row: Record<string, unknown>): OperatorSession {
  return {
    id: row.id as string,
    userId: (row.user_id as string | null) ?? null,
    missionId: (row.mission_id as string | null) ?? null,
    openedAt: row.opened_at as string,
    closedAt: (row.closed_at as string | null) ?? null,
    appVersion: (row.app_version as string | null) ?? null,
    batteryLevel: (row.battery_level as number | null) ?? null,
    offlineMode: row.offline_mode === null || row.offline_mode === undefined ? null : Boolean(row.offline_mode),
  };
}

export function createOperatorSessionRepository(db: Db) {
  return createRepository<OperatorSession>(db, 'operator_sessions', COLUMNS, toRow, fromRow);
}
