import type { Clock } from '@/domain/clock';

import type { GpsEngine } from './gpsEngine';
import type { GpsCoordinate } from './types';

export type GpsFixOptions = {
  accuracyMeters?: number;
  headingDegrees?: number | null;
  speedMetersPerSecond?: number | null;
};

// docs/11-Roadmap.md Phase 07 "Simulation obligatoire" — a Travail of this
// phase, not deferred UI (unlike the State Machine's dev-mode simulator,
// Sprint 017-019). Drives the *same* `GpsEngine` used in production
// (docs/09 "la simulation doit utiliser la même State Machine que la
// production") by feeding it hand-controlled positions on a fake clock.
export function createGpsSimulator(engine: GpsEngine, clock: Clock) {
  let now = clock.now();
  let lastFix: (GpsCoordinate & Required<GpsFixOptions>) | null = null;

  async function moveTo(coordinate: GpsCoordinate, options: GpsFixOptions = {}): Promise<void> {
    lastFix = {
      ...coordinate,
      accuracyMeters: options.accuracyMeters ?? 5,
      headingDegrees: options.headingDegrees ?? null,
      speedMetersPerSecond: options.speedMetersPerSecond ?? null,
    };
    await engine.updatePosition({ ...lastFix, timestamp: now });
  }

  // Advances the simulated clock. If a position was already set, it's
  // re-sent at the new time (as a real GPS would keep pinging from roughly
  // the same spot) — this is what lets radius-entry/exit validation delays
  // actually elapse in a test. If the signal was lost, no fix is sent and
  // the engine's own timeout check runs instead.
  async function advanceTime(seconds: number): Promise<void> {
    now = new Date(now.getTime() + seconds * 1000);
    if (lastFix) {
      await engine.updatePosition({ ...lastFix, timestamp: now });
    } else {
      engine.checkTimeout(now);
    }
  }

  function loseSignal(): void {
    lastFix = null;
  }

  async function recoverSignal(coordinate: GpsCoordinate, options: GpsFixOptions = {}): Promise<void> {
    await moveTo(coordinate, options);
  }

  return { moveTo, advanceTime, loseSignal, recoverSignal, now: () => now };
}

export type GpsSimulator = ReturnType<typeof createGpsSimulator>;
