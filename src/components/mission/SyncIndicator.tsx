import { Check, Cloud, CloudOff, RefreshCw, TriangleAlert } from 'lucide-react-native';

import { colors } from '@/config/theme';
import type { SyncState } from '@/types/sync';

import { Pill } from '../ui/Pill';
import { Icon } from '../ui/Icon';
import { Txt } from '../ui/Txt';

// Exported so other locations (e.g. AppHeader's compact sync icon) share the
// exact same state -> icon/color mapping instead of duplicating it.
export const SYNC_STATE_META: Record<SyncState, { label: string; color: string; icon: typeof Cloud }> = {
  synced: { label: 'Synchronisé', color: colors.success, icon: Check },
  syncing: { label: 'Synchronisation…', color: colors.navigation, icon: RefreshCw },
  pending: { label: 'En attente', color: colors.warning, icon: Cloud },
  offline: { label: 'Hors ligne', color: colors.warning, icon: CloudOff },
  error: { label: 'Erreur', color: colors.danger, icon: TriangleAlert },
};

export function SyncIndicator({ state }: { state: SyncState }) {
  const meta = SYNC_STATE_META[state];
  return (
    <Pill>
      <Icon icon={meta.icon} color={meta.color} size={14} />
      <Txt variant="meta" color={colors.textSecondary}>
        {meta.label}
      </Txt>
    </Pill>
  );
}
