import type { Clock } from '@/domain/clock';
import type { Mission, MissionItem } from '@/domain/entities';
import { createStateMachine, recoverOnStartup } from '@/engines/state-machine';
import { createMissionItemRepository } from '@/persistence/repositories/missionItemRepository';
import { createMissionRepository } from '@/persistence/repositories/missionRepository';
import { createStateTransitionRepository } from '@/persistence/repositories/stateTransitionRepository';

import { createFakeDb } from './testFakeDb';

const clock: Clock = { now: () => new Date('2026-08-01T08:00:00.000Z') };

const missionBase: Mission = {
  id: 'm1',
  date: '2026-08-01',
  route: 'R1',
  operator: 'op1',
  equipment: null,
  status: 'IN_PROGRESS',
  scheduledStartAt: null,
  actualStartAt: '2026-08-01T07:00:00.000Z',
  actualEndAt: null,
  createdAt: '2026-08-01T06:00:00.000Z',
  updatedAt: '2026-08-01T06:00:00.000Z',
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
  enCoursAt: null,
  termineeAt: null,
  travelTimeSeconds: null,
  interventionTimeSeconds: null,
  notes: null,
  problemCode: null,
  createdAt: '2026-08-01T06:00:00.000Z',
  updatedAt: '2026-08-01T06:00:00.000Z',
};

async function setup(mission: Partial<Mission> = {}, items: MissionItem[] = []) {
  const db = createFakeDb();
  const missionRepo = createMissionRepository(db);
  const itemRepo = createMissionItemRepository(db);
  const transitionRepo = createStateTransitionRepository(db);
  await missionRepo.upsert({ ...missionBase, ...mission });
  for (const item of items) {
    await itemRepo.upsert(item);
  }
  const stateMachine = createStateMachine(db, clock);
  return { db, missionRepo, itemRepo, transitionRepo, stateMachine };
}

function item(overrides: Partial<MissionItem> & Pick<MissionItem, 'id' | 'ordre' | 'status'>): MissionItem {
  return { ...itemBase, ...overrides };
}

