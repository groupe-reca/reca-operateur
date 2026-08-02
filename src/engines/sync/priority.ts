import type { SyncOperation } from '@/domain/entities';

// docs/07 "Priorités" — coarse tiers derived from `entityType`, only used to
// order *independent* missions relative to each other. "Les priorités ne
// doivent jamais briser l'ordre métier obligatoire": within one mission,
// operations always stay in `localSequence` order (see `selectBatch` below).
function priorityRank(operation: SyncOperation): number {
  if (operation.entityType === 'Mission') {
    return 3; // mission start/pause/resume/complete — "Élevée"/"Critique" territory
  }
  if (operation.entityType === 'MissionItem') {
    return 2; // résidence en cours/terminée — "Élevée"
  }
  return 1; // notes, diagnostics, etc. — "Normale"/"Faible"
}

// Groups PENDING/due-for-retry operations by mission (preserving each
// mission's internal FIFO order by `localSequence`), orders the groups by
// their highest-priority operation, then flattens and caps at `batchSize`.
// A mission's own operations are never reordered relative to each other.
export function selectBatch(candidates: SyncOperation[], batchSize: number): SyncOperation[] {
  const byMission = new Map<string, SyncOperation[]>();
  for (const operation of candidates) {
    const key = operation.missionId ?? operation.id; // operations without a mission are their own group
    const group = byMission.get(key);
    if (group) {
      group.push(operation);
    } else {
      byMission.set(key, [operation]);
    }
  }

  const groups = [...byMission.values()].map((group) => [...group].sort((a, b) => a.localSequence - b.localSequence));
  groups.sort((a, b) => {
    const rankA = Math.max(...a.map(priorityRank));
    const rankB = Math.max(...b.map(priorityRank));
    return rankB - rankA;
  });

  const batch: SyncOperation[] = [];
  for (const group of groups) {
    for (const operation of group) {
      if (batch.length >= batchSize) {
        return batch;
      }
      batch.push(operation);
    }
  }
  return batch;
}
