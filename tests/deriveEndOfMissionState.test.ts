import { deriveEndOfMissionState } from '@/screens/deriveEndOfMissionState';
import type { Mission, MissionItem } from '@/domain/entities';
import type { MissionContextValue } from '@/context/MissionContext';

const NOW = new Date('2026-08-02T12:00:00.000Z');

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'mission-1',
    date: '2026-08-02',
    route: 'Route 12A',
    operator: null,
    equipment: null,
    status: 'IN_PROGRESS',
    scheduledStartAt: null,
    actualStartAt: '2026-08-02T10:00:00.000Z',
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
    status: 'COMPLETED',
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

function makeCtx(
  mission: Mission | null,
  allMissionItems: MissionItem[],
  synchronizationState: MissionContextValue['synchronizationState'] = {
    status: 'SYNCED',
    pendingCount: 0,
    failedCount: 0,
  }
): Pick<MissionContextValue, 'mission' | 'allMissionItems' | 'synchronizationState'> {
  return { mission, allMissionItems, synchronizationState };
}

describe('deriveEndOfMissionState', () => {
  it('returns null when there is no mission', () => {
    expect(deriveEndOfMissionState(makeCtx(null, []), NOW)).toBeNull();
  });

  it('returns null when the mission is already COMPLETED', () => {
    const mission = makeMission({ status: 'COMPLETED' });
    const items = [makeItem({ status: 'COMPLETED' })];
    expect(deriveEndOfMissionState(makeCtx(mission, items), NOW)).toBeNull();
  });

  it('returns null while a MissionItem is still WAITING', () => {
    const mission = makeMission();
    const items = [makeItem({ status: 'COMPLETED' }), makeItem({ id: 'item-2', status: 'WAITING' })];
    expect(deriveEndOfMissionState(makeCtx(mission, items), NOW)).toBeNull();
  });

  it('returns null while a MissionItem is in an active state (EN_ROUTE/APPROACHING/IN_PROGRESS)', () => {
    const mission = makeMission();
    const items = [makeItem({ status: 'COMPLETED' }), makeItem({ id: 'item-2', status: 'APPROACHING' })];
    expect(deriveEndOfMissionState(makeCtx(mission, items), NOW)).toBeNull();
  });

  it('is eligible when a PROBLEM item remains — a remaining problem is not a blocker (terminee_avec_anomalies)', () => {
    const mission = makeMission();
    const items = [
      makeItem({ status: 'COMPLETED' }),
      makeItem({ id: 'item-2', status: 'PROBLEM', problemCode: 'ACCES_BLOQUE', notes: 'Entrée bloquée' }),
    ];
    const state = deriveEndOfMissionState(makeCtx(mission, items), NOW);
    expect(state).not.toBeNull();
    expect(state?.problemItems).toEqual([
      { address: '224 rue Scott', problemCode: 'ACCES_BLOQUE', note: 'Entrée bloquée' },
    ]);
  });

  it('is eligible when a SKIPPED item remains', () => {
    const mission = makeMission();
    const items = [makeItem({ status: 'COMPLETED' }), makeItem({ id: 'item-2', status: 'SKIPPED' })];
    const state = deriveEndOfMissionState(makeCtx(mission, items), NOW);
    expect(state).not.toBeNull();
    expect(state?.problemItems.length).toBe(1);
  });

  it('computes counts, duration and sync fields from real data, nothing invented', () => {
    const mission = makeMission({ route: 'Secteur Nord', actualStartAt: '2026-08-02T10:30:00.000Z' });
    const items = [
      makeItem({ status: 'COMPLETED' }),
      makeItem({ id: 'item-2', status: 'COMPLETED' }),
      makeItem({ id: 'item-3', status: 'SKIPPED' }),
    ];
    const state = deriveEndOfMissionState(
      makeCtx(mission, items, { status: 'PENDING', pendingCount: 3, failedCount: 0 }),
      NOW
    );
    expect(state).toEqual({
      secteur: 'Secteur Nord',
      date: '2026-08-02',
      total: 3,
      completedCount: 2,
      problemItems: [{ address: '224 rue Scott', problemCode: null, note: null }],
      missionDurationSeconds: 5400,
      syncState: 'pending',
      pendingOperations: 3,
    });
  });
});
