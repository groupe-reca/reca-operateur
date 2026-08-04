import type { Clock } from '@/domain/clock';
import type { StateMachine } from '@/engines/state-machine';

import { haversineDistanceMeters } from './distance';
import {
  DEFAULT_GPS_THRESHOLDS,
  type ActiveResidence,
  type GpsEngineEvent,
  type GpsEventListener,
  type GpsPosition,
  type GpsThresholds,
  type NextResidence,
} from './types';

export type GpsEngineDependencies = {
  stateMachine: StateMachine;
  clock: Clock;
  thresholds?: Partial<GpsThresholds>;
};

// docs/04 "États possibles" — mirrors the MissionItem states the engine is
// actively driving. IDLE = no residence currently being monitored.
type Phase = 'EN_ROUTE' | 'APPROACHING' | 'IN_PROGRESS' | 'IDLE';

type PendingValidationKind = 'ENTER_APPROACH' | 'ENTER_WORK' | 'EXIT_COMPLETION' | 'ENTER_ADJACENT';

type PendingValidation = { kind: PendingValidationKind; since: Date };

function secondsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 1000;
}

// docs/04-GPS-Engine.md — pure distance/threshold/delay logic that decides
// WHEN a MissionItem should move forward, then calls the State Machine
// (Sprint 009-010) to actually apply it. Never touches Supabase/the DB/React
// (docs/04 "il ne possède aucune interface graphique… ne communique jamais
// directement avec Supabase").
export function createGpsEngine({ stateMachine, clock, thresholds: overrides }: GpsEngineDependencies) {
  // Mutable (not `const`) — `setThresholds` (below) is what lets a caller
  // change these after creation, e.g. SettingsScreen's detection radii,
  // without tearing down and recreating the whole engine (which would lose
  // `active`/`phase`/`pending` mid-mission).
  let thresholds: GpsThresholds = { ...DEFAULT_GPS_THRESHOLDS, ...overrides };

  let active: ActiveResidence | null = null;
  let next: NextResidence | null = null;
  let phase: Phase = 'IDLE';
  let pending: PendingValidation | null = null;

  let headingCandidate: { value: number; since: Date } | null = null;
  let lastPublishedHeading: number | null = null;
  let lastAccuracyAccepted: boolean | null = null;
  let lastPositionAt: Date | null = null;
  let gpsLost = false;

  const listeners: GpsEventListener[] = [];
  const events: GpsEngineEvent[] = [];

  function emit(event: GpsEngineEvent) {
    events.push(event);
    listeners.forEach((listener) => listener(event));
  }

  // docs/04 "Démarrage" — normally called once the item is already EN_ROUTE
  // (the State Machine, not this engine, decides that first transition), so
  // `startingPhase` defaults to `EN_ROUTE`. A caller resuming monitoring
  // mid-flow (e.g. app restart while a residence is already APPROACHING/
  // IN_PROGRESS) passes the item's real current phase explicitly.
  function setActiveResidence(
    residence: ActiveResidence | null,
    nextResidence: NextResidence | null = null,
    startingPhase: Phase = 'EN_ROUTE'
  ): void {
    active = residence;
    next = nextResidence;
    phase = residence ? startingPhase : 'IDLE';
    pending = null;
  }

  function setNextResidence(residence: NextResidence | null): void {
    next = residence;
  }

  // docs/04 "Le moteur ne valide jamais immédiatement" — a candidate must be
  // observed again, at least `durationSeconds` later, still in the same
  // zone, before it's accepted. Mirrors the heading-stabilisation pattern.
  function validate(kind: PendingValidationKind, now: Date, durationSeconds: number): boolean {
    if (!pending || pending.kind !== kind) {
      pending = { kind, since: now };
      return false;
    }
    return secondsBetween(pending.since, now) >= durationSeconds;
  }

  function resetPendingIfMatches(kind: PendingValidationKind): void {
    if (pending && pending.kind === kind) {
      pending = null;
    }
  }

  function processHeading(headingDegrees: number, now: Date): void {
    if (!headingCandidate || headingCandidate.value !== headingDegrees) {
      headingCandidate = { value: headingDegrees, since: now };
      return;
    }
    if (lastPublishedHeading === headingDegrees) {
      return;
    }
    if (secondsBetween(headingCandidate.since, now) >= thresholds.headingValidationSeconds) {
      lastPublishedHeading = headingDegrees;
      emit({ type: 'HeadingChanged', headingDegrees, at: now.toISOString() });
    }
  }

  async function processZones(position: GpsPosition, now: Date): Promise<void> {
    if (!active) {
      return;
    }

    // docs/09 "Cas des résidences rapprochées" — only relevant once the
    // current residence is IN_PROGRESS and a next one is known.
    if (phase === 'IN_PROGRESS' && next) {
      const distanceToNext = haversineDistanceMeters(position, next.coordinate);
      if (distanceToNext <= thresholds.workRadiusMeters) {
        if (validate('ENTER_ADJACENT', now, thresholds.radiusEntryValidationSeconds)) {
          const currentId = active.missionItemId;
          const nextResidence = next;
          const result = await stateMachine.enterAdjacentResidence(currentId, nextResidence.missionItemId);
          if (result.success) {
            active = { missionItemId: nextResidence.missionItemId, coordinate: nextResidence.coordinate, detectionRadiusMeters: null };
            next = null;
            phase = 'IN_PROGRESS';
          }
          pending = null;
        }
        return;
      }
      resetPendingIfMatches('ENTER_ADJACENT');
    }

    const distance = haversineDistanceMeters(position, active.coordinate);
    const workRadius = active.detectionRadiusMeters ?? thresholds.workRadiusMeters;
    const gpsOptions = {
      source: 'GPS' as const,
      occurredAt: now,
      gpsAccuracyMeters: position.accuracyMeters,
      latitude: position.latitude,
      longitude: position.longitude,
    };

    if (phase === 'EN_ROUTE') {
      if (distance <= thresholds.approachRadiusMeters) {
        if (validate('ENTER_APPROACH', now, thresholds.radiusEntryValidationSeconds)) {
          const result = await stateMachine.enterApproach(active.missionItemId, gpsOptions);
          if (result.success) {
            phase = 'APPROACHING';
          }
          pending = null;
        }
      } else {
        resetPendingIfMatches('ENTER_APPROACH');
      }
      return;
    }

    if (phase === 'APPROACHING') {
      if (distance <= workRadius) {
        if (validate('ENTER_WORK', now, thresholds.radiusEntryValidationSeconds)) {
          const result = await stateMachine.enterWork(active.missionItemId, gpsOptions);
          if (result.success) {
            phase = 'IN_PROGRESS';
          }
          pending = null;
        }
      } else {
        resetPendingIfMatches('ENTER_WORK');
      }
      return;
    }

    if (phase === 'IN_PROGRESS') {
      if (distance > thresholds.completionRadiusMeters) {
        if (validate('EXIT_COMPLETION', now, thresholds.radiusExitValidationSeconds)) {
          const result = await stateMachine.completeItem(active.missionItemId, gpsOptions);
          if (result.success) {
            phase = 'IDLE';
            active = null;
          }
          pending = null;
        }
      } else {
        resetPendingIfMatches('EXIT_COMPLETION');
      }
    }
  }

  async function updatePosition(position: GpsPosition): Promise<void> {
    const now = position.timestamp;

    if (gpsLost) {
      gpsLost = false;
      emit({ type: 'GpsRecovered', at: now.toISOString() });
    }
    lastPositionAt = now;

    const accepted = position.accuracyMeters <= thresholds.maxAccuracyMeters;
    if (accepted !== lastAccuracyAccepted) {
      lastAccuracyAccepted = accepted;
      emit({ type: 'GpsAccuracyChanged', accuracyMeters: position.accuracyMeters, accepted, at: now.toISOString() });
    }

    if (position.headingDegrees != null) {
      processHeading(position.headingDegrees, now);
    }

    if (!accepted) {
      return; // docs/04: positions beyond the accuracy threshold are ignored for zone logic.
    }

    await processZones(position, now);
  }

  // docs/04 "GPS perdu" — call periodically (e.g. every few seconds) from
  // the caller that owns the real timer; this engine never starts its own.
  function checkTimeout(now: Date = clock.now()): void {
    if (gpsLost || !lastPositionAt) {
      return;
    }
    if (secondsBetween(lastPositionAt, now) >= thresholds.gpsLostTimeoutSeconds) {
      gpsLost = true;
      emit({ type: 'GpsLost', at: now.toISOString() });
    }
  }

  function on(listener: GpsEventListener): () => void {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    };
  }

  return {
    setActiveResidence,
    setNextResidence,
    updatePosition,
    checkTimeout,
    on,
    getEvents: (): GpsEngineEvent[] => [...events],
    getPhase: (): Phase => phase,
    getThresholds: (): GpsThresholds => ({ ...thresholds }),
    // Sprint "Réglages du rayon de détection" — merges into the current
    // thresholds (partial update, same shape as the constructor override).
    // Takes effect on the very next `updatePosition`/`checkTimeout` call —
    // `active`/`phase`/`pending` are untouched, so a mid-approach residence
    // doesn't reset just because the operator tweaked a radius.
    setThresholds(update: Partial<GpsThresholds>): void {
      thresholds = { ...thresholds, ...update };
    },
  };
}

export type GpsEngine = ReturnType<typeof createGpsEngine>;
