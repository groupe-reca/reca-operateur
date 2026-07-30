// Visual tone (colour) per mission-item state. UI-only mapping — the domain
// (src/domain/status.ts) never knows about colours.
import type { MissionItemState } from '@/domain/status';

import { colors } from './colors';

export const statusTone: Record<MissionItemState, string> = {
  WAITING: colors.textSecondary,
  EN_ROUTE: colors.navigation,
  APPROACHING: colors.warning,
  IN_PROGRESS: colors.success,
  COMPLETED: colors.success,
  PROBLEM: colors.danger,
  SKIPPED: colors.textSecondary,
  CANCELLED: colors.textSecondary,
};
