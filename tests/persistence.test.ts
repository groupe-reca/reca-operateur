import { deriveActiveAndNext } from '@/context/MissionContext';
import type { MissionItem } from '@/domain/entities';
import { createRepository } from '@/persistence/repositories/createRepository';
import { seedDemoMissionIfEmpty } from '@/persistence/seedDemoMission';
import { createMissionRepository } from '@/persistence/repositories/missionRepository';
import { createMissionItemRepository } from '@/persistence/repositories/missionItemRepository';

import { createFakeDb } from './testFakeDb';

type Widget = { id: string; label: string; count: number };

function createWidgetRepository(db: ReturnType<typeof createFakeDb>) {
  return createRepository<Widget>(
    db,
    'widgets',
    ['id', 'label', 'count'],
    (widget) => [widget.id, widget.label, widget.count],
    (row) => ({ id: row.id as string, label: row.label as string, count: row.count as number })
  );
}

describe('createRepository (generic CRUD)', () => {
  it('upserts, lists, gets by id, and removes', async () => {
    const db = createFakeDb();
    const repo = createWidgetRepository(db);

    await repo.upsert({ id: 'w1', label: 'First', count: 1 });
    await repo.upsert({ id: 'w2', label: 'Second', count: 2 });
    expect(await repo.getAll()).toHaveLength(2);
    expect(await repo.getById('w1')).toEqual({ id: 'w1', label: 'First', count: 1 });

    // upsert on an existing id overwrites rather than duplicating.
    await repo.upsert({ id: 'w1', label: 'First updated', count: 9 });
    expect(await repo.getAll()).toHaveLength(2);
    expect(await repo.getById('w1')).toEqual({ id: 'w1', label: 'First updated', count: 9 });

    await repo.remove('w2');
    expect(await repo.getAll()).toHaveLength(1);
    expect(await repo.getById('w2')).toBeNull();
  });
});

describe('seedDemoMissionIfEmpty', () => {
  const fakeClock = { now: () => new Date('2026-08-01T08:00:00.000Z') };

  it('seeds a mission and its items atomically when the table is empty', async () => {
    const db = createFakeDb();
    await seedDemoMissionIfEmpty(db, fakeClock);

    const missions = await createMissionRepository(db).getAll();
    const items = await createMissionItemRepository(db).getAll();
    expect(missions).toHaveLength(1);
    expect(items).toHaveLength(5);
    expect(items.filter((item) => item.status === 'EN_ROUTE')).toHaveLength(1);
    expect(items.filter((item) => item.status === 'WAITING')).toHaveLength(4);
  });

  it('is idempotent — does nothing if a mission already exists', async () => {
    const db = createFakeDb();
    await seedDemoMissionIfEmpty(db, fakeClock);
    await seedDemoMissionIfEmpty(db, fakeClock);

    const missions = await createMissionRepository(db).getAll();
    expect(missions).toHaveLength(1);
  });
});

describe('deriveActiveAndNext', () => {
  const base: Omit<MissionItem, 'id' | 'ordre' | 'status'> = {
    missionId: 'm1',
    contractId: null,
    address: 'x',
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
    createdAt: '',
    updatedAt: '',
  };

  it('picks the single active item and sorts the rest by ordre', () => {
    const items: MissionItem[] = [
      { ...base, id: 'a', ordre: 1, status: 'COMPLETED' },
      { ...base, id: 'b', ordre: 3, status: 'WAITING' },
      { ...base, id: 'c', ordre: 2, status: 'IN_PROGRESS' },
      { ...base, id: 'd', ordre: 4, status: 'WAITING' },
    ];

    const { activeMissionItem, nextMissionItems } = deriveActiveAndNext(items);
    expect(activeMissionItem?.id).toBe('c');
    expect(nextMissionItems.map((item) => item.id)).toEqual(['b', 'd']);
  });

  it('returns null active when nothing is in an active state', () => {
    const items: MissionItem[] = [
      { ...base, id: 'a', ordre: 1, status: 'COMPLETED' },
      { ...base, id: 'b', ordre: 2, status: 'WAITING' },
    ];
    const { activeMissionItem, nextMissionItems } = deriveActiveAndNext(items);
    expect(activeMissionItem).toBeNull();
    expect(nextMissionItems.map((item) => item.id)).toEqual(['b']);
  });
});
