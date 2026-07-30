import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/config/theme';

import { GlassCard } from '../ui/GlassCard';
import { Txt } from '../ui/Txt';

type Props = {
  missionId: string;
  index: number;
  total: number;
  progressPct: number;
};

// Reduced single-line mission header (~40 px) used when the screen collapses
// the full MissionCard (behaviour driven by an engine, not by this component).
export function MissionCardCompact({ missionId, index, total, progressPct }: Props) {
  return (
    <GlassCard level="panel" radius="md" style={styles.row}>
      <Txt variant="labelCaps" color={colors.brand}>
        Mission active
      </Txt>
      <Txt variant="body" color={colors.textSecondary}>{`Mission ${missionId}`}</Txt>
      <View style={styles.spacer} />
      <Txt variant="meta" color={colors.textSecondary}>{`${index}/${total}`}</Txt>
      <Txt variant="cardTitle" color={colors.success}>{`${progressPct}%`}</Txt>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  spacer: { flex: 1 },
});
