import type { Clock } from '@/domain/clock';
import type { Mission, MissionItem, SyncOperation } from '@/domain/entities';
import {
  computeBackoffDelaySeconds,
  createSynchronizationEngine,
  DEFAULT_RETRY_POLICY,
  selectBatch,
  type NetworkStatusProvider,
  type SyncOperationOutcome,
  type SyncTransport,
} from '@/engines/sync';
import { createStateMachine } from '@/engines/state-machine';
import { createMissionItemRepository } from '@/persistence/repositories/missionItemRepository';
import { createMissionRepository } from '@/persistence/repositories/missionRepository';
import { createSyncOperationRepository } from '@/persistence/repositories/syncOperationRepository';

import { createFakeDb } from './testFakeDb';

function createMutableClock(start: Date): Clock & { set(date: Date): void } {
  let now = start;
  return { now: () => now, set: (date: Date) => (now = date) };
}

const opBase: Omit<SyncOperation, 'id' | 'localSequence' | 'status' | 'missionId'> = {
  entityType: 'MissionItem',
  entityId: 'item-1',
  operation: 'UPSERT',
  payload: '{}',
  createdAt: '2026-08-02T08:00:00.000Z',
  syncedAt: null,
  missionItemId: 'item-1',
  attemptCount: 0,
  idempotencyKey: 'key',
  lastAttemptAt: null,
  nextAttemptAt: null,
  lastErrorCode: null,
  lastErrorMessage: null,
};

function op(overrides: Partial<SyncOperation> & Pick<SyncOperation, 'id' | 'localSequence' | 'status' | 'missionId'>): SyncOperation {
  return { ...opBase, idempotencyKey: overrides.id, ...overrides };
}

function fixedNetwork(online: boolean): NetworkStatusProvider & { set(value: boolean): void } {
  let value = online;
  return { isOnline: () => value, set: (next: boolean) => (value = next) };
}

// Simulates a real idempotent server: tracks how many times each
// idempotencyKey has actually produced an effect (docs/07 "Idempotence" —
// resending the same operation must never double the effect), independent
// of how many times `send` itself is called for that operation.
function createFakeTransport(overrides: {
  behavior?: (operation: SyncOperation, attempt: number) => SyncOperationOutcome;
} = {}): SyncTransport & { effectsById: Map<string, number>; callsById: Map<string, number> } {
  const effectsById = new Map<string, number>();
  const callsById = new Map<string, number>();
  const behavior = overrides.behavior ?? (() => ({ operationId: '', success: true }));

  return {
    effectsById,
    callsById,
    async send(operations) {
      return operations.map((operation) => {
        const attempt = (callsById.get(operation.id) ?? 0) + 1;
        callsById.set(operation.id, attempt);
        const outcome = { ...behavior(operation, attempt), operationId: operation.id };
        if (outcome.success) {
          effectsById.set(operation.idempotencyKey, (effectsById.get(operation.idempotencyKey) ?? 0) + 1);
        }
        return outcome;
      });
    },
  };
}

async function setupQueue(operations: SyncOperation[]) {
  const db = createFakeDb();
  const repo = createSyncOperationRepository(db);
  for (const operation of operations) {
    await repo.upsert(operation);
  }
  return { db, repo };
}

describe('computeBackoffDelaySeconds', () => {
  const noJitter = { ...DEFAULT_RETRY_POLICY, jitterRatio: 0 };

  it('follows the documented schedule: immediate, 5s, 15s, 30s, 60s, then a plateau', () => {
    expect(computeBackoffDelaySeconds(1, noJitter)).toBe(0);
    expect(computeBackoffDelaySeconds(2, noJitter)).toBe(5);
    expect(computeBackoffDelaySeconds(3, noJitter)).toBe(15);
    expect(computeBackoffDelaySeconds(4, noJitter)).toBe(30);
    expect(computeBackoffDelaySeconds(5, noJitter)).toBe(60);
    expect(computeBackoffDelaySeconds(9, noJitter)).toBe(60); // plateau — reuses the last configured value
  });

  it('applies jitter within the configured ratio', () => {
    const policy = { ...DEFAULT_RETRY_POLICY, jitterRatio: 0.5, jitter: () => 1 }; // max jitter
    expect(computeBackoffDelaySeconds(3, policy)).toBeCloseTo(15 * 1.5, 5); // 15s ± 50%
  });
});

