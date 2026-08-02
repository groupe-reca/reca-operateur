import type { Clock } from '@/domain/clock';
import type { Mission, MissionItem, StateTransition, SyncOperation } from '@/domain/entities';
import { generateId } from '@/domain/id';
import type { MissionItemState } from '@/domain/status';
import { createMissionItemRepository } from '@/persistence/repositories/missionItemRepository';
import { createMissionRepository } from '@/persistence/repositories/missionRepository';
import { createStateTransitionRepository } from '@/persistence/repositories/stateTransitionRepository';
import { createSyncOperationRepository } from '@/persistence/repositories/syncOperationRepository';
import type { Db } from '@/persistence/types';

import { ACTIVE_ITEM_STATES, isActiveItemState, isItemTransitionAllowed } from './itemTransitions';
import { isMissionTransitionAllowed } from './missionTransitions';
import type { StateMachineLogEntry, TransitionOptions, TransitionResult } from './types';

// docs/09 "Verrou de transition" — a single async queue per mission is
// enough here (no real threads in JS): it serialises every command touching
// that mission so "another item active" checks can never race.
function createMissionLock() {
  const queue = new Map<string, Promise<unknown>>();
  return function withLock<T>(missionId: string, task: () => Promise<T>): Promise<T> {
    const previous = queue.get(missionId) ?? Promise.resolve();
    const run = previous.then(task, task);
    queue.set(
      missionId,
      run.catch(() => undefined)
    );
    return run;
  };
}

function buildTransition(
  missionId: string,
  missionItemId: string | null,
  fromState: string,
  toState: string,
  options: TransitionOptions,
  clock: Clock
): StateTransition {
  const occurredAt = options.occurredAt ?? clock.now();
  return {
    id: generateId(),
    missionId,
    missionItemId,
    fromState,
    toState,
    source: options.source,
    occurredAtUtc: occurredAt.toISOString(),
    occurredAtLocal: occurredAt.toString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    gpsAccuracyMeters: options.gpsAccuracyMeters ?? null,
    latitude: options.latitude ?? null,
    longitude: options.longitude ?? null,
    reason: options.reason ?? null,
  };
}

