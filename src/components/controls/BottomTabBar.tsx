import { ClipboardList, Map as MapIcon, MoreHorizontal, TriangleAlert } from 'lucide-react-native';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/config/theme';

import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';
import { NotificationBadge } from '../ui/NotificationBadge';
import { PressableScale } from '../ui/PressableScale';
import { Txt } from '../ui/Txt';
import { VoiceButton } from './VoiceButton';

export type TabKey = 'carte' | 'mission' | 'alertes' | 'plus';

type Props = {
  active: TabKey;
  alertsCount?: number;
  voiceActive?: boolean;
  onTabPress?: (tab: TabKey) => void;
  onVoicePress?: () => void;
};

// Bottom tab bar from mock-encours.png. Only "Carte" (this screen) and
// "Annonce" (real voice toggle, reuses VoiceButton) are functional this
// sprint — "Mission"/"Alertes"/"Plus" are presentational placeholders
// (no second screen exists yet; they get real destinations in Phase 11).
export function BottomTabBar({ active, alertsCount = 0, voiceActive = true, onTabPress, onVoicePress }: Props) {
  return (
    <GlassCard level="sheet" radius="lg" style={styles.bar}>
      <TabItem tabKey="carte" icon={MapIcon} label="Carte" active={active === 'carte'} onPress={onTabPress} />
      <TabItem tabKey="mission" icon={ClipboardList} label="Mission" active={active === 'mission'} onPress={onTabPress} />

      <View style={styles.voiceSlot}>
        <VoiceButton active={voiceActive} onPress={onVoicePress} />
      </View>

      <TabItem tabKey="alertes" icon={TriangleAlert} label="Alertes" active={active === 'alertes'} onPress={onTabPress} badge={alertsCount} />
      <TabItem tabKey="plus" icon={MoreHorizontal} label="Plus" active={active === 'plus'} onPress={onTabPress} />
    </GlassCard>
  );
}

function TabItem({
  tabKey,
  icon,
  label,
  active,
  onPress,
  badge = 0,
}: {
  tabKey: TabKey;
  icon: ComponentType<LucideProps>;
  label: string;
  active: boolean;
  onPress?: (tab: TabKey) => void;
  badge?: number;
}) {
  const color = active ? colors.brand : colors.textSecondary;
  return (
    <PressableScale
      onPress={() => onPress?.(tabKey)}
      style={styles.item}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View>
        <Icon icon={icon} color={color} size={22} />
        <NotificationBadge count={badge} />
      </View>
      <Txt variant="meta" color={color}>
        {label}
      </Txt>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  item: { alignItems: 'center', gap: 2 },
  voiceSlot: { marginTop: -28 },
});
