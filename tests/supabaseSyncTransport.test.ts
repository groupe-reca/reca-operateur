import type { SupabaseClient } from '@supabase/supabase-js';

import type { Mission, MissionItem, SyncOperation } from '@/domain/entities';
import { createSupabaseSyncTransport } from '@/integrations/supabase/supabaseSyncTransport';

// Minimal fake matching exactly the two call shapes supabaseSyncTransport.ts
// uses: `.from(t).update(x).eq(...).select('id')` and
// `.from('mission_items').select('id', {...}).eq(...).eq(...).is(...)`
// (the count-check for terminee_avec_anomalies). Same "fake, not mock the
// whole SDK" philosophy as tests/testFakeDb.ts.
function createFakeClient(opts: {
  missionItemUpdateResult?: { data: unknown; error: unknown };
  missionUpdateResult?: { data: unknown; error: unknown };
  countResult?: { count: number | null; error: unknown };
  onUpdate?: (table: string, payload: Record<string, unknown>) => void;
}) {
  const {
    missionItemUpdateResult = { data: [{ id: 'x' }], error: null },
    missionUpdateResult = { data: [{ id: 'x' }], error: null },
    countResult = { count: 0, error: null },
    onUpdate,
  } = opts;

  return {
    from(table: string) {
      return {
        update: (payload: Record<string, unknown>) => {
          onUpdate?.(table, payload);
          const result = table === 'mission_items' ? missionItemUpdateResult : missionUpdateResult;
          const chain = {
            eq: () => chain,
            select: () => chain,
            then: (resolve: (v: unknown) => unknown) => resolve(result),
          };
          return chain;
        },
        select: () => {
          const chain = {
            eq: () => chain,
            is: () => chain,
            then: (resolve: (v: unknown) => unknown) => resolve(countResult),
          };
          return chain;
        },
      };
    },
  } as unknown as SupabaseClient;
}

function makeItem(overrides: Partial<MissionItem> = {}): MissionItem {
  return {
    id: 'item-1',
    missionId: 'mission-1',
    contractId: 'contract-1',
    ordre: 1,
    address: '224 rue Scott',
    latitude: null,
    longitude: null,
    detectionRadiusMeters: null,
    status: 'WAITING',
    enRouteAt: null,
    enApprocheAt: null,
    enCoursAt: null,
    termineeAt: null,
    travelTimeSeconds: null,
    interventionTimeSeconds: null,
    notes: null,
    problemCode: null,
    createdAt: '2026-08-02T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
    ...overrides,
  };
}

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'mission-1',
    date: '2026-08-02',
    route: 'Route 12A',
    operator: null,
    equipment: null,
    status: 'IN_PROGRESS',
    scheduledStartAt: null,
    actualStartAt: '2026-08-02T08:00:00.000Z',
    actualEndAt: null,
    createdAt: '2026-08-02T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
    ...overrides,
  };
}

function makeOperation(entityType: 'Mission' | 'MissionItem' | 'Unknown', entityId: string, payload: unknown): SyncOperation {
  return {
    id: `op-${entityId}`,
    entityType,
    entityId,
    operation: 'UPSERT',
    payload: JSON.stringify(payload),
    status: 'PENDING',
    createdAt: '2026-08-02T00:00:00.000Z',
    syncedAt: null,
    missionId: 'mission-1',
    missionItemId: entityType === 'MissionItem' ? entityId : null,
    localSequence: 1,
    attemptCount: 0,
    idempotencyKey: `op-${entityId}`,
    lastAttemptAt: null,
    nextAttemptAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
  };
}

