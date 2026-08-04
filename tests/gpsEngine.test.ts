import type { Clock } from '@/domain/clock';
import type { Mission, MissionItem } from '@/domain/entities';
import { createGpsEngine, createGpsSimulator, haversineDistanceMeters, type GpsEngineEvent } from '@/engines/gps';
import { createStateMachine } from '@/engines/state-machine';
import { createMissionItemRepository } from '@/persistence/repositories/missionItemRepository';
import { createMissionRepository } from '@/persistence/repositories/missionRepository';

import { createFakeDb } from './testFakeDb';

const BASE = { latitude: 45.7803, longitude: -74.0035 }; // Saint-Jérôme, QC — same as MOCK_MAP.

function offsetNorth(coordinate: typeof BASE, meters: number) {
  return { latitude: coordinate.latitude + meters / 111320, longitude: coordinate.longitude };
}

function createMutableClock(start: Date): Clock & { set(date: Date): void } {
  let now = start;
  return { now: () => now, set: (date: Date) => (now = date) };
}

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
  latitude: BASE.latitude,
  longitude: BASE.longitude,
  detectionRadiusMeters: null,
  enRouteAt: '2026-08-01T08:00:00.000Z',
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

async function setup(items: MissionItem[]) {
  const db = createFakeDb();
  const clock = createMutableClock(new Date('2026-08-01T08:00:00.000Z'));
  const missionRepo = createMissionRepository(db);
  const itemRepo = createMissionItemRepository(db);
  await missionRepo.upsert(missionBase);
  for (const i of items) {
    await itemRepo.upsert(i);
  }
  const stateMachine = createStateMachine(db, clock);
  const engine = createGpsEngine({ stateMachine, clock });
  return { db, itemRepo, stateMachine, engine, clock };
}

describe('haversineDistanceMeters', () => {
  it('matches the known ~111.32 km per degree of longitude at the equator', () => {
    const distance = haversineDistanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 });
    expect(distance).toBeGreaterThan(111000);
    expect(distance).toBeLessThan(111700);
  });

  it('returns 0 for identical coordinates', () => {
    expect(haversineDistanceMeters(BASE, BASE)).toBe(0);
  });
});

