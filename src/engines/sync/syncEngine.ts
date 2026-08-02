import type { Clock } from '@/domain/clock';
import type { SyncOperation } from '@/domain/entities';
import { createSyncOperationRepository } from '@/persistence/repositories/syncOperationRepository';
import type { Db } from '@/persistence/types';

import { computeBackoffDelaySeconds } from './backoff';
import { selectBatch } from './priority';
import {
  DEFAULT_RETRY_POLICY,
  type NetworkStatusProvider,
  type RetryPolicy,
  type SyncEngineEvent,
  type SyncEventListener,
  type SyncTransport,
  type SynchronizationState,
} from './types';

export type SyncEngineDependencies = {
  db: Db;
  clock: Clock;
  transport: SyncTransport;
  network: NetworkStatusProvider;
  batchSize?: number;
  retryPolicy?: Partial<RetryPolicy>;
};

const DUE_STATUSES = new Set<SyncOperation['status']>(['PENDING', 'FAILED']);

function isDue(operation: SyncOperation, now: Date): boolean {
  if (operation.status === 'PENDING') {
    return true;
  }
  if (operation.status === 'FAILED') {
    return !operation.nextAttemptAt || new Date(operation.nextAttemptAt).getTime() <= now.getTime();
  }
  return false;
}

// docs/07-Synchronization.md — processes the local `sync_operations` queue
// (written by producers like the State Machine, see docs/07 "Écriture
// locale"). This engine never creates operations itself, only reads/sends/
// updates them. No React, no real transport (injected — see plans.md).
export function createSynchronizationEngine({
  db,
  clock,
  transport,
  network,
  batchSize = 10,
  retryPolicy: retryPolicyOverrides,
}: SyncEngineDependencies) {
  const syncRepo = createSyncOperationRepository(db);
  const retryPolicy: RetryPolicy = { ...DEFAULT_RETRY_POLICY, ...retryPolicyOverrides };

  let wasOnline: boolean | null = null;
  let syncing = false;
  const listeners: SyncEventListener[] = [];
  const events: SyncEngineEvent[] = [];

  function emit(event: SyncEngineEvent): void {
    events.push(event);
    listeners.forEach((listener) => listener(event));
  }

  function checkNetworkTransition(now: Date): boolean {
    const online = network.isOnline();
    if (wasOnline !== null && wasOnline !== online) {
      emit({ type: online ? 'NetworkAvailable' : 'NetworkUnavailable', at: now.toISOString() });
    }
    wasOnline = online;
    return online;
  }

  // docs/07 "Reprise après interruption" — call once at startup, before the
  // first `runSyncCycle`. Any operation still PROCESSING means the app was
  // killed mid-send; it must never stay stuck there.
  async function recoverOnStartup(): Promise<number> {
    const all = await syncRepo.getAll();
    const stuck = all.filter((operation) => operation.status === 'PROCESSING');
    for (const operation of stuck) {
      await syncRepo.upsert({ ...operation, status: 'PENDING' });
    }
    return stuck.length;
  }

  async function markOutcome(
    operation: SyncOperation,
    now: Date,
    outcome: { success: boolean; errorKind?: string; errorCode?: string; errorMessage?: string } | undefined
  ): Promise<'confirmed' | 'failed' | 'blocked'> {
    const attemptCount = operation.attemptCount + 1;
    const lastAttemptAt = now.toISOString();

    if (outcome?.success) {
      await syncRepo.upsert({
        ...operation,
        status: 'CONFIRMED',
        attemptCount,
        lastAttemptAt,
        syncedAt: lastAttemptAt,
        nextAttemptAt: null,
        lastErrorCode: null,
        lastErrorMessage: null,
      });
      emit({ type: 'SyncOperationConfirmed', at: lastAttemptAt, operationId: operation.id });
      return 'confirmed';
    }

    const errorKind = outcome?.errorKind ?? 'TEMPORARY';
    const errorCode = outcome?.errorCode ?? null;
    const errorMessage = outcome?.errorMessage ?? null;

    if (errorKind === 'PERMANENT' || errorKind === 'CONFLICT' || attemptCount >= retryPolicy.maxAttempts) {
      await syncRepo.upsert({
        ...operation,
        status: 'BLOCKED',
        attemptCount,
        lastAttemptAt,
        nextAttemptAt: null,
        lastErrorCode: errorCode,
        lastErrorMessage: errorMessage,
      });
      if (errorKind === 'CONFLICT') {
        emit({ type: 'ConflictDetected', at: lastAttemptAt, operationId: operation.id });
      } else {
        emit({ type: 'SyncBlocked', at: lastAttemptAt, operationId: operation.id, errorCode: errorCode ?? undefined });
      }
      return 'blocked';
    }

    const delaySeconds = computeBackoffDelaySeconds(attemptCount, retryPolicy);
    const nextAttemptAt = new Date(now.getTime() + delaySeconds * 1000).toISOString();
    await syncRepo.upsert({
      ...operation,
      status: 'FAILED',
      attemptCount,
      lastAttemptAt,
      nextAttemptAt,
      lastErrorCode: errorCode,
      lastErrorMessage: errorMessage,
    });
    emit({ type: 'SyncFailed', at: lastAttemptAt, operationId: operation.id, errorCode: errorCode ?? undefined, nextAttemptAt });
    return 'failed';
  }

  // The core loop — docs/07 "Flux complet". Safe to call repeatedly/on a
  // timer: it no-ops when offline, when nothing is due, or when a previous
  // call is still in flight (never runs two overlapping cycles).
  async function runSyncCycle(): Promise<{ processed: number }> {
    const now = clock.now();
    const online = checkNetworkTransition(now);
    if (!online || syncing) {
      return { processed: 0 };
    }

    syncing = true;
    try {
      const all = await syncRepo.getAll();
      const due = all.filter((operation) => DUE_STATUSES.has(operation.status) && isDue(operation, now));
      if (due.length === 0) {
        emit({ type: 'SyncIdle', at: now.toISOString() });
        return { processed: 0 };
      }

      const batch = selectBatch(due, batchSize);
      emit({ type: 'SyncStarted', at: now.toISOString(), batchSize: batch.length });

      // docs/07 "Structure d'une opération" — PROCESSING before sending, so
      // a crash mid-send is recoverable (`recoverOnStartup`) rather than
      // silently re-selecting an operation whose request may already be
      // in flight.
      for (const operation of batch) {
        await syncRepo.upsert({ ...operation, status: 'PROCESSING' });
      }

      const outcomes = await transport.send(batch);
      const outcomeById = new Map(outcomes.map((outcome) => [outcome.operationId, outcome]));

      let confirmed = 0;
      let failed = 0;
      let blocked = 0;
      for (const operation of batch) {
        const result = await markOutcome(operation, now, outcomeById.get(operation.id));
        if (result === 'confirmed') confirmed++;
        else if (result === 'failed') failed++;
        else blocked++;
      }

      emit({ type: 'SyncBatchCompleted', at: now.toISOString(), confirmed, failed, blocked });
      return { processed: batch.length };
    } finally {
      syncing = false;
    }
  }

  // docs/07 "Réessais" — "réessayée manuellement". Resets a BLOCKED/FAILED
  // operation back to PENDING (attempt history is kept for diagnostics).
  async function retryOperation(operationId: string): Promise<boolean> {
    const operation = await syncRepo.getById(operationId);
    if (!operation || (operation.status !== 'BLOCKED' && operation.status !== 'FAILED')) {
      return false;
    }
    await syncRepo.upsert({ ...operation, status: 'PENDING', nextAttemptAt: null });
    return true;
  }

  // docs/07 "Communication avec MissionContext" — verbatim shape.
  async function getSynchronizationState(): Promise<SynchronizationState> {
    const all = await syncRepo.getAll();
    const pending = all.filter((operation) => DUE_STATUSES.has(operation.status));
    const blocked = all.filter((operation) => operation.status === 'BLOCKED');
    const confirmedAt = all
      .filter((operation) => operation.status === 'CONFIRMED' && operation.syncedAt)
      .map((operation) => operation.syncedAt as string)
      .sort();
    const lastSuccessfulSyncAt = confirmedAt[confirmedAt.length - 1];
    const lastBlockedOrFailed = [...pending, ...blocked]
      .filter((operation) => operation.lastErrorMessage)
      .sort((a, b) => (a.lastAttemptAt ?? '').localeCompare(b.lastAttemptAt ?? ''))
      .at(-1);

    let status: SynchronizationState['status'];
    if (!network.isOnline() && pending.length > 0) {
      status = 'OFFLINE';
    } else if (syncing) {
      status = 'SYNCING';
    } else if (blocked.length > 0) {
      status = 'ERROR';
    } else if (pending.length > 0) {
      status = 'PENDING';
    } else {
      status = 'SYNCED';
    }

    return {
      status,
      pendingCount: pending.length,
      failedCount: blocked.length,
      lastSuccessfulSyncAt,
      lastError: lastBlockedOrFailed?.lastErrorMessage ?? undefined,
    };
  }

  function on(listener: SyncEventListener): () => void {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    };
  }

  return {
    runSyncCycle,
    recoverOnStartup,
    retryOperation,
    getSynchronizationState,
    on,
    getEvents: (): SyncEngineEvent[] => [...events],
  };
}

export type SynchronizationEngine = ReturnType<typeof createSynchronizationEngine>;
