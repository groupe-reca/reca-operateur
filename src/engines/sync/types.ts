import type { SyncOperation } from '@/domain/entities';

// docs/07-Synchronization.md "Détection du réseau" — a caller supplies the
// real signal (NetInfo, XHR probing, …), never wired here. Not wired to a
// real sensor this sprint (see plans.md — same principle as GPS/State
// Machine: logic first, sensor later).
export type NetworkStatusProvider = {
  isOnline(): boolean;
};

// docs/07 "Erreurs temporaires"/"Erreurs permanentes" — the transport tells
// the engine which family an outcome belongs to; the engine decides what to
// do with that (retry with backoff vs. BLOCKED immediately).
export type SyncOutcomeErrorKind = 'TEMPORARY' | 'PERMANENT' | 'CONFLICT';

export type SyncOperationOutcome = {
  operationId: string;
  success: boolean;
  errorKind?: SyncOutcomeErrorKind;
  errorCode?: string;
  errorMessage?: string;
};

// Injected — no real Supabase client this sprint (reca-app not accessible
// from this machine, see plans.md/memory.md). A real implementation sends
// the batch over HTTPS and resolves one outcome per operation, in the same
// order, tolerating operations it has already confirmed before (idempotence
// is the transport's/server's contract, docs/07 "Idempotence").
export type SyncTransport = {
  send(operations: SyncOperation[]): Promise<SyncOperationOutcome[]>;
};

// docs/07 "Communication avec MissionContext" — verbatim shape.
export type SynchronizationState = {
  status: 'SYNCED' | 'SYNCING' | 'OFFLINE' | 'PENDING' | 'ERROR';
  pendingCount: number;
  failedCount: number;
  lastSuccessfulSyncAt?: string;
  lastError?: string;
};

export type SyncEngineEvent =
  | { type: 'SyncStarted'; at: string; batchSize: number }
  | { type: 'SyncOperationConfirmed'; at: string; operationId: string }
  | { type: 'SyncBatchCompleted'; at: string; confirmed: number; failed: number; blocked: number }
  | { type: 'SyncFailed'; at: string; operationId: string; errorCode?: string; nextAttemptAt: string }
  | { type: 'SyncBlocked'; at: string; operationId: string; errorCode?: string }
  | { type: 'SyncIdle'; at: string }
  | { type: 'NetworkUnavailable'; at: string }
  | { type: 'NetworkAvailable'; at: string }
  | { type: 'ConflictDetected'; at: string; operationId: string };

export type SyncEventListener = (event: SyncEngineEvent) => void;

export type RetryPolicy = {
  /** Seconds before each retry attempt, indexed by attempt number (1-based). Beyond the array length, the last value is reused (capped). */
  backoffSecondsByAttempt: number[];
  /** Attempts beyond this count move the operation to BLOCKED instead of retrying. */
  maxAttempts: number;
  /** 0..1 — fraction of the base delay added/removed at random, to avoid every device retrying in lockstep. Injectable for deterministic tests. */
  jitterRatio: number;
  jitter: () => number; // returns a value in [0, 1); defaults to Math.random
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  backoffSecondsByAttempt: [0, 5, 15, 30, 60],
  maxAttempts: 8,
  jitterRatio: 0.1,
  jitter: () => Math.random(),
};