export function createStateMachine(db: Db, clock: Clock) {
  const missionRepo = createMissionRepository(db);
  const itemRepo = createMissionItemRepository(db);
  const transitionRepo = createStateTransitionRepository(db);
  const syncRepo = createSyncOperationRepository(db);
  const withLock = createMissionLock();
  const log: StateMachineLogEntry[] = [];

  // docs/07-Synchronization.md "Ordre des opérations" — each SyncOperation
  // needs a per-mission, strictly increasing `localSequence`. Cached in
  // memory per mission (seeded once from the persisted max) so a long
  // session doesn't re-scan the whole queue on every single write; a fresh
  // instance (e.g. after restart) reseeds correctly from what's on disk.
  const sequenceCache = new Map<string, number>();
  async function nextLocalSequence(missionId: string): Promise<number> {
    const cached = sequenceCache.get(missionId);
    if (cached !== undefined) {
      const next = cached + 1;
      sequenceCache.set(missionId, next);
      return next;
    }
    const existing = await syncRepo.getAll();
    const max = existing
      .filter((operation) => operation.missionId === missionId)
      .reduce((acc, operation) => Math.max(acc, operation.localSequence), 0);
    const next = max + 1;
    sequenceCache.set(missionId, next);
    return next;
  }

  // docs/07 "Structure d'une opération" — `idempotencyKey` is deliberately
  // the same value as `id` (see plans.md/memory.md: already a stable
  // locally-generated UUID, no second identifier invented).
  async function buildSyncOperation(
    entityType: string,
    entityId: string,
    payload: unknown,
    missionId: string,
    missionItemId: string | null
  ): Promise<SyncOperation> {
    const id = generateId();
    return {
      id,
      entityType,
      entityId,
      operation: 'UPSERT',
      payload: JSON.stringify(payload),
      status: 'PENDING',
      createdAt: clock.now().toISOString(),
      syncedAt: null,
      missionId,
      missionItemId,
      localSequence: await nextLocalSequence(missionId),
      attemptCount: 0,
      idempotencyKey: id,
      lastAttemptAt: null,
      nextAttemptAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    };
  }

  function recordLog(entry: StateMachineLogEntry) {
    log.push(entry);
  }

  async function writeItemTransition(
    mission: Mission,
    item: MissionItem,
    updatedItem: MissionItem,
    options: TransitionOptions,
    additionalWrites?: (occurredAt: Date) => Promise<void>
  ): Promise<TransitionResult> {
    const occurredAt = options.occurredAt ?? clock.now();
    const transition = buildTransition(mission.id, item.id, item.status, updatedItem.status, options, clock);
    await db.withTransactionAsync(async () => {
      await itemRepo.upsert(updatedItem);
      await transitionRepo.upsert(transition);
      await syncRepo.upsert(await buildSyncOperation('MissionItem', updatedItem.id, updatedItem, mission.id, updatedItem.id));
      if (additionalWrites) {
        await additionalWrites(occurredAt);
      }
    });
    return { success: true, transition };
  }

  // Bound to the specific item being completed — built by the `completeItem`
  // command itself (it knows `missionItemId`/`missionId` from its own
  // closure) and passed down as the generic `additionalWrites` hook.

  // docs/09 "Activation de la résidence suivante" — once an item reaches
  // COMPLETED, the next admissible WAITING item (lowest `ordre`) becomes
  // EN_ROUTE automatically, in the same transaction. Admissible = WAITING
  // (not cancelled/skipped/problem/already active).
  async function activateNextAdmissibleItem(missionId: string, justCompletedId: string, occurredAt: Date): Promise<void> {
    const items = await itemRepo.getAll();
    const next = items
      .filter((candidate) => candidate.missionId === missionId && candidate.id !== justCompletedId && candidate.status === 'WAITING')
      .sort((a, b) => a.ordre - b.ordre)[0];
    if (!next) {
      return;
    }
    const updatedNext = touch(next, occurredAt, { status: 'EN_ROUTE', enRouteAt: occurredAt.toISOString() });
    const nextTransition = buildTransition(missionId, next.id, 'WAITING', 'EN_ROUTE', { source: 'SYSTEM', occurredAt }, clock);
    await itemRepo.upsert(updatedNext);
    await transitionRepo.upsert(nextTransition);
    await syncRepo.upsert(await buildSyncOperation('MissionItem', updatedNext.id, updatedNext, missionId, updatedNext.id));
  }

  // Shared validation for every command that moves a single MissionItem
  // forward (WAITING→EN_ROUTE, EN_ROUTE→APPROACHING, …). Resolves the
  // mission/item, applies docs/09's invariants, then delegates the actual
  // field changes to `buildUpdatedItem` (transition-specific: timestamps,
  // computed durations).
  async function applyItemTransition(
    missionItemId: string,
    toState: MissionItemState,
    options: TransitionOptions,
    buildUpdatedItem: (item: MissionItem, occurredAt: Date) => MissionItem,
    additionalWrites?: (missionId: string, occurredAt: Date) => Promise<void>
  ): Promise<TransitionResult> {
    const item = await itemRepo.getById(missionItemId);
    if (!item) {
      const result: TransitionResult = { success: false, errorCode: 'MISSION_ITEM_NOT_FOUND' };
      recordLog({ at: clock.now().toISOString(), missionId: null, missionItemId, fromState: null, toState, result });
      return result;
    }

    return withLock(item.missionId, async () => {
      const mission = await missionRepo.getById(item.missionId);
      const fail = (errorCode: TransitionResult['errorCode'], errorMessage?: string): TransitionResult => {
        const result: TransitionResult = { success: false, errorCode, errorMessage };
        recordLog({
          at: clock.now().toISOString(),
          missionId: item.missionId,
          missionItemId,
          fromState: item.status,
          toState,
          result,
        });
        return result;
      };

      if (!mission) {
        return fail('MISSION_NOT_FOUND');
      }
      if (mission.status === 'PAUSED') {
        return fail('MISSION_PAUSED');
      }
      if (item.status === toState) {
        return fail('DUPLICATE_TRANSITION', 'Item already in the requested state — ignored, no side effect.');
      }
      if (!isItemTransitionAllowed(item.status, toState)) {
        return fail('INVALID_TRANSITION', `${item.status} → ${toState} is not allowed`);
      }
      if (isActiveItemState(toState) && !isActiveItemState(item.status)) {
        const allItems = await itemRepo.getAll();
        const otherActive = allItems.some(
          (candidate) => candidate.id !== item.id && candidate.missionId === item.missionId && isActiveItemState(candidate.status)
        );
        if (otherActive) {
          return fail('ANOTHER_ITEM_ACTIVE');
        }
      }

      const occurredAt = options.occurredAt ?? clock.now();
      const updatedItem = buildUpdatedItem(item, occurredAt);
      const result = await writeItemTransition(
        mission,
        item,
        updatedItem,
        options,
        additionalWrites ? (at) => additionalWrites(item.missionId, at) : undefined
      );
      recordLog({
        at: occurredAt.toISOString(),
        missionId: item.missionId,
        missionItemId,
        fromState: item.status,
        toState,
        result,
      });
      return result;
    });
  }

  function touch(item: MissionItem, occurredAt: Date, changes: Partial<MissionItem>): MissionItem {
    return { ...item, ...changes, updatedAt: occurredAt.toISOString() };
  }

  async function applyMissionTransition(missionId: string, toState: Mission['status']): Promise<TransitionResult> {
    const mission = await missionRepo.getById(missionId);
    const fail = (errorCode: TransitionResult['errorCode'], errorMessage?: string): TransitionResult => {
      const result: TransitionResult = { success: false, errorCode, errorMessage };
      recordLog({ at: clock.now().toISOString(), missionId, missionItemId: null, fromState: null, toState, result });
      return result;
    };

    if (!mission) {
      return fail('MISSION_NOT_FOUND');
    }
    if (mission.status === toState) {
      return fail('DUPLICATE_TRANSITION');
    }
    if (!isMissionTransitionAllowed(mission.status, toState)) {
      return fail('INVALID_TRANSITION');
    }

    const occurredAt = clock.now();
    const updatedMission: Mission = {
      ...mission,
      status: toState,
      actualStartAt: toState === 'IN_PROGRESS' && !mission.actualStartAt ? occurredAt.toISOString() : mission.actualStartAt,
      actualEndAt: toState === 'COMPLETED' ? occurredAt.toISOString() : mission.actualEndAt,
      updatedAt: occurredAt.toISOString(),
    };
    const transition = buildTransition(missionId, null, mission.status, toState, { source: 'MANUAL', occurredAt }, clock);

    await db.withTransactionAsync(async () => {
      await missionRepo.upsert(updatedMission);
      await transitionRepo.upsert(transition);
      await syncRepo.upsert(await buildSyncOperation('Mission', updatedMission.id, updatedMission, missionId, null));
    });

    const result: TransitionResult = { success: true, transition };
    recordLog({
      at: occurredAt.toISOString(),
      missionId,
      missionItemId: null,
      fromState: mission.status,
      toState,
      result,
    });
    return result;
  }

  return {
    // --- MissionItem commands -------------------------------------------------
    startEnRoute(missionItemId: string, options: TransitionOptions) {
      return applyItemTransition(missionItemId, 'EN_ROUTE', options, (item, occurredAt) =>
        touch(item, occurredAt, { status: 'EN_ROUTE', enRouteAt: occurredAt.toISOString() })
      );
    },

    enterApproach(missionItemId: string, options: TransitionOptions) {
      return applyItemTransition(missionItemId, 'APPROACHING', options, (item, occurredAt) =>
        touch(item, occurredAt, { status: 'APPROACHING', enApprocheAt: occurredAt.toISOString() })
      );
    },

    enterWork(missionItemId: string, options: TransitionOptions) {
      return applyItemTransition(missionItemId, 'IN_PROGRESS', options, (item, occurredAt) => {
        const travelTimeSeconds = item.enRouteAt
          ? Math.max(0, Math.round((occurredAt.getTime() - new Date(item.enRouteAt).getTime()) / 1000))
          : null;
        return touch(item, occurredAt, {
          status: 'IN_PROGRESS',
          enCoursAt: occurredAt.toISOString(),
          travelTimeSeconds,
        });
      });
    },

    completeItem(missionItemId: string, options: TransitionOptions) {
      return applyItemTransition(
        missionItemId,
        'COMPLETED',
        options,
        (item, occurredAt) => {
          const interventionTimeSeconds = item.enCoursAt
            ? Math.max(0, Math.round((occurredAt.getTime() - new Date(item.enCoursAt).getTime()) / 1000))
            : null;
          return touch(item, occurredAt, {
            status: 'COMPLETED',
            termineeAt: occurredAt.toISOString(),
            interventionTimeSeconds,
          });
        },
        (missionId, occurredAt) => activateNextAdmissibleItem(missionId, missionItemId, occurredAt)
      );
    },

    reportProblem(missionItemId: string, code: string, note: string | null, options: TransitionOptions) {
      return applyItemTransition(missionItemId, 'PROBLEM', options, (item, occurredAt) =>
        touch(item, occurredAt, { status: 'PROBLEM', problemCode: code, notes: note ?? item.notes })
      );
    },

    resolveProblem(
      missionItemId: string,
      target: 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED',
      options: TransitionOptions
    ) {
      return applyItemTransition(missionItemId, target, options, (item, occurredAt) =>
        touch(item, occurredAt, { status: target, problemCode: null })
      );
    },

    skipItem(missionItemId: string, options: TransitionOptions) {
      return applyItemTransition(missionItemId, 'SKIPPED', options, (item, occurredAt) =>
        touch(item, occurredAt, { status: 'SKIPPED' })
      );
    },

    resumeSkipped(missionItemId: string, options: TransitionOptions) {
      return applyItemTransition(missionItemId, 'EN_ROUTE', options, (item, occurredAt) =>
        touch(item, occurredAt, { status: 'EN_ROUTE', enRouteAt: occurredAt.toISOString() })
      );
    },

    // docs/09 "Cas des résidences rapprochées" — one atomic transaction:
    // A → COMPLETED and B → IN_PROGRESS (travel time fixed at 5s, marked
    // artificial via `reason`, no new schema column — see plans.md).
    async enterAdjacentResidence(currentItemId: string, nextItemId: string): Promise<TransitionResult> {
      const current = await itemRepo.getById(currentItemId);
      if (!current) {
        const result: TransitionResult = { success: false, errorCode: 'MISSION_ITEM_NOT_FOUND', errorMessage: 'current item not found' };
        recordLog({ at: clock.now().toISOString(), missionId: null, missionItemId: currentItemId, fromState: null, toState: 'IN_PROGRESS', result });
        return result;
      }

      return withLock(current.missionId, async () => {
        const [mission, next] = await Promise.all([missionRepo.getById(current.missionId), itemRepo.getById(nextItemId)]);
        const fail = (errorCode: TransitionResult['errorCode'], errorMessage?: string): TransitionResult => {
          const result: TransitionResult = { success: false, errorCode, errorMessage };
          recordLog({
            at: clock.now().toISOString(),
            missionId: current.missionId,
            missionItemId: nextItemId,
            fromState: next?.status ?? null,
            toState: 'IN_PROGRESS',
            result,
          });
          return result;
        };

        if (!mission) {
          return fail('MISSION_NOT_FOUND');
        }
        if (!next || next.missionId !== current.missionId) {
          return fail('MISSION_ITEM_NOT_FOUND', 'next item not found');
        }
        if (mission.status === 'PAUSED') {
          return fail('MISSION_PAUSED');
        }
        if (current.status !== 'IN_PROGRESS') {
          return fail('INVALID_TRANSITION', 'current item is not IN_PROGRESS');
        }
        if (next.status !== 'WAITING') {
          return fail('NO_ELIGIBLE_NEXT_ITEM', 'next item is not WAITING');
        }

        const occurredAt = clock.now();
        const interventionTimeSeconds = current.enCoursAt
          ? Math.max(0, Math.round((occurredAt.getTime() - new Date(current.enCoursAt).getTime()) / 1000))
          : null;
        const updatedCurrent = touch(current, occurredAt, {
          status: 'COMPLETED',
          termineeAt: occurredAt.toISOString(),
          interventionTimeSeconds,
        });
        const updatedNext = touch(next, occurredAt, {
          status: 'IN_PROGRESS',
          enRouteAt: occurredAt.toISOString(),
          enCoursAt: occurredAt.toISOString(),
          travelTimeSeconds: 5,
        });

        const options: TransitionOptions = { source: 'SYSTEM', occurredAt, reason: 'ADJACENT_RESIDENCE' };
        const currentTransition = buildTransition(
          mission.id,
          current.id,
          current.status,
          'COMPLETED',
          options,
          clock
        );
        const nextTransition = buildTransition(mission.id, next.id, 'WAITING', 'IN_PROGRESS', {
          ...options,
          reason: 'ADJACENT_RESIDENCE_FALLBACK',
        }, clock);

        await db.withTransactionAsync(async () => {
          await itemRepo.upsert(updatedCurrent);
          await itemRepo.upsert(updatedNext);
          await transitionRepo.upsert(currentTransition);
          await transitionRepo.upsert(nextTransition);
          await syncRepo.upsert(await buildSyncOperation('MissionItem', updatedCurrent.id, updatedCurrent, mission.id, updatedCurrent.id));
          await syncRepo.upsert(await buildSyncOperation('MissionItem', updatedNext.id, updatedNext, mission.id, updatedNext.id));
        });

        const result: TransitionResult = { success: true, transition: nextTransition };
        recordLog({
          at: occurredAt.toISOString(),
          missionId: mission.id,
          missionItemId: next.id,
          fromState: 'WAITING',
          toState: 'IN_PROGRESS',
          result,
        });
        return result;
      });
    },

    // --- Mission commands -------------------------------------------------
    async requestMissionStart(missionId: string): Promise<TransitionResult> {
      return withLock(missionId, () => applyMissionTransition(missionId, 'IN_PROGRESS'));
    },
    async requestMissionPause(missionId: string): Promise<TransitionResult> {
      return withLock(missionId, () => applyMissionTransition(missionId, 'PAUSED'));
    },
    async requestMissionResume(missionId: string): Promise<TransitionResult> {
      return withLock(missionId, () => applyMissionTransition(missionId, 'IN_PROGRESS'));
    },
    async requestMissionComplete(missionId: string): Promise<TransitionResult> {
      return withLock(missionId, async () => {
        const items = await itemRepo.getAll();
        const unresolved = items.filter(
          (item) => item.missionId === missionId && (isActiveItemState(item.status) || item.status === 'WAITING')
        );
        if (unresolved.length > 0) {
          return { success: false, errorCode: 'INVALID_TRANSITION', errorMessage: 'unresolved MissionItems remain' };
        }
        return applyMissionTransition(missionId, 'COMPLETED');
      });
    },

    getLog(): StateMachineLogEntry[] {
      return [...log];
    },
  };
}

export type StateMachine = ReturnType<typeof createStateMachine>;
export { ACTIVE_ITEM_STATES };
