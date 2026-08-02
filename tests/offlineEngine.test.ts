import type { Clock } from '@/domain/clock';
import { createOfflineEngine } from '@/engines/offline';
import type { OfflineEngineEvent } from '@/engines/offline';

function createMutableClock(start: Date): Clock & { advanceSeconds(seconds: number): void } {
  let now = start;
  return {
    now: () => now,
    advanceSeconds: (seconds: number) => {
      now = new Date(now.getTime() + seconds * 1000);
    },
  };
}

function createFakeNetwork(initial: boolean): { isOnline(): boolean; set(value: boolean): void } {
  let online = initial;
  return { isOnline: () => online, set: (value: boolean) => (online = value) };
}

describe('offlineEngine', () => {
  it('starts ONLINE', () => {
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const network = createFakeNetwork(true);
    const engine = createOfflineEngine({ clock, networkStatus: network });
    expect(engine.getState().status).toBe('ONLINE');
  });

  it('a single failed operation does not trigger DEGRADED (docs/08: "une seule requête échouée ne doit pas suffire")', () => {
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const network = createFakeNetwork(true);
    const engine = createOfflineEngine({ clock, networkStatus: network, consecutiveFailureThreshold: 3 });

    engine.recordOperationOutcome(false);
    expect(engine.getState().status).toBe('ONLINE');
  });

  it('N consecutive failures (system network still available) trigger DEGRADED', () => {
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const network = createFakeNetwork(true);
    const engine = createOfflineEngine({ clock, networkStatus: network, consecutiveFailureThreshold: 3 });

    engine.recordOperationOutcome(false);
    engine.recordOperationOutcome(false);
    expect(engine.getState().status).toBe('ONLINE');
    engine.recordOperationOutcome(false);
    expect(engine.getState().status).toBe('DEGRADED');

    const events = engine.getEvents();
    expect(events.some((e) => e.type === 'ConnectivityDegraded')).toBe(true);
  });

  it('a success after DEGRADED resets the failure count and returns to ONLINE', () => {
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const network = createFakeNetwork(true);
    const engine = createOfflineEngine({ clock, networkStatus: network, consecutiveFailureThreshold: 2 });

    engine.recordOperationOutcome(false);
    engine.recordOperationOutcome(false);
    expect(engine.getState().status).toBe('DEGRADED');

    engine.recordOperationOutcome(true);
    expect(engine.getState().status).toBe('ONLINE');

    // Failure count was reset — needs the full threshold again, not just one more.
    engine.recordOperationOutcome(false);
    expect(engine.getState().status).toBe('ONLINE');
  });

  it('system network unavailable triggers OFFLINE immediately (no threshold needed)', () => {
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const network = createFakeNetwork(true);
    const engine = createOfflineEngine({ clock, networkStatus: network });

    network.set(false);
    engine.checkConnectivity();

    expect(engine.getState().status).toBe('OFFLINE');
    expect(engine.getEvents().some((e) => e.type === 'OfflineModeActivated')).toBe(true);
  });

  it('OFFLINE -> RECOVERING -> ONLINE only after the validation delay (not immediately)', () => {
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const network = createFakeNetwork(false);
    const engine = createOfflineEngine({ clock, networkStatus: network, recoveryValidationDelaySeconds: 5 });

    engine.checkConnectivity();
    expect(engine.getState().status).toBe('OFFLINE');

    network.set(true);
    engine.checkConnectivity();
    expect(engine.getState().status).toBe('RECOVERING');

    clock.advanceSeconds(2);
    engine.checkConnectivity();
    expect(engine.getState().status).toBe('RECOVERING');

    clock.advanceSeconds(4);
    engine.checkConnectivity();
    expect(engine.getState().status).toBe('ONLINE');

    const types = engine.getEvents().map((e: OfflineEngineEvent) => e.type);
    expect(types).toEqual(['OfflineModeActivated', 'ConnectivityRecovered', 'OfflineModeDeactivated']);
  });

  it('a real successful operation during RECOVERING confirms ONLINE immediately, skipping the delay', () => {
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const network = createFakeNetwork(false);
    const engine = createOfflineEngine({ clock, networkStatus: network, recoveryValidationDelaySeconds: 30 });

    engine.checkConnectivity();
    network.set(true);
    engine.checkConnectivity();
    expect(engine.getState().status).toBe('RECOVERING');

    engine.recordOperationOutcome(true);
    expect(engine.getState().status).toBe('ONLINE');
  });

  it('tracks lastOnlineAt while ONLINE and leaves it untouched while OFFLINE', () => {
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const network = createFakeNetwork(true);
    const engine = createOfflineEngine({ clock, networkStatus: network });

    engine.checkConnectivity();
    const onlineAt = engine.getState().lastOnlineAt;
    expect(onlineAt).toBe('2026-08-02T08:00:00.000Z');

    clock.advanceSeconds(60);
    network.set(false);
    engine.checkConnectivity();
    expect(engine.getState().status).toBe('OFFLINE');
    expect(engine.getState().lastOnlineAt).toBe(onlineAt);
  });

  it('notifies subscribers and unsubscribe stops further notifications', () => {
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const network = createFakeNetwork(true);
    const engine = createOfflineEngine({ clock, networkStatus: network });

    const received: OfflineEngineEvent[] = [];
    const unsubscribe = engine.on((event) => received.push(event));

    network.set(false);
    engine.checkConnectivity();
    expect(received).toHaveLength(1);

    unsubscribe();
    network.set(true);
    engine.checkConnectivity(); // -> RECOVERING
    expect(received).toHaveLength(1);
  });
});
