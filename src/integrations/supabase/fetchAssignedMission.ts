import type { SupabaseClient } from '@supabase/supabase-js';

import type { Clock } from '@/domain/clock';
import type { Mission, MissionItem } from '@/domain/entities';
import type { MissionItemState } from '@/domain/status';
import { createMissionItemRepository } from '@/persistence/repositories/missionItemRepository';
import { createMissionRepository } from '@/persistence/repositories/missionRepository';
import type { Db } from '@/persistence/types';

import { supabase } from './supabaseClient';

// Server row shapes — narrowed to the columns this app actually reads.
// reca-app/supabase/migrations/20260723000000_missions.sql +
// 20260728000000_mission_items_live_status.sql +
// 20260725100000_mission_items_durations.sql.
type ServerMissionRow = {
  id: string;
  date: string;
  statut: string;
  heure_debut: string | null;
  heure_fin: string | null;
};

type ServerMissionItemRow = {
  id: string;
  contract_id: string;
  statut_operateur: string | null;
  heure_arrivee: string | null;
  heure_fin: string | null;
  duree_trajet_secondes: number | null;
  duree_intervention_secondes: number | null;
  contract: {
    adresse_geocodee: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
};

// Pure mapping — separated from the network call so it's directly testable
// (same split as mapCameraConfig.ts/statusMapping.ts: I/O at the edge, logic
// in between). Only maps freshly-assigned state: a mission just downloaded
// has all its items untouched (`en_attente`), never mid-transition — the
// State Machine/GPS Engine own every transition after this point.
export function mapServerMissionToLocal(
  missionRow: ServerMissionRow,
  itemRows: ServerMissionItemRow[],
  now: string
): { mission: Mission; items: MissionItem[] } {
  const mission: Mission = {
    id: missionRow.id,
    date: missionRow.date,
    route: null,
    operator: null,
    equipment: null,
    status: missionRow.statut === 'en_cours' ? 'IN_PROGRESS' : 'READY',
    scheduledStartAt: null,
    actualStartAt: missionRow.heure_debut,
    actualEndAt: missionRow.heure_fin,
    createdAt: now,
    updatedAt: now,
  };

  const items: MissionItem[] = itemRows.map((row, index) => ({
    id: row.id,
    missionId: missionRow.id,
    contractId: row.contract_id,
    ordre: index + 1,
    address: row.contract?.adresse_geocodee ?? 'Adresse inconnue',
    latitude: row.contract?.latitude ?? null,
    longitude: row.contract?.longitude ?? null,
    detectionRadiusMeters: null,
    status: toLocalItemState(row.statut_operateur),
    enRouteAt: null,
    enApprocheAt: null,
    enCoursAt: row.heure_arrivee,
    termineeAt: row.heure_fin,
    travelTimeSeconds: row.duree_trajet_secondes,
    interventionTimeSeconds: row.duree_intervention_secondes,
    notes: null,
    problemCode: null,
    createdAt: now,
    updatedAt: now,
  }));

  return { mission, items };
}

function toLocalItemState(statutOperateur: string | null): MissionItemState {
  switch (statutOperateur) {
    case 'en_route':
      return 'EN_ROUTE';
    case 'en_approche':
      return 'APPROACHING';
    case 'en_cours':
    case 'depart':
      return 'IN_PROGRESS';
    case 'terminee':
      return 'COMPLETED';
    case 'a_reprendre':
      return 'SKIPPED';
    case 'en_attente':
    default:
      return 'WAITING';
  }
}

// Fetches the operator's currently assigned mission (today, not yet
// terminale) and seeds it locally with the REAL server ids — required so
// SyncOperations written later can UPDATE the matching server row (see
// supabaseSyncTransport.ts). Returns null when nothing is assigned (caller
// falls back to seedDemoMissionIfEmpty for dev, see MissionContext.tsx).
export async function fetchAssignedMission(
  employeeId: string,
  db: Db,
  clock: Clock,
  client: SupabaseClient = supabase
): Promise<Mission | null> {
  const { data: missionRow, error: missionError } = await client
    .from('missions')
    .select('id, date, statut, heure_debut, heure_fin')
    .eq('operator_id', employeeId)
    .in('statut', ['planifiee', 'en_cours'])
    .is('deleted_at', null)
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (missionError) throw missionError;
  if (!missionRow) return null;

  const { data: itemRows, error: itemsError } = await client
    .from('mission_items')
    .select(
      `id, contract_id, statut_operateur, heure_arrivee, heure_fin,
       duree_trajet_secondes, duree_intervention_secondes,
       contract:contracts(adresse_geocodee, latitude, longitude)`
    )
    .eq('mission_id', missionRow.id)
    .is('deleted_at', null);

  if (itemsError) throw itemsError;

  const { mission, items } = mapServerMissionToLocal(
    missionRow as ServerMissionRow,
    (itemRows ?? []) as unknown as ServerMissionItemRow[],
    clock.now().toISOString()
  );

  const missionRepo = createMissionRepository(db);
  const missionItemRepo = createMissionItemRepository(db);

  // Same atomic-write convention as seedDemoMissionIfEmpty (docs/10
  // "Transactions locales").
  await db.withTransactionAsync(async () => {
    await missionRepo.upsert(mission);
    for (const item of items) {
      await missionItemRepo.upsert(item);
    }
  });

  return mission;
}