describe('SupabaseSyncTransport — MissionItem', () => {
  it('sends a successful update with the mapped statut/statut_operateur', async () => {
    const updates: Record<string, unknown>[] = [];
    const client = createFakeClient({ onUpdate: (_t, p) => updates.push(p) });
    const transport = createSupabaseSyncTransport(client);

    const item = makeItem({ status: 'EN_ROUTE' });
    const outcomes = await transport.send([makeOperation('MissionItem', item.id, item)]);

    expect(outcomes).toEqual([{ operationId: `op-${item.id}`, success: true }]);
    expect(updates[0]).toMatchObject({ statut: 'en_cours', statut_operateur: 'en_route' });
  });

  it('never sends CANCELLED — permanent failure, no network call', async () => {
    let updateCalled = false;
    const client = createFakeClient({ onUpdate: () => (updateCalled = true) });
    const transport = createSupabaseSyncTransport(client);

    const item = makeItem({ status: 'CANCELLED' });
    const [outcome] = await transport.send([makeOperation('MissionItem', item.id, item)]);

    expect(outcome?.success).toBe(false);
    expect(outcome?.errorKind).toBe('PERMANENT');
    expect(outcome?.errorCode).toBe('UNSUPPORTED_STATUS');
    expect(updateCalled).toBe(false);
  });

  it('classifies an RLS violation (42501) as PERMANENT', async () => {
    const client = createFakeClient({
      missionItemUpdateResult: { data: null, error: { code: '42501', message: 'denied' } },
    });
    const transport = createSupabaseSyncTransport(client);

    const [outcome] = await transport.send([makeOperation('MissionItem', 'item-1', makeItem())]);

    expect(outcome?.success).toBe(false);
    expect(outcome?.errorKind).toBe('PERMANENT');
    expect(outcome?.errorCode).toBe('42501');
  });

  it('classifies a zero-row update (wrong/invisible id) as PERMANENT', async () => {
    const client = createFakeClient({ missionItemUpdateResult: { data: [], error: null } });
    const transport = createSupabaseSyncTransport(client);

    const [outcome] = await transport.send([makeOperation('MissionItem', 'item-1', makeItem())]);

    expect(outcome?.success).toBe(false);
    expect(outcome?.errorKind).toBe('PERMANENT');
    expect(outcome?.errorCode).toBe('NO_MATCHING_ROW');
  });

  it('classifies an unrecognized error (network/5xx) as TEMPORARY', async () => {
    const client = createFakeClient({
      missionItemUpdateResult: { data: null, error: { message: 'fetch failed' } },
    });
    const transport = createSupabaseSyncTransport(client);

    const [outcome] = await transport.send([makeOperation('MissionItem', 'item-1', makeItem())]);

    expect(outcome?.success).toBe(false);
    expect(outcome?.errorKind).toBe('TEMPORARY');
  });
});

describe('SupabaseSyncTransport — Mission', () => {
  it('maps COMPLETED with no unresolved items to terminee', async () => {
    const updates: Record<string, unknown>[] = [];
    const client = createFakeClient({ countResult: { count: 0, error: null }, onUpdate: (_t, p) => updates.push(p) });
    const transport = createSupabaseSyncTransport(client);

    const mission = makeMission({ status: 'COMPLETED', actualEndAt: '2026-08-02T16:00:00.000Z' });
    const [outcome] = await transport.send([makeOperation('Mission', mission.id, mission)]);

    expect(outcome?.success).toBe(true);
    expect(updates[0]).toMatchObject({ statut: 'terminee', heure_fin: '2026-08-02T16:00:00.000Z' });
  });

  it('maps COMPLETED with unresolved items to terminee_avec_anomalies (supervisor follow-up)', async () => {
    const updates: Record<string, unknown>[] = [];
    const client = createFakeClient({ countResult: { count: 2, error: null }, onUpdate: (_t, p) => updates.push(p) });
    const transport = createSupabaseSyncTransport(client);

    const mission = makeMission({ status: 'COMPLETED' });
    await transport.send([makeOperation('Mission', mission.id, mission)]);

    expect(updates[0]).toMatchObject({ statut: 'terminee_avec_anomalies' });
  });
});

describe('SupabaseSyncTransport — unknown entity', () => {
  it('fails permanently for an unrecognized entityType', async () => {
    const client = createFakeClient({});
    const transport = createSupabaseSyncTransport(client);

    const [outcome] = await transport.send([makeOperation('Unknown', 'x', {})]);

    expect(outcome?.success).toBe(false);
    expect(outcome?.errorKind).toBe('PERMANENT');
    expect(outcome?.errorCode).toBe('UNKNOWN_ENTITY_TYPE');
  });
});