describe('GpsEngine — zone transitions call the State Machine after validation', () => {
  it('EN_ROUTE → APPROACHING only after staying within 250m for the entry delay', async () => {
    const { itemRepo, engine, clock } = await setup([item({ id: 'a', ordre: 1, status: 'EN_ROUTE' })]);
    engine.setActiveResidence({ missionItemId: 'a', coordinate: BASE, detectionRadiusMeters: null });

    const near = offsetNorth(BASE, 100); // inside the 250m approach radius
    await engine.updatePosition({ ...near, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    expect((await itemRepo.getById('a'))?.status).toBe('EN_ROUTE'); // not yet — validation pending

    clock.set(new Date(clock.now().getTime() + 4000)); // only 4s elapsed — under the 5s delay
    await engine.updatePosition({ ...near, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    expect((await itemRepo.getById('a'))?.status).toBe('EN_ROUTE');

    clock.set(new Date(clock.now().getTime() + 2000)); // total 6s — delay satisfied
    await engine.updatePosition({ ...near, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    expect((await itemRepo.getById('a'))?.status).toBe('APPROACHING');
    expect(engine.getPhase()).toBe('APPROACHING');
  });

  it('resets validation if the operator leaves the radius before the delay elapses', async () => {
    const { itemRepo, engine, clock } = await setup([item({ id: 'a', ordre: 1, status: 'EN_ROUTE' })]);
    engine.setActiveResidence({ missionItemId: 'a', coordinate: BASE, detectionRadiusMeters: null });

    const near = offsetNorth(BASE, 100);
    const far = offsetNorth(BASE, 1000);
    await engine.updatePosition({ ...near, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    clock.set(new Date(clock.now().getTime() + 2000));
    await engine.updatePosition({ ...far, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() }); // left the radius

    clock.set(new Date(clock.now().getTime() + 10000));
    await engine.updatePosition({ ...near, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    // Re-entering restarts the delay — not enough time has passed since this re-entry.
    expect((await itemRepo.getById('a'))?.status).toBe('EN_ROUTE');
  });

  it('APPROACHING → IN_PROGRESS within the (default) 30m work radius, then IN_PROGRESS → COMPLETED beyond 50m', async () => {
    const { itemRepo, engine, clock } = await setup([item({ id: 'a', ordre: 1, status: 'APPROACHING', enApprocheAt: '2026-08-01T08:00:00.000Z' })]);
    engine.setActiveResidence({ missionItemId: 'a', coordinate: BASE, detectionRadiusMeters: null }, null, 'APPROACHING');

    const inWorkRadius = offsetNorth(BASE, 10);
    await engine.updatePosition({ ...inWorkRadius, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    clock.set(new Date(clock.now().getTime() + 6000));
    await engine.updatePosition({ ...inWorkRadius, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    expect((await itemRepo.getById('a'))?.status).toBe('IN_PROGRESS');

    const outsideCompletion = offsetNorth(BASE, 80);
    await engine.updatePosition({ ...outsideCompletion, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    clock.set(new Date(clock.now().getTime() + 6000));
    await engine.updatePosition({ ...outsideCompletion, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    const completed = await itemRepo.getById('a');
    expect(completed?.status).toBe('COMPLETED');
    expect(engine.getPhase()).toBe('IDLE');
  });

  it('honours a residence-specific detectionRadiusMeters instead of the global work radius', async () => {
    const { itemRepo, engine, clock } = await setup([item({ id: 'a', ordre: 1, status: 'APPROACHING' })]);
    engine.setActiveResidence({ missionItemId: 'a', coordinate: BASE, detectionRadiusMeters: 15 }, null, 'APPROACHING');

    const at20m = offsetNorth(BASE, 20); // outside the 15m override, inside the 30m global default
    await engine.updatePosition({ ...at20m, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    clock.set(new Date(clock.now().getTime() + 6000));
    await engine.updatePosition({ ...at20m, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    expect((await itemRepo.getById('a'))?.status).toBe('APPROACHING'); // still outside the 15m override
  });
});

describe('GpsEngine — résidences adjacentes', () => {
  it('completes A and starts B when B is entered while A is still IN_PROGRESS', async () => {
    const { itemRepo, engine, clock } = await setup([
      item({ id: 'a', ordre: 1, status: 'IN_PROGRESS', enCoursAt: '2026-08-01T08:00:00.000Z' }),
      item({ id: 'b', ordre: 2, status: 'WAITING', latitude: offsetNorth(BASE, 40).latitude, longitude: offsetNorth(BASE, 40).longitude }),
    ]);
    const bCoordinate = offsetNorth(BASE, 40);
    engine.setActiveResidence(
      { missionItemId: 'a', coordinate: BASE, detectionRadiusMeters: null },
      { missionItemId: 'b', coordinate: bCoordinate },
      'IN_PROGRESS'
    );

    const nearB = offsetNorth(BASE, 35); // within 30m of B (5m away), still ~35m from A
    await engine.updatePosition({ ...nearB, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    clock.set(new Date(clock.now().getTime() + 6000));
    await engine.updatePosition({ ...nearB, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });

    expect((await itemRepo.getById('a'))?.status).toBe('COMPLETED');
    const b = await itemRepo.getById('b');
    expect(b?.status).toBe('IN_PROGRESS');
    expect(b?.travelTimeSeconds).toBe(5);
    expect(engine.getPhase()).toBe('IN_PROGRESS');
  });
});

describe('GpsEngine — accuracy filtering, heading stabilisation, GPS loss', () => {
  it('ignores fixes beyond the accuracy threshold for zone logic but still emits GpsAccuracyChanged', async () => {
    const { itemRepo, engine, clock } = await setup([item({ id: 'a', ordre: 1, status: 'EN_ROUTE' })]);
    engine.setActiveResidence({ missionItemId: 'a', coordinate: BASE, detectionRadiusMeters: null });
    const seen: GpsEngineEvent[] = [];
    engine.on((event) => seen.push(event));

    const inside = offsetNorth(BASE, 10); // well within every radius
    await engine.updatePosition({ ...inside, accuracyMeters: 999, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    clock.set(new Date(clock.now().getTime() + 6000));
    await engine.updatePosition({ ...inside, accuracyMeters: 999, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });

    expect((await itemRepo.getById('a'))?.status).toBe('EN_ROUTE'); // never processed — accuracy rejected
    expect(seen.some((event) => event.type === 'GpsAccuracyChanged' && event.accepted === false)).toBe(true);
  });

  it('publishes HeadingChanged only once a candidate heading holds for the validation delay', async () => {
    const { engine, clock } = await setup([item({ id: 'a', ordre: 1, status: 'EN_ROUTE' })]);
    engine.setActiveResidence({ missionItemId: 'a', coordinate: BASE, detectionRadiusMeters: null });
    const seen: GpsEngineEvent[] = [];
    engine.on((event) => seen.push(event));

    const far = offsetNorth(BASE, 5000); // stay well outside every radius — isolates heading logic
    await engine.updatePosition({ ...far, accuracyMeters: 5, headingDegrees: 90, speedMetersPerSecond: 5, timestamp: clock.now() });
    expect(seen.filter((e) => e.type === 'HeadingChanged')).toHaveLength(0);

    clock.set(new Date(clock.now().getTime() + 1000));
    await engine.updatePosition({ ...far, accuracyMeters: 5, headingDegrees: 45, speedMetersPerSecond: 5, timestamp: clock.now() }); // changed — resets candidate
    clock.set(new Date(clock.now().getTime() + 4000));
    await engine.updatePosition({ ...far, accuracyMeters: 5, headingDegrees: 45, speedMetersPerSecond: 5, timestamp: clock.now() });
    expect(seen.filter((e) => e.type === 'HeadingChanged')).toHaveLength(1);
    expect(seen.find((e) => e.type === 'HeadingChanged')).toMatchObject({ headingDegrees: 45 });
  });

  it('emits GpsLost after the timeout with no position update, then GpsRecovered on the next fix — no state transition', async () => {
    const { itemRepo, engine, clock } = await setup([item({ id: 'a', ordre: 1, status: 'EN_ROUTE' })]);
    engine.setActiveResidence({ missionItemId: 'a', coordinate: BASE, detectionRadiusMeters: null });
    const seen: GpsEngineEvent[] = [];
    engine.on((event) => seen.push(event));

    await engine.updatePosition({ ...offsetNorth(BASE, 5000), accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    clock.set(new Date(clock.now().getTime() + 20000));
    engine.checkTimeout(clock.now());
    expect(seen.some((e) => e.type === 'GpsLost')).toBe(true);
    expect((await itemRepo.getById('a'))?.status).toBe('EN_ROUTE'); // GPS loss never terminates/advances a residence

    await engine.updatePosition({ ...offsetNorth(BASE, 5000), accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    expect(seen.some((e) => e.type === 'GpsRecovered')).toBe(true);
  });
});

describe('GpsEngine — setThresholds/getThresholds (Sprint "Réglages du rayon de détection")', () => {
  it('getThresholds returns the defaults merged with the constructor override', async () => {
    const { db, clock } = await setup([]);
    const stateMachine = createStateMachine(db, clock);
    const engine = createGpsEngine({ stateMachine, clock, thresholds: { approachRadiusMeters: 500 } });
    expect(engine.getThresholds().approachRadiusMeters).toBe(500);
    expect(engine.getThresholds().workRadiusMeters).toBe(30); // untouched default
  });

  it('setThresholds changes a shrunk approach radius so a position outside the new radius no longer qualifies', async () => {
    const { itemRepo, engine, clock } = await setup([item({ id: 'a', ordre: 1, status: 'EN_ROUTE' })]);
    engine.setActiveResidence({ missionItemId: 'a', coordinate: BASE, detectionRadiusMeters: null });

    const at200m = offsetNorth(BASE, 200); // inside the default 250m approach radius
    engine.setThresholds({ approachRadiusMeters: 100 }); // now outside the new, shrunk radius

    await engine.updatePosition({ ...at200m, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    clock.set(new Date(clock.now().getTime() + 6000));
    await engine.updatePosition({ ...at200m, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });

    expect((await itemRepo.getById('a'))?.status).toBe('EN_ROUTE'); // never enters APPROACHING
    expect(engine.getThresholds().approachRadiusMeters).toBe(100);
  });

  it('setThresholds does not reset an already-armed pending validation for an unrelated threshold', async () => {
    const { itemRepo, engine, clock } = await setup([item({ id: 'a', ordre: 1, status: 'EN_ROUTE' })]);
    engine.setActiveResidence({ missionItemId: 'a', coordinate: BASE, detectionRadiusMeters: null });

    const near = offsetNorth(BASE, 100);
    await engine.updatePosition({ ...near, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    engine.setThresholds({ workRadiusMeters: 20 }); // unrelated to the pending ENTER_APPROACH candidate

    clock.set(new Date(clock.now().getTime() + 6000));
    await engine.updatePosition({ ...near, accuracyMeters: 5, headingDegrees: null, speedMetersPerSecond: null, timestamp: clock.now() });
    expect((await itemRepo.getById('a'))?.status).toBe('APPROACHING');
  });
});

describe('GpsSimulator — drives the same engine as production (docs/09)', () => {
  it('reproduces the EN_ROUTE → APPROACHING flow through the simulator API', async () => {
    const { itemRepo, engine, clock } = await setup([item({ id: 'a', ordre: 1, status: 'EN_ROUTE' })]);
    engine.setActiveResidence({ missionItemId: 'a', coordinate: BASE, detectionRadiusMeters: null });
    const simulator = createGpsSimulator(engine, clock);

    await simulator.moveTo(offsetNorth(BASE, 100));
    await simulator.advanceTime(6);
    expect((await itemRepo.getById('a'))?.status).toBe('APPROACHING');
  });

  it('simulates a full GPS loss/recovery cycle', async () => {
    const { engine, clock } = await setup([item({ id: 'a', ordre: 1, status: 'EN_ROUTE' })]);
    engine.setActiveResidence({ missionItemId: 'a', coordinate: BASE, detectionRadiusMeters: null });
    const simulator = createGpsSimulator(engine, clock);
    const seen: GpsEngineEvent[] = [];
    engine.on((event) => seen.push(event));

    await simulator.moveTo(offsetNorth(BASE, 5000));
    simulator.loseSignal();
    await simulator.advanceTime(20);
    expect(seen.some((e) => e.type === 'GpsLost')).toBe(true);

    await simulator.recoverSignal(offsetNorth(BASE, 5000));
    expect(seen.some((e) => e.type === 'GpsRecovered')).toBe(true);
  });
});
