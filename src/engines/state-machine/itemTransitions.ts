import type { MissionItemState } from '@/domain/status';

// The MissionItem state graph, verbatim from docs/09-State-Machine.md — the
// single source of truth for "which transitions exist" (engines decide,
// nothing else does, docs/02).
export const ALLOWED_ITEM_TRANSITIONS: Record<MissionItemState, MissionItemState[]> = {
  WAITING: ['EN_ROUTE', 'PROBLEM', 'SKIPPED', 'CANCELLED'],
  EN_ROUTE: ['APPROACHING', 'IN_PROGRESS', 'PROBLEM', 'SKIPPED', 'CANCELLED'],
  APPROACHING: ['IN_PROGRESS', 'PROBLEM', 'SKIPPED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'PROBLEM', 'CANCELLED'],
  COMPLETED: [],
  PROBLEM: ['EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED'],
  SKIPPED: ['EN_ROUTE', 'CANCELLED'],
  CANCELLED: [],
};

export function isItemTransitionAllowed(from: MissionItemState, to: MissionItemState): boolean {
  return ALLOWED_ITEM_TRANSITIONS[from].includes(to);
}

// docs/09 "Résidence active" — the only states counted as "an item is
// currently active". Single source of truth (was duplicated as
// `ACTIVE_STATES` in MissionContext.tsx, migrated here for Sprint 009-010).
export const ACTIVE_ITEM_STATES: ReadonlySet<MissionItemState> = new Set([
  'EN_ROUTE',
  'APPROACHING',
  'IN_PROGRESS',
]);

export function isActiveItemState(state: MissionItemState): boolean {
  return ACTIVE_ITEM_STATES.has(state);
}
