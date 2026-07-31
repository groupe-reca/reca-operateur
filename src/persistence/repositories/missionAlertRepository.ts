import type { MissionAlertRecord } from '@/domain/entities';

import type { Db, SqlParam } from '../types';
import { createRepository } from './createRepository';

const COLUMNS = ['id', 'mission_item_id', 'level', 'text', 'created_at'];

function toRow(alert: MissionAlertRecord): SqlParam[] {
  return [alert.id, alert.missionItemId, alert.level, alert.text, alert.createdAt];
}

function fromRow(row: Record<string, unknown>): MissionAlertRecord {
  return {
    id: row.id as string,
    missionItemId: row.mission_item_id as string,
    level: row.level as MissionAlertRecord['level'],
    text: row.text as string,
    createdAt: row.created_at as string,
  };
}

export function createMissionAlertRepository(db: Db) {
  return createRepository<MissionAlertRecord>(db, 'mission_alerts', COLUMNS, toRow, fromRow);
}
