import { deriveMissionActiveState } from '@/screens/deriveMissionActiveState';
import type { Mission, MissionAlertRecord, MissionItem } from '@/domain/entities';
import type { MissionContextValue } from '@/context/MissionContext';

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'mission-1',
    date: '2026-08-02',
    route: 'Route 12A',
    operator: 'Opérateur Démo',
    equipment: 'Kubota 01',
    status: 'READY',
    scheduledStartAt: null,
    actualStartAt: null,
    actualEndAt: null,
    createdAt: '2026-08-02T09:00:00.000Z',
    updatedAt: '2026-08-02T09:00:00.000Z',
    ...overrides,
  };
}

function makeItem(overrides: Partial<MissionItem> = {}): MissionItem {
  return {
    id: 'item-1',
    missionId: 'mission-1',
    contractId: null,
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
    createdAt: '2026-08-02T09:00:00.000Z',
    updatedAt: '2026-08-02T09:00:00.000Z',
    ...overrides,
  };
}

function makeAlert(overrides: Partial<MissionAlertRecord> = {}): MissionAlertRecord {
  return {
    id: 'alert-1',
    missionItemId: 'item-1',
    level: 'warning',
    text: 'Plate-bande au fond',
    createdAt: '2026-08-02T09:00:00.000Z',
    ...overrides,
  };
}

function makeCtx(
  mission: Mission | null,
  allMissionItems: MissionItem[] = [],
  missionAlerts: MissionAlertRecord[] = [],
  synchronizationState: MissionContextValue['synchronizationState'] = { status: 'SYNCED', pendingCount: 0, failedCount: 0 },
  offlineState: MissionContextValue['offlineState'] = {
    status: 'ONLINE',
    since: '2026-08-02T09:00:00.000Z',
    lastOnlineAt: '2026-08-02T09:00:00.000Z',
  }
): Pick<MissionContextValue, 'mission' | 'allMissionItems' | 'missionAlerts' | 'synchronizationState' | 'offlineState'> {
  return { mission, allMissionItems, missionAlerts, synchronizationState, offlineState };
}

describe('deriveMissionActiveState', () => {
  it('returns null when there is no mission', () => {
    expect(deriveMissionActiveState(makeCtx(null))).toBeNull();
  });

  it('returns null when the mission is not READY (e.g. already IN_PROGRESS)', () => {
    expect(deriveMissionActiveState(makeCtx(makeMission({ status: 'IN_PROGRESS' })))).toBeNull();
  });

  it('returns null when the mission is COMPLETED', () => {
    expect(deriveMissionActiveState(makeCtx(makeMission({ status: 'COMPLETED' })))).toBeNull();
  });

  it('is eligible for a READY mission, with residence count/equipment/empty alerts', () => {
    const mission = makeMission();
    const items = [makeItem(), makeItem({ id: 'item-2', ordre: 2 })];
    const state = deriveMissionActiveState(makeCtx(mission, items));

    expect(state).toEqual({
      secteur: 'Route 12A',
      date: '2026-08-02',
      equipment: 'Kubota 01',
      residenceCount: 2,
      syncState: 'synced',
      connectivityStatus: 'ONLINE',
      alerts: [],
    });
  });

  it('maps missionAlerts to level/text, nothing invented', () => {
    const mission = makeMission();
    const alerts = [makeAlert({ level: 'danger', text: 'Chien en liberté' })];
    const state = deriveMissionActiveState(makeCtx(mission, [makeItem()], alerts));

    expect(state?.alerts).toEqual([{ level: 'danger', text: 'Chien en liberté' }]);
  });

  it('reflects a real offline/pending sync state honestly', () => {
    const mission = makeMission();
    const state = deriveMissionActiveState(
      makeCtx(mission, [], [], { status: 'PENDING', pendingCount: 2, failedCount: 0 }, {
        status: 'OFFLINE',
        since: '2026-08-02T09:00:00.000Z',
        lastOnlineAt: null,
      })
    );

    expect(state?.syncState).toBe('pending');
    expect(state?.connectivityStatus).toBe('OFFLINE');
  });
});
