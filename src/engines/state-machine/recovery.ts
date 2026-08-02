import type { Clock } from '@/domain/clock';
import { generateId } from '@/domain/id';
import { createMissionItemRepository } from '@/persistence/repositories/missionItemRepository';
import { createMissionRepository } from '@/persistence/repositories/missionRepository';
import { createStateTransitionRepository } from '@/persistence/repositories/stateTransitionRepository';
import type { Db } from '@/persistence/types';

import { isActiveItemState } from './itemTransitions';
import type { StateMachine } from './stateMachine';

export type RecoveryResult = {
  recovered: boolean;
  detail: string;
};

// docs/09 "Récupération après redémarrage" — run once at app startup, before
// any GPS/manual command is accepted. Two anomalies are handled; anything
// consistent is left untouched.
export async function recoverOnStartup(db: Db, clock: Clock, stateMachine: StateMachine, missionId: string): Promise<RecoveryResult> {
  const missionRepo = createMissionRepository(db);
  const itemRepo = createMissionItemRepository(db);
  const transitionRepo = createStateTransitionRepository(db);

  const mission = await missionRepo.getById(missionId);
  if (!mission || mission.status !== 'IN_PROGRESS') {
    return { recovered: false, detail: 'mission not IN_PROGRESS — nothing to recover' };
  }

  const items = (await itemRepo.getAll()).filter((item) => item.missionId === missionId);
  const activeItems = items.filter((item) => isActiveItemState(item.status));

  if (activeItems.length === 1) {
    return { recovered: false, detail: 'exactly one active MissionItem — consistent' };
  }

  if (activeItems.length === 0) {
    // docs/09 "Aucun MissionItem actif" — activate the first admissible one.
    const nextEligible = items
      .filter((item) => item.status === 'WAITING')
      .sort((a, b) => a.ordre - b.ordre)[0];
    if (!nextEligible) {
      return { recovered: false, detail: 'no active and no admissible WAITING item — nothing to activate' };
    }
    const result = await stateMachine.startEnRoute(nextEligible.id, {
      source: 'RECOVERY',
      occurredAt: clock.now(),
      reason: 'STARTUP_RECOVERY_NO_ACTIVE_ITEM',
    });
    return {
      recovered: result.success,
      detail: result.success ? `activated ${nextEligible.id} as EN_ROUTE` : `recovery failed: ${result.errorCode}`,
    };
  }

  // docs/09 "Plusieurs MissionItems actifs" — restore a single active item:
  // keep the most advanced one (IN_PROGRESS > APPROACHING > EN_ROUTE, ties
  // broken by most recent timestamp), reset the rest to WAITING. This is an
  // explicit administrative correction outside the normal transition graph
  // (never a silent data loss — every reset is logged as a StateTransition).
  const rank: Record<string, number> = { IN_PROGRESS: 3, APPROACHING: 2, EN_ROUTE: 1 };
  const latestTimestamp = (item: (typeof items)[number]) =>
    item.enCoursAt ?? item.enApprocheAt ?? item.enRouteAt ?? item.createdAt;
  const [canonical, ...duplicates] = [...activeItems].sort((a, b) => {
    const rankDiff = (rank[b.status] ?? 0) - (rank[a.status] ?? 0);
    if (rankDiff !== 0) return rankDiff;
    return latestTimestamp(b).localeCompare(latestTimestamp(a));
  });

  const occurredAt = clock.now();
  await db.withTransactionAsync(async () => {
    for (const duplicate of duplicates) {
      const resetItem = { ...duplicate, status: 'WAITING' as const, updatedAt: occurredAt.toISOString() };
      await itemRepo.upsert(resetItem);
      await transitionRepo.upsert({
        id: generateId(),
        missionId,
        missionItemId: duplicate.id,
        fromState: duplicate.status,
        toState: 'WAITING',
        source: 'RECOVERY',
        occurredAtUtc: occurredAt.toISOString(),
        occurredAtLocal: occurredAt.toString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        gpsAccuracyMeters: null,
        latitude: null,
        longitude: null,
        reason: 'STARTUP_RECOVERY_DUPLICATE_ACTIVE_ITEM',
      });
    }
  });

  return {
    recovered: true,
    detail: `kept ${canonical?.id} active, reset ${duplicates.length} duplicate active item(s) to WAITING`,
  };
}
