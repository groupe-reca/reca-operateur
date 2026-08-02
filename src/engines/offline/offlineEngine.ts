import type { Clock } from '@/domain/clock';
import type { NetworkStatusProvider } from '@/engines/sync/types';

import type { ConnectivityStatus, OfflineEngineEvent, OfflineEngineState, OfflineEventListener } from './types';

export type OfflineEngineDependencies = {
  clock: Clock;
  // Reused from the Sync Engine (src/engines/sync/types.ts) rather than
  // inventing a second network-status contract — docs/08 doesn't ask for a
  // separate one, and both engines just need `isOnline(): boolean`.
  networkStatus: NetworkStatusProvider;
  // docs/08 "Validation de la perte réseau": "une seule requête échouée ne
  // doit pas suffire" — number of consecutive failed operations (system
  // network still reporting available) before ONLINE -> DEGRADED.
  consecutiveFailureThreshold?: number;
  // docs/08 "État RECOVERING": "ne doit pas afficher immédiatement En ligne
  // avant cette validation" — minimum time spent in RECOVERING before
  // auto-confirming ONLINE, unless a real successful operation confirms it
  // sooner (see recordOperationOutcome).
  recoveryValidationDelaySeconds?: number;
};

const DEFAULT_CONSECUTIVE_FAILURE_THRESHOLD = 3;
const DEFAULT_RECOVERY_VALIDATION_DELAY_SECONDS = 5;

// Pure engine (docs/02: "les moteurs ne connaissent jamais React"), no timer
// of its own (same principle as the GPS Engine, docs/04: "le moteur ne
// possède aucun timer propre") — the caller polls `checkConnectivity()`
// periodically and calls `recordOperationOutcome()` after each real network
// attempt (e.g. from the Sync Engine). Sprint 015 scope (see plans.md):
// only ONLINE/DEGRADED/OFFLINE/RECOVERING — SERVER_UNAVAILABLE and
// AUTHENTICATION_DEGRADED need a real server ping / auth refresh check,
// explicitly deferred, not silently dropped.
export function createOfflineEngine({
  clock,
  networkStatus,
  consecutiveFailureThreshold = DEFAULT_CONSECUTIVE_FAILURE_THRESHOLD,
  recoveryValidationDelaySeconds = DEFAULT_RECOVERY_VALIDATION_DELAY_SECONDS,
}: OfflineEngineDependencies) {
  const startedAt = clock.now().toISOString();
  let status: ConnectivityStatus = 'ONLINE';
  let since = startedAt;
  let lastOnlineAt: string | null = startedAt;
  let consecutiveFailures = 0;
  let recoveringSince: Date | null = null;

  const listeners: OfflineEventListener[] = [];
  const events: OfflineEngineEvent[] = [];

  function emit(event: OfflineEngineEvent): void {
    events.push(event);
    listeners.forEach((listener) => listener(event));
  }

  // Each transition source pairs with exactly one event type — RECOVERING is
  // only ever reached from OFFLINE, so ONLINE<-RECOVERING alone is enough to
  // know a real offline period just ended (no extra "was offline" flag
  // needed).
  function transitionTo(next: ConnectivityStatus, now: Date): void {
    if (status === next) return;
    const previous = status;
    status = next;
    since = now.toISOString();

    if (next === 'OFFLINE') {
      emit({ type: 'OfflineModeActivated', at: since });
    } else if (next === 'DEGRADED') {
      emit({ type: 'ConnectivityDegraded', at: since });
    } else if (next === 'ONLINE' && previous === 'DEGRADED') {
      emit({ type: 'ConnectivityRecovered', at: since });
    } else if (next === 'ONLINE' && previous === 'RECOVERING') {
      emit({ type: 'ConnectivityRecovered', at: since });
      emit({ type: 'OfflineModeDeactivated', at: since });
    }
  }

  function checkConnectivity(): void {
    const now = clock.now();
    const online = networkStatus.isOnline();

    if (!online) {
      if (status !== 'OFFLINE') {
        consecutiveFailures = 0;
        recoveringSince = null;
        transitionTo('OFFLINE', now);
      }
      return;
    }

    if (status === 'OFFLINE') {
      recoveringSince = now;
      transitionTo('RECOVERING', now);
      return;
    }

    if (status === 'RECOVERING') {
      const elapsedSeconds = (now.getTime() - (recoveringSince?.getTime() ?? now.getTime())) / 1000;
      if (elapsedSeconds >= recoveryValidationDelaySeconds) {
        lastOnlineAt = now.toISOString();
        recoveringSince = null;
        transitionTo('ONLINE', now);
      }
      return;
    }

    if (status === 'ONLINE') {
      lastOnlineAt = now.toISOString();
    }
    // DEGRADED stays until recordOperationOutcome resolves it (a success) or
    // checkConnectivity later observes the system network is truly gone.
  }

  function recordOperationOutcome(success: boolean): void {
    const now = clock.now();

    if (success) {
      consecutiveFailures = 0;
      if (status === 'DEGRADED') {
        lastOnlineAt = now.toISOString();
        transitionTo('ONLINE', now);
      } else if (status === 'RECOVERING') {
        // A real successful operation is a stronger signal than the time-based
        // delay alone — confirm immediately rather than waiting it out.
        lastOnlineAt = now.toISOString();
        recoveringSince = null;
        transitionTo('ONLINE', now);
      } else if (status === 'ONLINE') {
        lastOnlineAt = now.toISOString();
      }
      return;
    }

    if (status === 'ONLINE' || status === 'DEGRADED') {
      consecutiveFailures += 1;
      if (status === 'ONLINE' && consecutiveFailures >= consecutiveFailureThreshold) {
        transitionTo('DEGRADED', now);
      }
    }
  }

  function getState(): OfflineEngineState {
    return { status, since, lastOnlineAt };
  }

  function on(listener: OfflineEventListener): () => void {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  }

  return {
    checkConnectivity,
    recordOperationOutcome,
    getState,
    on,
    getEvents: (): OfflineEngineEvent[] => [...events],
  };
}

export type OfflineEngine = ReturnType<typeof createOfflineEngine>;
