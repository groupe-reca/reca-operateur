import { MessageSquare, Navigation, Phone } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/config/theme';

import { FloatingActionButton } from '../controls/FloatingActionButton';
import { GlassCard } from '../ui/GlassCard';
import { Txt } from '../ui/Txt';

type Props = {
  address: string;
  distanceLabel: string;
  etaLabel: string;
  onCall?: () => void;
  onNote?: () => void;
  onRoute?: () => void;
};

// "RÉSIDENCE ACTUELLE" panel: current address + quick actions.
export function CurrentResidenceSheet({
  address,
  distanceLabel,
  etaLabel,
  onCall,
  onNote,
  onRoute,
}: Props) {
  return (
    <GlassCard level="panel" radius="lg" style={styles.card}>
      <View style={styles.info}>
        <Txt variant="labelCaps" color={colors.success}>
          Résidence actuelle
        </Txt>
        <Txt variant="address">{address}</Txt>
        <Txt variant="meta" color={colors.textSecondary}>{`À ${distanceLabel} · ${etaLabel}`}</Txt>
      </View>
      <View style={styles.actions}>
        <FloatingActionButton icon={Phone} label="Appeler" size={48} onPress={onCall} />
        <FloatingActionButton icon={MessageSquare} label="Note" size={48} onPress={onNote} />
        <FloatingActionButton icon={Navigation} label="Itinéraire" size={48} onPress={onRoute} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
  },
  info: { flex: 1, gap: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.md },
});
