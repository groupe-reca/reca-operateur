import type { MissionItem } from '@/domain/entities';
import type { MissionItemState } from '@/domain/status';

import type { Db, SqlParam } from '../types';
import { createRepository } from './createRepository';

const COLUMNS = [
  'id',
  'mission_id',
  'contract_id',
  'ordre',
  'address',
  'latitude',
  'longitude',
  'detection_radius_meters',
  'status',
  'en_route_at',
  'en_approche_at',
  'en_cours_at',
  'terminee_at',
  'travel_time_seconds',
  'intervention_time_seconds',
  'notes',
  'problem_code',
  'created_at',
  'updated_at',
];

function toRow(item: MissionItem): SqlParam[] {
  return [
    item.id,
    item.missionId,
    item.contractId,
    item.ordre,
    item.address,
    item.latitude,
    item.longitude,
    item.detectionRadiusMeters,
    item.status,
    item.enRouteAt,
    item.enApprocheAt,
    item.enCoursAt,
    item.termineeAt,
    item.travelTimeSeconds,
    item.interventionTimeSeconds,
    item.notes,
    item.problemCode,
    item.createdAt,
    item.updatedAt,
  ];
}

function fromRow(row: Record<string, unknown>): MissionItem {
  return {
    id: row.id as string,
    missionId: row.mission_id as string,
    contractId: (row.contract_id as string | null) ?? null,
    ordre: row.ordre as number,
    address: row.address as string,
    latitude: (row.latitude as number | null) ?? null,
    longitude: (row.longitude as number | null) ?? null,
    detectionRadiusMeters: (row.detection_radius_meters as number | null) ?? null,
    status: row.status as MissionItemState,
    enRouteAt: (row.en_route_at as string | null) ?? null,
    enApprocheAt: (row.en_approche_at as string | null) ?? null,
    enCoursAt: (row.en_cours_at as string | null) ?? null,
    termineeAt: (row.terminee_at as string | null) ?? null,
    travelTimeSeconds: (row.travel_time_seconds as number | null) ?? null,
    interventionTimeSeconds: (row.intervention_time_seconds as number | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    problemCode: (row.problem_code as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function createMissionItemRepository(db: Db) {
  return createRepository<MissionItem>(db, 'mission_items', COLUMNS, toRow, fromRow);
}
