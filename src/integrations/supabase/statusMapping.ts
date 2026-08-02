import type { MissionStatus } from '@/domain/entities';
import type { MissionItemState } from '@/domain/status';

// Server vocabulary — reca-app/supabase/migrations/20260723000000_missions.sql
// (rollup `statut`), 20260728000000_mission_items_live_status.sql
// (granular `statut_operateur`). Not redefined anywhere else — this module is
// the single source of truth for the local<->server status translation.
export type ServerMissionStatus = 'planifiee' | 'en_cours' | 'terminee' | 'terminee_avec_anomalies' | 'annulee';
export type ServerMissionItemStatus = 'en_attente' | 'en_cours' | 'terminee' | 'a_reprendre' | 'impossible';
export type ServerMissionItemStatutOperateur =
  | 'en_attente'
  | 'en_route'
  | 'en_approche'
  | 'en_cours'
  | 'depart'
  | 'terminee'
  | 'a_reprendre';

export class UnsupportedStatusError extends Error {
  constructor(state: string) {
    super(`Status "${state}" must never be produced by the operator app — no server mapping exists.`);
    this.name = 'UnsupportedStatusError';
  }
}

// Business rule confirmed by the owner (2026-08-02, see plans.md): an
// operator never cancels a residence — an unreachable one stays `a_reprendre`
// until a supervisor resolves it in RECA App. CANCELLED reaching this
// function is a local bug, not a state to translate silently.
export function toServerItemStatutOperateur(state: MissionItemState): ServerMissionItemStatutOperateur {
  switch (state) {
    case 'WAITING':
      return 'en_attente';
    case 'EN_ROUTE':
      return 'en_route';
    case 'APPROACHING':
      return 'en_approche';
    case 'IN_PROGRESS':
      return 'en_cours';
    case 'COMPLETED':
      return 'terminee';
    case 'PROBLEM':
    case 'SKIPPED':
      return 'a_reprendre';
    case 'CANCELLED':
      throw new UnsupportedStatusError(state);
  }
}

// Rollup consumed by the admin UI — migration comment: "en_cours pour tout
// état engagé". Derived from statut_operateur, never duplicated logic.
export function toServerItemStatus(statutOperateur: ServerMissionItemStatutOperateur): ServerMissionItemStatus {
  switch (statutOperateur) {
    case 'en_attente':
      return 'en_attente';
    case 'en_route':
    case 'en_approche':
    case 'en_cours':
    case 'depart':
      return 'en_cours';
    case 'terminee':
      return 'terminee';
    case 'a_reprendre':
      return 'a_reprendre';
  }
}

// Mission-level mapping. `terminee` vs `terminee_avec_anomalies` needs to
// know whether every item finished cleanly — the caller (supabaseSyncTransport)
// supplies that from the local item list; this function never queries the DB
// itself (docs/02: engines/integrations receive their inputs, they don't fetch
// their own context).
export function toServerMissionStatus(status: MissionStatus, hasUnresolvedItems: boolean): ServerMissionStatus {
  switch (status) {
    case 'ASSIGNED':
    case 'READY':
      return 'planifiee';
    case 'IN_PROGRESS':
    case 'PAUSED':
      return 'en_cours';
    case 'COMPLETED':
      return hasUnresolvedItems ? 'terminee_avec_anomalies' : 'terminee';
    case 'CANCELLED':
      return 'annulee';
  }
}
