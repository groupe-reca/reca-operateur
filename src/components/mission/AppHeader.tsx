import { Bell, Menu } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import type { SyncState } from '@/types/sync';

import { FloatingActionButton } from '../controls/FloatingActionButton';
import { OfficialLogo } from '../brand/OfficialLogo';
import { Wordmark } from '../brand/Wordmark';
import { NotificationBadge } from '../ui/NotificationBadge';
import { SYNC_STATE_META } from './SyncIndicator';

type Props = {
  onMenu?: () => void;
  onSync?: () => void;
  onAlerts?: () => void;
  alertsCount?: number;
  syncState?: SyncState;
};

// Refonte 2026-08-02 (.input/PLAN-ECRANS-OPERATEUR-RECA.md) : header complet
// restauré — annule explicitement la simplification "logo seul" du même jour
// (voir memory.md). Toujours visible, jamais repositionné : hamburger ·
// logo + OPÉRATEUR · sync + cloche d'alertes. `onMenu`/`onAlerts` restent
// no-op pour l'instant (Mission/Plus/Alertes n'ont toujours pas d'écran réel,
// Phase 11 roadmap) — mêmes destinations placeholders que l'ancien
// BottomTabBar, aucune régression fonctionnelle à ce niveau.
export function AppHeader({ onMenu, onSync, onAlerts, alertsCount = 0, syncState = 'synced' }: Props) {
  const syncMeta = SYNC_STATE_META[syncState];

  return (
    <View style={styles.row}>
      <FloatingActionButton icon={Menu} size={44} onPress={onMenu} accessibilityLabel="Menu" />
      <View style={styles.brand}>
        <OfficialLogo width={120} />
        <Wordmark size={15} />
      </View>
      <View style={styles.right}>
        <FloatingActionButton
          icon={syncMeta.icon}
          size={44}
          iconColor={syncMeta.color}
          onPress={onSync}
          accessibilityLabel={`Synchronisation : ${syncMeta.label}`}
        />
        <View>
          <FloatingActionButton icon={Bell} size={44} onPress={onAlerts} accessibilityLabel="Alertes" />
          <NotificationBadge count={alertsCount} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  brand: { alignItems: 'center', gap: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
