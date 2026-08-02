// docs/08-Offline-Mode.md "Détection du mode hors ligne" lists 6 statuses;
// this sprint's owner-approved scope (voir plans.md) covers only these 4 —
// SERVER_UNAVAILABLE/AUTHENTICATION_DEGRADED need a real server ping / auth
// refresh check, deferred explicitly, never silently dropped.
export type ConnectivityStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'RECOVERING';

// docs/08 "MissionContext hors ligne" — deliberately minimal subset of the
// documented OfflineState type. `pendingOperations`/`pendingMedia` stay the
// Sync Engine's responsibility (docs/08: Offline Mode is not responsible for
// "remplacer le Synchronization Engine") — not duplicated here.
export type OfflineEngineState = {
  status: ConnectivityStatus;
  since: string;
  lastOnlineAt: string | null;
};

export type OfflineEngineEvent =
  | { type: 'OfflineModeActivated'; at: string }
  | { type: 'OfflineModeDeactivated'; at: string }
  | { type: 'ConnectivityDegraded'; at: string }
  | { type: 'ConnectivityRecovered'; at: string };

export type OfflineEventListener = (event: OfflineEngineEvent) => void;