describe('selectBatch — priority between missions, strict order within a mission', () => {
  it('never reorders operations belonging to the same mission', () => {
    const candidates = [
      op({ id: 'a2', localSequence: 2, status: 'PENDING', missionId: 'm1' }),
      op({ id: 'a1', localSequence: 1, status: 'PENDING', missionId: 'm1' }),
      op({ id: 'a3', localSequence: 3, status: 'PENDING', missionId: 'm1' }),
    ];
    const batch = selectBatch(candidates, 10);
    expect(batch.map((o) => o.id)).toEqual(['a1', 'a2', 'a3']);
  });

  it('prioritises Mission-level operations over MissionItem-level ones from a different mission', () => {
    const candidates = [
      op({ id: 'item-op', localSequence: 1, status: 'PENDING', missionId: 'm-items', entityType: 'MissionItem' }),
      op({ id: 'mission-op', localSequence: 1, status: 'PENDING', missionId: 'm-mission', entityType: 'Mission' }),
    ];
    const batch = selectBatch(candidates, 10);
    expect(batch[0]?.id).toBe('mission-op');
  });

  it('caps the batch at the requested size without breaking a mission mid-sequence unnecessarily', () => {
    const candidates = [
      op({ id: 'a1', localSequence: 1, status: 'PENDING', missionId: 'm1' }),
      op({ id: 'a2', localSequence: 2, status: 'PENDING', missionId: 'm1' }),
      op({ id: 'b1', localSequence: 1, status: 'PENDING', missionId: 'm2' }),
    ];
    const batch = selectBatch(candidates, 2);
    expect(batch).toHaveLength(2);
    expect(batch.map((o) => o.id)).toEqual(['a1', 'a2']);
  });
});

