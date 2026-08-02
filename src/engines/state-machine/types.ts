import type { StateTransition, TransitionSource } from '@/domain/entities';

// Error codes actually raised by this engine — a subset of the examples
// listed in docs/09-State-Machine.md ("Codes d'erreur"), limited to what
// this sprint's commands can really produce (no GPS accuracy/delay checks
// yet — that validation belongs to the future GPS Engine, docs/09 "La State
// Machine n'est pas responsable de... calculer une distance").
export type StateMachineErrorCode =
  | 'MISSION_NOT_FOUND'
  | 'MISSION_ITEM_NOT_FOUND'
  | 'MISSION_NOT_ACTIVE'
  | 'MISSION_PAUSED'
  | 'INVALID_TRANSITION'
  | 'DUPLICATE_TRANSITION'
  | 'ANOTHER_ITEM_ACTIVE'
  | 'NO_ELIGIBLE_NEXT_ITEM';

export type TransitionResult = {
  success: boolean;
  transition?: StateTransition;
  errorCode?: StateMachineErrorCode;
  errorMessage?: string;
};

// Extra facts a caller (GPS Engine, manual UI action, recovery) can attach to
// a transition — all optional, stored verbatim on the StateTransition row
// (docs/09 "Horodatage" example type).
export type TransitionOptions = {
  source: TransitionSource;
  occurredAt?: Date;
  gpsAccuracyMeters?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  reason?: string | null;
};

// docs/09 "Journalisation" — every attempt (successful or refused) must be
// explainable. Kept in-memory only (no new persisted table this sprint);
// successful transitions are additionally durable via `state_transitions`.
// `fromState`/`toState` cover both MissionItemState (item commands) and
// MissionStatus (mission commands) — kept as plain strings here rather than
// a union of both domain types, since the log is an observability surface,
// not a typed contract callers branch on.
export type StateMachineLogEntry = {
  at: string;
  missionItemId: string | null;
  missionId: string | null;
  fromState: string | null;
  toState: string;
  result: TransitionResult;
};
