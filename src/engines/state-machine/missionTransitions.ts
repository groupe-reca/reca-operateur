import type { MissionStatus } from '@/domain/entities';

// The Mission state graph, verbatim from docs/09-State-Machine.md.
export const ALLOWED_MISSION_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  ASSIGNED: ['READY', 'CANCELLED'],
  READY: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['PAUSED', 'COMPLETED', 'CANCELLED'],
  PAUSED: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function isMissionTransitionAllowed(from: MissionStatus, to: MissionStatus): boolean {
  return ALLOWED_MISSION_TRANSITIONS[from].includes(to);
}