describe('SynchronizationEngine — runSyncCycle', () => {
  it('mission entièrement en ligne: sends and confirms every pending operation', async () => {
    const { db, repo } = await setupQueue([
      op({ id: 'a', localSequence: 1, status: 'PENDING', missionId: 'm1' }),
      op({ id: 'b', localSequence: 2, status: 'PENDING', missionId: 'm1' }),
    ]);
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const transport = createFakeTransport();
    const engine = createSynchronizationEngine({ db, clock, transport, network: fixedNetwork(true) });

    const result = await engine.runSyncCycle();
    expect(result.processed).toBe(2);
    expect((await repo.getById('a'))?.status).toBe('CONFIRMED');
    expect((await repo.getById('b'))?.status).toBe('CONFIRMED');
    const state = await engine.getSynchronizationState();
    expect(state.status).toBe('SYNCED');
    expect(state.pendingCount).toBe(0);
  });

  it('mission entièrement hors ligne: does nothing and reports OFFLINE', async () => {
    const { db, repo } = await setupQueue([op({ id: 'a', localSequence: 1, status: 'PENDING', missionId: 'm1' })]);
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const transport = createFakeTransport();
    const engine = createSynchronizationEngine({ db, clock, transport, network: fixedNetwork(false) });

    const result = await engine.runSyncCycle();
    expect(result.processed).toBe(0);
    expect((await repo.getById('a'))?.status).toBe('PENDING');
    expect((await engine.getSynchronizationState()).status).toBe('OFFLINE');
  });

  it('réseau intermittent: a temporary failure schedules a retry, which then succeeds', async () => {
    const { db, repo } = await setupQueue([op({ id: 'a', localSequence: 1, status: 'PENDING', missionId: 'm1' })]);
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    let failNext = true;
    const transport = createFakeTransport({
      behavior: (operation) => (failNext ? { operationId: operation.id, success: false, errorKind: 'TEMPORARY' } : { operationId: operation.id, success: true }),
    });
    const engine = createSynchronizationEngine({ db, clock, transport, network: fixedNetwork(true), retryPolicy: { jitterRatio: 0 } });

    await engine.runSyncCycle();
    expect((await repo.getById('a'))?.status).toBe('FAILED');
    expect((await repo.getById('a'))?.nextAttemptAt).toBeTruthy();

    // Too early — retry not due yet.
    await engine.runSyncCycle();
    expect((await repo.getById('a'))?.status).toBe('FAILED');

    failNext = false;
    clock.set(new Date(clock.now().getTime() + 6000)); // past the 5s retry delay for attempt 2
    await engine.runSyncCycle();
    expect((await repo.getById('a'))?.status).toBe('CONFIRMED');
  });

  it('serveur indisponible: repeated temporary failures eventually move the operation to BLOCKED', async () => {
    const { db, repo } = await setupQueue([op({ id: 'a', localSequence: 1, status: 'PENDING', missionId: 'm1' })]);
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const transport = createFakeTransport({ behavior: (operation) => ({ operationId: operation.id, success: false, errorKind: 'TEMPORARY' }) });
    const engine = createSynchronizationEngine({
      db,
      clock,
      transport,
      network: fixedNetwork(true),
      retryPolicy: { jitterRatio: 0, maxAttempts: 3 },
    });

    for (let i = 0; i < 3; i++) {
      await engine.runSyncCycle();
      clock.set(new Date(clock.now().getTime() + 120000));
    }
    expect((await repo.getById('a'))?.status).toBe('BLOCKED');
    expect((await engine.getSynchronizationState()).status).toBe('ERROR');
  });

  it('opération invalide: a permanent error blocks immediately, no retry attempted', async () => {
    const { db, repo } = await setupQueue([op({ id: 'a', localSequence: 1, status: 'PENDING', missionId: 'm1' })]);
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const transport = createFakeTransport({
      behavior: (operation) => ({ operationId: operation.id, success: false, errorKind: 'PERMANENT', errorCode: 'MISSION_NOT_FOUND' }),
    });
    const engine = createSynchronizationEngine({ db, clock, transport, network: fixedNetwork(true) });

    await engine.runSyncCycle();
    const stored = await repo.getById('a');
    expect(stored?.status).toBe('BLOCKED');
    expect(stored?.attemptCount).toBe(1); // never retried
    expect(stored?.lastErrorCode).toBe('MISSION_NOT_FOUND');
  });

  it('lot partiellement accepté: some operations confirm while others fail in the same batch', async () => {
    const { db, repo } = await setupQueue([
      op({ id: 'a', localSequence: 1, status: 'PENDING', missionId: 'm1' }),
      op({ id: 'b', localSequence: 1, status: 'PENDING', missionId: 'm2' }),
    ]);
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const transport = createFakeTransport({
      behavior: (operation) => (operation.id === 'a' ? { operationId: 'a', success: true } : { operationId: 'b', success: false, errorKind: 'TEMPORARY' }),
    });
    const engine = createSynchronizationEngine({ db, clock, transport, network: fixedNetwork(true) });

    await engine.runSyncCycle();
    expect((await repo.getById('a'))?.status).toBe('CONFIRMED');
    expect((await repo.getById('b'))?.status).toBe('FAILED');
  });

  it('doublon / réponse serveur perdue: resending the same operation never doubles its effect', async () => {
    const { db, repo } = await setupQueue([op({ id: 'a', localSequence: 1, status: 'PENDING', missionId: 'm1', idempotencyKey: 'idem-a' })]);
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    // First attempt: server processes it but the response is "lost" (looks like a failure to the client).
    let attempt = 0;
    const transport = createFakeTransport({
      behavior: (operation) => {
        attempt++;
        if (attempt === 1) {
          return { operationId: operation.id, success: false, errorKind: 'TEMPORARY' }; // lost response
        }
        return { operationId: operation.id, success: true }; // retried — idempotent server confirms it was already applied
      },
    });
    const engine = createSynchronizationEngine({ db, clock, transport, network: fixedNetwork(true), retryPolicy: { jitterRatio: 0 } });

    await engine.runSyncCycle(); // marked FAILED locally, though the fake transport's own effect counter did NOT increment
    clock.set(new Date(clock.now().getTime() + 6000));
    await engine.runSyncCycle(); // retried, now confirmed

    expect((await repo.getById('a'))?.status).toBe('CONFIRMED');
    expect(transport.effectsById.get('idem-a')).toBe(1); // exactly one real effect despite 2 send() calls
  });

  it('fermeture pendant synchronisation: PROCESSING operations are reset to PENDING on recovery', async () => {
    const { db, repo } = await setupQueue([op({ id: 'a', localSequence: 1, status: 'PROCESSING', missionId: 'm1' })]);
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const engine = createSynchronizationEngine({ db, clock, transport: createFakeTransport(), network: fixedNetwork(true) });

    const recoveredCount = await engine.recoverOnStartup();
    expect(recoveredCount).toBe(1);
    expect((await repo.getById('a'))?.status).toBe('PENDING');
  });

  it('plusieurs centaines d\'opérations en attente: processed across multiple batched cycles, in order', async () => {
    const operations = Array.from({ length: 250 }, (_, i) => op({ id: `op-${i}`, localSequence: i + 1, status: 'PENDING', missionId: 'm1' }));
    const { db, repo } = await setupQueue(operations);
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const sentOrder: string[] = [];
    const transport = createFakeTransport({
      behavior: (operation) => {
        sentOrder.push(operation.id);
        return { operationId: operation.id, success: true };
      },
    });
    const engine = createSynchronizationEngine({ db, clock, transport, network: fixedNetwork(true), batchSize: 20 });

    let cycles = 0;
    while ((await engine.getSynchronizationState()).pendingCount > 0 && cycles < 20) {
      await engine.runSyncCycle();
      cycles++;
    }

    const all = await repo.getAll();
    expect(all.every((operation) => operation.status === 'CONFIRMED')).toBe(true);
    expect(sentOrder).toEqual(operations.map((o) => o.id)); // strict FIFO — single mission
  });

  it('retryOperation manually resets a BLOCKED operation back to PENDING', async () => {
    const { db, repo } = await setupQueue([
      op({ id: 'a', localSequence: 1, status: 'BLOCKED', missionId: 'm1', lastErrorCode: 'MISSION_NOT_FOUND' }),
    ]);
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const engine = createSynchronizationEngine({ db, clock, transport: createFakeTransport(), network: fixedNetwork(true) });

    const result = await engine.retryOperation('a');
    expect(result).toBe(true);
    expect((await repo.getById('a'))?.status).toBe('PENDING');
  });
});

