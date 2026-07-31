import type { Problem } from '@/domain/entities';

import type { Db, SqlParam } from '../types';
import { createRepository } from './createRepository';

const COLUMNS = ['id', 'mission_item_id', 'code', 'note', 'reported_at', 'resolved_at'];

function toRow(problem: Problem): SqlParam[] {
  return [problem.id, problem.missionItemId, problem.code, problem.note, problem.reportedAt, problem.resolvedAt];
}

function fromRow(row: Record<string, unknown>): Problem {
  return {
    id: row.id as string,
    missionItemId: row.mission_item_id as string,
    code: row.code as string,
    note: (row.note as string | null) ?? null,
    reportedAt: row.reported_at as string,
    resolvedAt: (row.resolved_at as string | null) ?? null,
  };
}

export function createProblemRepository(db: Db) {
  return createRepository<Problem>(db, 'problems', COLUMNS, toRow, fromRow);
}
