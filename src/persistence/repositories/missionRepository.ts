import type { Mission } from '@/domain/entities';

import type { Db, SqlParam } from '../types';
import { createRepository } from './createRepository';

const COLUMNS = [
  'id',
  'date',
  'route',
  'operator',
  'equipment',
  'status',
  'scheduled_start_at',
  'actual_start_at',
  'actual_end_at',
  'created_at',
  'updated_at',
];

function toRow(mission: Mission): SqlParam[] {
  return [
    mission.id,
    mission.date,
    mission.route,
    mission.operator,
    mission.equipment,
    mission.status,
    mission.scheduledStartAt,
    mission.actualStartAt,
    mission.actualEndAt,
    mission.createdAt,
    mission.updatedAt,
  ];
}

function fromRow(row: Record<string, unknown>): Mission {
  return {
    id: row.id as string,
    date: (row.date as string | null) ?? null,
    route: (row.route as string | null) ?? null,
    operator: (row.operator as string | null) ?? null,
    equipment: (row.equipment as string | null) ?? null,
    status: row.status as Mission['status'],
    scheduledStartAt: (row.scheduled_start_at as string | null) ?? null,
    actualStartAt: (row.actual_start_at as string | null) ?? null,
    actualEndAt: (row.actual_end_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function createMissionRepository(db: Db) {
  return createRepository<Mission>(db, 'missions', COLUMNS, toRow, fromRow);
}