describe('SynchronizationEngine — résidences adjacentes, ordre préservé (intégration State Machine)', () => {
  const missionBase: Mission = {
    id: 'm1',
    date: '2026-08-02',
    route: 'R1',
    operator: 'op1',
    equipment: null,
    status: 'IN_PROGRESS',
    scheduledStartAt: null,
    actualStartAt: '2026-08-02T07:00:00.000Z',
    actualEndAt: null,
    createdAt: '2026-08-02T06:00:00.000Z',
    updatedAt: '2026-08-02T06:00:00.000Z',
  };
  const itemBase: Omit<MissionItem, 'id' | 'ordre' | 'status'> = {
    missionId: 'm1',
    contractId: null,
    address: '224 rue Scott',
    latitude: null,
    longitude: null,
    detectionRadiusMeters: null,
    enRouteAt: null,
    enApprocheAt: null,
    enCoursAt: '2026-08-02T07:50:00.000Z',
    termineeAt: null,
    travelTimeSeconds: null,
    interventionTimeSeconds: null,
    notes: null,
    problemCode: null,
    createdAt: '2026-08-02T06:00:00.000Z',
    updatedAt: '2026-08-02T06:00:00.000Z',
  };

  it('the two SyncOperations written for the adjacent-residence transaction sync in the exact order they were written', async () => {
    const db = createFakeDb();
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const missionRepo = createMissionRepository(db);
    const itemRepo = createMissionItemRepository(db);
    await missionRepo.upsert(missionBase);
    await itemRepo.upsert({ ...itemBase, id: 'a', ordre: 1, status: 'IN_PROGRESS' });
    await itemRepo.upsert({ ...itemBase, id: 'b', ordre: 2, status: 'WAITING', enCoursAt: null });

    const stateMachine = createStateMachine(db, clock);
    await stateMachine.enterAdjacentResidence('a', 'b');

    const sentOrder: string[] = [];
    const transport = createFakeTransport({
      behavior: (operation) => {
        sentOrder.push(operation.entityId);
        return { operationId: operation.id, success: true };
      },
    });
    const syncEngine = createSynchronizationEngine({ db, clock, transport, network: fixedNetwork(true) });
    await syncEngine.runSyncCycle();

    expect(sentOrder).toEqual(['a', 'b']); // A completed, then B started — never reordered
  });
});
