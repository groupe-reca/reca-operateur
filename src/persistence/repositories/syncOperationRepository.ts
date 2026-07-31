import type { SyncOperation } from '@/domain/entities';

import type { Db, SqlParam } from '../types';
import { createRepository } from './createRepository';

const COLUMNS = ['id', 'entity_type', 'entity_id', 'operation', 'payload', 'status', 'created_at', 'synced_at'];

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
  };
}

export function createSyncOperationRepository(db: Db) {
  return createRepository<SyncOperation>(db, 'sync_operations', COLUMNS, toRow, fromRow);
}