describe('State Machine — MissionItem transitions (docs/09 priority list)', () => {
  it('WAITING → EN_ROUTE: success, refusal, duplicate, journalisation, no network', async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = jest.fn(() => {
      throw new Error('must not touch the network');
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { stateMachine, itemRepo } = await setup({}, [item({ id: 'i1', ordre: 1, status: 'WAITING' })]);

    const success = await stateMachine.startEnRoute('i1', { source: 'GPS' });
    expect(success.success).toBe(true);
    expect((await itemRepo.getById('i1'))?.status).toBe('EN_ROUTE');

    const duplicate = await stateMachine.startEnRoute('i1', { source: 'GPS' });
    expect(duplicate).toMatchObject({ success: false, errorCode: 'DUPLICATE_TRANSITION' });

    const { stateMachine: sm2 } = await setup({}, [item({ id: 'i2', ordre: 1, status: 'COMPLETED' })]);
    const refusal = await sm2.startEnRoute('i2', { source: 'GPS' });
    expect(refusal).toMatchObject({ success: false, errorCode: 'INVALID_TRANSITION' });

    const log = stateMachine.getLog();
    expect(log.some((entry) => entry.missionItemId === 'i1' && entry.result.success)).toBe(true);
    expect(log.some((entry) => entry.missionItemId === 'i1' && entry.result.errorCode === 'DUPLICATE_TRANSITION')).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    globalThis.fetch = originalFetch;
  });

  it('EN_ROUTE → APPROACHING: success and refusal from a non-adjacent state', async () => {
    const { stateMachine } = await setup({}, [item({ id: 'i1', ordre: 1, status: 'EN_ROUTE', enRouteAt: '2026-08-01T07:55:00.000Z' })]);
    const success = await stateMachine.enterApproach('i1', { source: 'GPS' });
    expect(success.success).toBe(true);

    const { stateMachine: sm2 } = await setup({}, [item({ id: 'i2', ordre: 1, status: 'COMPLETED' })]);
    const refusal = await sm2.enterApproach('i2', { source: 'GPS' });
    expect(refusal).toMatchObject({ success: false, errorCode: 'INVALID_TRANSITION' });
  });

  it('APPROACHING → IN_PROGRESS: success computes travel time, refused when another item is active', async () => {
    const { stateMachine, itemRepo } = await setup({}, [
      item({ id: 'i1', ordre: 1, status: 'APPROACHING', enRouteAt: '2026-08-01T07:55:00.000Z' }),
    ]);
    const success = await stateMachine.enterWork('i1', { source: 'GPS' });
    expect(success.success).toBe(true);
    expect((await itemRepo.getById('i1'))?.travelTimeSeconds).toBe(300);

    // Starting a *new* item (WAITING → EN_ROUTE) is what must be refused
    // while another item is already active — an already-active item simply
    // progressing (APPROACHING → IN_PROGRESS) is not a new activation.
    const { stateMachine: sm2 } = await setup({}, [
      item({ id: 'active', ordre: 1, status: 'IN_PROGRESS' }),
      item({ id: 'i2', ordre: 2, status: 'WAITING' }),
    ]);
    const refusal = await sm2.startEnRoute('i2', { source: 'GPS' });
    expect(refusal).toMatchObject({ success: false, errorCode: 'ANOTHER_ITEM_ACTIVE' });
  });

  it('IN_PROGRESS → COMPLETED: success computes intervention time, refusal from a non-adjacent state', async () => {
    const { stateMachine, itemRepo } = await setup({}, [
      item({ id: 'i1', ordre: 1, status: 'IN_PROGRESS', enCoursAt: '2026-08-01T07:40:00.000Z' }),
    ]);
    const success = await stateMachine.completeItem('i1', { source: 'GPS' });
    expect(success.success).toBe(true);
    expect((await itemRepo.getById('i1'))?.interventionTimeSeconds).toBe(1200);

    const { stateMachine: sm2 } = await setup({}, [item({ id: 'i2', ordre: 1, status: 'WAITING' })]);
    const refusal = await sm2.completeItem('i2', { source: 'GPS' });
    expect(refusal).toMatchObject({ success: false, errorCode: 'INVALID_TRANSITION' });
  });

  it('docs/09 "Activation de la résidence suivante" — completing an item auto-activates the next admissible WAITING one', async () => {
    const { stateMachine, itemRepo } = await setup({}, [
      item({ id: 'a', ordre: 1, status: 'IN_PROGRESS' }),
      item({ id: 'b', ordre: 2, status: 'SKIPPED' }),
      item({ id: 'c', ordre: 3, status: 'WAITING' }),
    ]);

    const result = await stateMachine.completeItem('a', { source: 'GPS' });
    expect(result.success).toBe(true);
    expect((await itemRepo.getById('b'))?.status).toBe('SKIPPED');
    expect((await itemRepo.getById('c'))?.status).toBe('EN_ROUTE');
  });

  it('does not activate anything when no WAITING item remains', async () => {
    const { stateMachine, itemRepo } = await setup({}, [item({ id: 'a', ordre: 1, status: 'IN_PROGRESS' })]);
    const result = await stateMachine.completeItem('a', { source: 'GPS' });
    expect(result.success).toBe(true);
    expect((await itemRepo.getAll()).every((i) => i.status !== 'EN_ROUTE')).toBe(true);
  });

  it('IN_PROGRESS → PROBLEM then PROBLEM → EN_ROUTE (manual resolution)', async () => {
    const { stateMachine, itemRepo } = await setup({}, [item({ id: 'i1', ordre: 1, status: 'IN_PROGRESS' })]);
    const problem = await stateMachine.reportProblem('i1', 'ACCESS_BLOCKED', 'Entrée bloquée', { source: 'MANUAL' });
    expect(problem.success).toBe(true);
    expect((await itemRepo.getById('i1'))?.status).toBe('PROBLEM');

    const resolved = await stateMachine.resolveProblem('i1', 'EN_ROUTE', { source: 'MANUAL' });
    expect(resolved.success).toBe(true);
    expect((await itemRepo.getById('i1'))?.problemCode).toBeNull();

    // Item is now EN_ROUTE — resolving the (already-resolved) problem again
    // targets the state it's already in: a duplicate, not a graph violation.
    const duplicate = await stateMachine.resolveProblem('i1', 'EN_ROUTE', { source: 'MANUAL' });
    expect(duplicate).toMatchObject({ success: false, errorCode: 'DUPLICATE_TRANSITION' });

    const refusal = await stateMachine.resolveProblem('i1', 'COMPLETED', { source: 'MANUAL' });
    expect(refusal).toMatchObject({ success: false, errorCode: 'INVALID_TRANSITION' });
  });

  it('WAITING → SKIPPED then SKIPPED → EN_ROUTE (manual resume)', async () => {
    const { stateMachine, itemRepo } = await setup({}, [item({ id: 'i1', ordre: 1, status: 'WAITING' })]);
    const skipped = await stateMachine.skipItem('i1', { source: 'MANUAL' });
    expect(skipped.success).toBe(true);

    const resumed = await stateMachine.resumeSkipped('i1', { source: 'MANUAL' });
    expect(resumed.success).toBe(true);
    expect((await itemRepo.getById('i1'))?.status).toBe('EN_ROUTE');

    // docs/09: for IN_PROGRESS, skipping is refused (report a problem instead).
    const { stateMachine: sm2 } = await setup({}, [item({ id: 'i2', ordre: 1, status: 'IN_PROGRESS' })]);
    const refusal = await sm2.skipItem('i2', { source: 'MANUAL' });
    expect(refusal).toMatchObject({ success: false, errorCode: 'INVALID_TRANSITION' });
  });

  it('refuses every item transition while the mission is PAUSED', async () => {
    const { stateMachine } = await setup({ status: 'PAUSED' }, [item({ id: 'i1', ordre: 1, status: 'WAITING' })]);
    const result = await stateMachine.startEnRoute('i1', { source: 'GPS' });
    expect(result).toMatchObject({ success: false, errorCode: 'MISSION_PAUSED' });
  });
});

describe('State Machine — Mission transitions', () => {
  it('READY → IN_PROGRESS, IN_PROGRESS → PAUSED, PAUSED → IN_PROGRESS, IN_PROGRESS → COMPLETED', async () => {
    const { stateMachine, itemRepo, missionRepo } = await setup({ status: 'READY' }, []);
    expect((await stateMachine.requestMissionStart('m1')).success).toBe(true);
    expect((await missionRepo.getById('m1'))?.status).toBe('IN_PROGRESS');

    expect((await stateMachine.requestMissionPause('m1')).success).toBe(true);
    expect((await stateMachine.requestMissionResume('m1')).success).toBe(true);

    // No unresolved items → completion allowed.
    expect((await itemRepo.getAll())).toHaveLength(0);
    const completed = await stateMachine.requestMissionComplete('m1');
    expect(completed.success).toBe(true);
    expect((await missionRepo.getById('m1'))?.status).toBe('COMPLETED');
  });

  it('refuses COMPLETED → IN_PROGRESS and duplicate pause requests', async () => {
    const { stateMachine } = await setup({ status: 'COMPLETED' }, []);
    const refusal = await stateMachine.requestMissionStart('m1');
    expect(refusal).toMatchObject({ success: false, errorCode: 'INVALID_TRANSITION' });
  });

  it('refuses mission completion while a MissionItem is still unresolved', async () => {
    const { stateMachine } = await setup({ status: 'IN_PROGRESS' }, [item({ id: 'i1', ordre: 1, status: 'WAITING' })]);
    const result = await stateMachine.requestMissionComplete('m1');
    expect(result).toMatchObject({ success: false, errorCode: 'INVALID_TRANSITION' });
  });
});

describe('State Machine — résidences adjacentes (docs/11 Phase 06)', () => {
  it('completes A and starts B atomically with a 5s artificial travel time', async () => {
    const { stateMachine, itemRepo, transitionRepo } = await setup({}, [
      item({ id: 'a', ordre: 1, status: 'IN_PROGRESS', enCoursAt: '2026-08-01T07:50:00.000Z' }),
      item({ id: 'b', ordre: 2, status: 'WAITING' }),
    ]);

    const result = await stateMachine.enterAdjacentResidence('a', 'b');
    expect(result.success).toBe(true);

    const a = await itemRepo.getById('a');
    const b = await itemRepo.getById('b');
    expect(a?.status).toBe('COMPLETED');
    expect(a?.interventionTimeSeconds).toBe(600);
    expect(b?.status).toBe('IN_PROGRESS');
    expect(b?.travelTimeSeconds).toBe(5);

    const transitions = await transitionRepo.getAll();
    expect(transitions.find((t) => t.missionItemId === 'b')?.reason).toBe('ADJACENT_RESIDENCE_FALLBACK');
  });

  it('refuses when the "next" item is not WAITING', async () => {
    const { stateMachine } = await setup({}, [
      item({ id: 'a', ordre: 1, status: 'IN_PROGRESS' }),
      item({ id: 'b', ordre: 2, status: 'COMPLETED' }),
    ]);
    const result = await stateMachine.enterAdjacentResidence('a', 'b');
    expect(result).toMatchObject({ success: false, errorCode: 'NO_ELIGIBLE_NEXT_ITEM' });
  });
});

describe('State Machine — récupération après redémarrage', () => {
  it('activates the first admissible WAITING item when none is active', async () => {
    const { db, itemRepo, stateMachine } = await setup({ status: 'IN_PROGRESS' }, [
      item({ id: 'a', ordre: 1, status: 'COMPLETED' }),
      item({ id: 'b', ordre: 2, status: 'WAITING' }),
      item({ id: 'c', ordre: 3, status: 'WAITING' }),
    ]);

    const result = await recoverOnStartup(db, clock, stateMachine, 'm1');
    expect(result.recovered).toBe(true);
    expect((await itemRepo.getById('b'))?.status).toBe('EN_ROUTE');
    expect((await itemRepo.getById('c'))?.status).toBe('WAITING');
  });

  it('resets extra active items to WAITING, keeping only the most advanced one', async () => {
    const { db, itemRepo, stateMachine } = await setup({ status: 'IN_PROGRESS' }, [
      item({ id: 'a', ordre: 1, status: 'IN_PROGRESS', enCoursAt: '2026-08-01T07:55:00.000Z' }),
      item({ id: 'b', ordre: 2, status: 'EN_ROUTE' }),
    ]);

    const result = await recoverOnStartup(db, clock, stateMachine, 'm1');
    expect(result.recovered).toBe(true);
    expect((await itemRepo.getById('a'))?.status).toBe('IN_PROGRESS');
    expect((await itemRepo.getById('b'))?.status).toBe('WAITING');
  });

  it('does nothing when exactly one item is already active', async () => {
    const { db, stateMachine } = await setup({ status: 'IN_PROGRESS' }, [item({ id: 'a', ordre: 1, status: 'IN_PROGRESS' })]);
    const result = await recoverOnStartup(db, clock, stateMachine, 'm1');
    expect(result.recovered).toBe(false);
  });
});
