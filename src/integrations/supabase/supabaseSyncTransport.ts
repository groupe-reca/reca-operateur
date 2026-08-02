import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import type { Mission, MissionItem, SyncOperation } from '@/domain/entities';
import type { SyncOperationOutcome, SyncOutcomeErrorKind, SyncTransport } from '@/engines/sync/types';

import { supabase } from './supabaseClient';
import {
  toServerItemStatus,
  toServerItemStatutOperateur,
  toServerMissionStatus,
  UnsupportedStatusError,
} from './statusMapping';

// Real SyncTransport implementation (docs/07 "Structure d'une opération" +
// "Erreurs temporaires"/"Erreurs permanentes"). Only touches columns the
// operator legitimately owns — never route_id/operator_id/date/etc. (those
// are administrative fields, docs/07 "Politique de conflit": "les
// modifications administratives ont priorité"). INSERT/DELETE are
// intentionally never attempted here: RLS reserves them to administrators
// (reca-app/supabase/migrations/20260723000000_missions.sql), and no UI in
// this app creates a Mission/MissionItem — every operation is an UPDATE of
// an entity that must already exist server-side (see fetchAssignedMission.ts).
export function createSupabaseSyncTransport(client: SupabaseClient = supabase): SyncTransport {
  return {
    async send(operations: SyncOperation[]): Promise<SyncOperationOutcome[]> {
      const outcomes: SyncOperationOutcome[] = [];
      for (const operation of operations) {
        outcomes.push(await sendOne(client, operation));
      }
      return outcomes;
    },
  };
}

async function sendOne(client: SupabaseClient, operation: SyncOperation): Promise<SyncOperationOutcome> {
  try {
    if (operation.entityType === 'MissionItem') {
      await sendMissionItem(client, operation);
    } else if (operation.entityType === 'Mission') {
      await sendMission(client, operation);
    } else {
      return permanentFailure(operation, 'UNKNOWN_ENTITY_TYPE', `Unknown entityType "${operation.entityType}".`);
    }
    return { operationId: operation.id, success: true };
  } catch (err) {
    if (err instanceof UnsupportedStatusError) {
      return permanentFailure(operation, 'UNSUPPORTED_STATUS', err.message);
    }
    return classifyPostgrestFailure(operation, err);
  }
}

async function sendMissionItem(client: SupabaseClient, operation: SyncOperation): Promise<void> {
  const item = JSON.parse(operation.payload) as MissionItem;
  const statutOperateur = toServerItemStatutOperateur(item.status);

  // heure_arrivee = "instant d'arrivée sur la résidence (entrée dans le
  // rayon)" (migration comment) — interpreted as the start of the
  // intervention (enCoursAt), same @assumption convention as the GPS Engine
  // (docs/10 "Identifiants"/hypothèses non chiffrées) since docs/07/reca-app
  // don't spell out arrival-vs-approach explicitly.
  const { error, data } = await client
    .from('mission_items')
    .update({
      statut: toServerItemStatus(statutOperateur),
      statut_operateur: statutOperateur,
      heure_arrivee: item.enCoursAt,
      heure_fin: item.termineeAt,
      duree_trajet_secondes: item.travelTimeSeconds,
      duree_intervention_secondes: item.interventionTimeSeconds,
    })
    .eq('id', item.id)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new NoMatchingRowError(`mission_items.id=${item.id} not found or not visible under RLS.`);
  }
}

async function sendMission(client: SupabaseClient, operation: SyncOperation): Promise<void> {
  const mission = JSON.parse(operation.payload) as Mission;

  let hasUnresolvedItems = false;
  if (mission.status === 'COMPLETED') {
    const { count, error } = await client
      .from('mission_items')
      .select('id', { count: 'exact', head: true })
      .eq('mission_id', mission.id)
      .eq('statut_operateur', 'a_reprendre')
      .is('deleted_at', null);
    if (error) throw error;
    hasUnresolvedItems = (count ?? 0) > 0;
  }

  const { error, data } = await client
    .from('missions')
    .update({
      statut: toServerMissionStatus(mission.status, hasUnresolvedItems),
      heure_debut: mission.actualStartAt,
      heure_fin: mission.actualEndAt,
    })
    .eq('id', mission.id)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new NoMatchingRowError(`missions.id=${mission.id} not found or not visible under RLS.`);
  }
}

class NoMatchingRowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoMatchingRowError';
  }
}

// Postgres/PostgREST error codes that mean "retrying will never help":
// 42501 insufficient_privilege (RLS), 23503 foreign_key_violation,
// 23514 check_violation, 22P02 invalid_text_representation (bad UUID/enum).
const PERMANENT_POSTGRES_CODES = new Set(['42501', '23503', '23514', '22P02']);

function classifyPostgrestFailure(operation: SyncOperation, err: unknown): SyncOperationOutcome {
  if (err instanceof NoMatchingRowError) {
    return permanentFailure(operation, 'NO_MATCHING_ROW', err.message);
  }
  const postgrestError = err as Partial<PostgrestError> | undefined;
  const code = postgrestError?.code;
  if (code && PERMANENT_POSTGRES_CODES.has(code)) {
    return permanentFailure(operation, code, postgrestError?.message);
  }
  // Network failures, timeouts, 5xx, unrecognized codes: retry.
  return {
    operationId: operation.id,
    success: false,
    errorKind: 'TEMPORARY' as SyncOutcomeErrorKind,
    errorCode: code ?? 'UNKNOWN',
    errorMessage: postgrestError?.message ?? String(err),
  };
}

function permanentFailure(operation: SyncOperation, code: string, message?: string): SyncOperationOutcome {
  return {
    operationId: operation.id,
    success: false,
    errorKind: 'PERMANENT' as SyncOutcomeErrorKind,
    errorCode: code,
    errorMessage: message,
  };
}
