import type { Mission, MissionItem } from '@/domain/entities';
import type { SynchronizationState } from '@/engines/sync/types';
import type { OfflineEngineState } from '@/engines/offline';

import { deriveMissionScreenState } from '@/screens/deriveMissionScreenState';

const now = new Date('2026-08-01T08:00:00.000Z');

const missionBase: Mission = {
  id: 'm1',
  date: '2026-08-01',
  route: 'Secteur 4',
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

function item(overrides: Partial<MissionItem> & Pick<MissionItem, 'id' | 'ordre' | 'status'>): MissionItem {
  return { ...itemBase, ...overrides };
}

const syncedState: SynchronizationState = { status: 'SYNCED', pendingCount: 0, failedCount: 0 };

const onlineState: OfflineEngineState = {
  status: 'ONLINE',
  since: '2026-08-01T06:00:00.000Z',
  lastOnlineAt: '2026-08-01T06:00:00.000Z',
};

describe('deriveMissionScreenState', () => {
  it('returns null when there is no mission', () => {
    const result = deriveMissionScreenState(
      {
        mission: null,
        activeMissionItem: null,
        nextMissionItems: [],
        allMissionItems: [],
        synchronizationState: syncedState,
        offlineState: onlineState,
      },
      now
    );
    expect(result).toBeNull();
  });

  it('returns null when there is no active item and no problem item', () => {
    const waiting = item({ id: 'i1', ordre: 1, status: 'WAITING' });
    const result = deriveMissionScreenState(
      {
        mission: missionBase,
        activeMissionItem: null,
        nextMissionItems: [waiting],
        allMissionItems: [waiting],
        synchronizationState: syncedState,
        offlineState: onlineState,
      },
      now
    );
    expect(result).toBeNull();
  });

  it('derives EN_ROUTE state from the active item', () => {
    const active = item({
      id: 'i1',
      ordre: 1,
      status: 'EN_ROUTE',
      enRouteAt: '2026-08-01T07:58:00.000Z',
      latitude: 45.5,
      longitude: -73.5,
    });
    const next = item({ id: 'i2', ordre: 2, status: 'WAITING', latitude: 45.6, longitude: -73.6 });
    const result = deriveMissionScreenState(
      {
        mission: missionBase,
        activeMissionItem: active,
        nextMissionItems: [next],
        allMissionItems: [active, next],
        synchronizationState: syncedState,
        offlineState: onlineState,
      },
      now
    );

    expect(result).not.toBeNull();
    expect(result?.activeState).toBe('EN_ROUTE');
    expect(result?.stateLabel).toBe('EN ROUTE');
    expect(result?.timerSeconds).toBe(120);
    expect(result?.mission.index).toBe(1);
    expect(result?.mission.total).toBe(2);
    expect(result?.mission.progressPct).toBe(0);
    expect(result?.mission.secteur).toBe('Secteur 4');
    expect(result?.mission.syncState).toBe('synced');
    expect(result?.address).toBe('224 rue Scott');
    expect(result?.problem).toBeUndefined();
    expect(result?.offline).toBeUndefined();
    expect(result?.map.residences).toEqual([{ n: 2, rank: 1, coordinate: [-73.6, 45.6] }]);
    expect(result?.map.position).toEqual({ longitude: -73.5, latitude: 45.5, heading: 0 });
  });

  it('derives APPROACHING and IN_PROGRESS timers from their own timestamps', () => {
    const approaching = item({
      id: 'i1',
      ordre: 1,
      status: 'APPROACHING',
      enRouteAt: '2026-08-01T07:50:00.000Z',
      enApprocheAt: '2026-08-01T07:59:00.000Z',
    });
    const approachingResult = deriveMissionScreenState(
      {
        mission: missionBase,
        activeMissionItem: approaching,
        nextMissionItems: [],
        allMissionItems: [approaching],
        synchronizationState: syncedState,
        offlineState: onlineState,
      },
      now
    );
    expect(approachingResult?.activeState).toBe('APPROACHING');
    expect(approachingResult?.timerSeconds).toBe(60);

    const inProgress = item({
      id: 'i2',
      ordre: 1,
      status: 'IN_PROGRESS',
      enApprocheAt: '2026-08-01T07:59:00.000Z',
      enCoursAt: '2026-08-01T07:57:00.000Z',
    });
    const inProgressResult = deriveMissionScreenState(
      {
        mission: missionBase,
        activeMissionItem: inProgress,
        nextMissionItems: [],
        allMissionItems: [inProgress],
        synchronizationState: syncedState,
        offlineState: onlineState,
      },
      now
    );
    expect(inProgressResult?.activeState).toBe('IN_PROGRESS');
    expect(inProgressResult?.timerSeconds).toBe(180);
  });

  it('finds a PROBLEM item via allMissionItems even though it cannot be the active item', () => {
    const problem = item({
      id: 'i1',
      ordre: 1,
      status: 'PROBLEM',
      problemCode: 'ACCES_BLOQUE',
      notes: 'Entrée bloquée par un véhicule',
      updatedAt: '2026-08-01T07:55:00.000Z',
    });
    const result = deriveMissionScreenState(
      {
        mission: missionBase,
        activeMissionItem: null,
        nextMissionItems: [],
        allMissionItems: [problem],
        synchronizationState: syncedState,
        offlineState: onlineState,
      },
      now
    );

    expect(result?.activeState).toBe('PROBLEM');
    expect(result?.stateLabel).toBe('PROBLÈME');
    expect(result?.problem).toEqual({
      type: 'ACCES_BLOQUE',
      note: 'Entrée bloquée par un véhicule',
      frozenSeconds: 300,
    });
  });

  it('prefers a PROBLEM item over an active item when both exist', () => {
    const active = item({ id: 'i1', ordre: 1, status: 'EN_ROUTE' });
    const problem = item({ id: 'i2', ordre: 2, status: 'PROBLEM', updatedAt: '2026-08-01T08:00:00.000Z' });
    const result = deriveMissionScreenState(
      {
        mission: missionBase,
        activeMissionItem: active,
        nextMissionItems: [],
        allMissionItems: [active, problem],
        synchronizationState: syncedState,
        offlineState: onlineState,
      },
      now
    );
    expect(result?.activeState).toBe('PROBLEM');
  });

  it('sets offline only when offlineState is not ONLINE', () => {
    const active = item({ id: 'i1', ordre: 1, status: 'EN_ROUTE' });
    const degradedState: OfflineEngineState = {
      status: 'DEGRADED',
      since: '2026-08-01T07:59:00.000Z',
      lastOnlineAt: '2026-08-01T07:58:00.000Z',
    };
    const result = deriveMissionScreenState(
      {
        mission: missionBase,
        activeMissionItem: active,
        nextMissionItems: [],
        allMissionItems: [active],
        synchronizationState: { status: 'PENDING', pendingCount: 3, failedCount: 0 },
        offlineState: degradedState,
      },
      now
    );
    expect(result?.offline).toEqual({ pendingOperations: 3 });
  });

  it('caps map residences at 5 and skips items without coordinates', () => {
    const active = item({ id: 'i0', ordre: 0, status: 'EN_ROUTE' });
    const nextItems = [
      item({ id: 'i1', ordre: 1, status: 'WAITING', latitude: 1, longitude: 1 }),
      item({ id: 'i2', ordre: 2, status: 'WAITING', latitude: null, longitude: null }),
      item({ id: 'i3', ordre: 3, status: 'WAITING', latitude: 3, longitude: 3 }),
      item({ id: 'i4', ordre: 4, status: 'WAITING', latitude: 4, longitude: 4 }),
      item({ id: 'i5', ordre: 5, status: 'WAITING', latitude: 5, longitude: 5 }),
      item({ id: 'i6', ordre: 6, status: 'WAITING', latitude: 6, longitude: 6 }),
    ];
    const result = deriveMissionScreenState(
      {
        mission: missionBase,
        activeMissionItem: active,
        nextMissionItems: nextItems,
        allMissionItems: [active, ...nextItems],
        synchronizationState: syncedState,
        offlineState: onlineState,
      },
      now
    );
    expect(result?.map.residences).toHaveLength(5);
    expect(result?.map.residences.every((r) => r.n !== 2)).toBe(true);
  });
});
