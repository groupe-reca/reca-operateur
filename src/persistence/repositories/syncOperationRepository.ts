import type { SyncOperation } from '@/domain/entities';

import type { Db, SqlParam } from '../types';
import { createRepository } from './createRepository';

const COLUMNS = [
  'id',
  'entity_type',
  'entity_id',
  'operation',
  'payload',
  'status',
  'created_at',
  'synced_at',
  'mission_id',
  'mission_item_id',
  'local_sequence',
  'attempt_count',
  'idempotency_key',
  'last_attempt_at',
  'next_attempt_at',
  'last_error_code',
  'last_error_message',
];

function toRow(operation: SyncOperation): SqlParam[] {
  return [
    operation.id,
    operation.entityType,
    operation.entityId,
    operation.operation,
    operation.payload,
    operation.status,
    operation.createdAt,
    operation.syncedAt,
    operation.missionId,
    operation.missionItemId,
    operation.localSequence,
    operation.attemptCount,
    operation.idempotencyKey,
    operation.lastAttemptAt,
    operation.nextAttemptAt,
    operation.lastErrorCode,
    operation.lastErrorMessage,
  ];
}

function fromRow(row: Record<string, unknown>): SyncOperation {
  return {
    id: row.id as string,
    entityType: row.entity_type as string,
    entityId: row.entity_id as string,
    operation: row.operation as string,
    payload: row.payload as string,
    status: row.status as SyncOperation['status'],
    createdAt: row.created_at as string,
    syncedAt: (row.synced_at as string | null) ?? null,
    missionId: (row.mission_id as string | null) ?? null,
    missionItemId: (row.mission_item_id as string | null) ?? null,
    localSequence: row.local_sequence as number,
    attemptCount: row.attempt_count as number,
    idempotencyKey: row.idempotency_key as string,
    lastAttemptAt: (row.last_attempt_at as string | null) ?? null,
    nextAttemptAt: (row.next_attempt_at as string | null) ?? null,
    lastErrorCode: (row.last_error_code as string | null) ?? null,
    lastErrorMessage: (row.last_error_message as string | null) ?? null,
  };
}

export function createSyncOperationRepository(db: Db) {
  return createRepository<SyncOperation>(db, 'sync_operations', COLUMNS, toRow, fromRow);
}
