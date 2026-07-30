import { ChevronRight, ClipboardList } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, fontFamily, radii, spacing } from '@/config/theme';
import type { SyncState } from '@/types/sync';

import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { ProgressBar } from '../ui/ProgressBar';
import { Txt } from '../ui/Txt';
import { SyncIndicator } from './SyncIndicator';
import { formatDuration } from './PhaseTimer';

type Props = {
  missionId: string;
  secteur: string;
  index: number;
  total: number;
  progressPct: number; // 0..100
  missionSeconds: number;
  syncState: SyncState;
  onDetails?: () => void;
};

// Top "MISSION ACTIVE" panel: identity + a three-column stats strip.
export function MissionCard({
  missionId,
  secteur,
  index,
  total,
  progressPct,
  missionSeconds,
  syncState,
  onDetails,
}: Props) {
  return (
    <GlassCard level="panel" radius="lg" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Icon icon={ClipboardList} color={colors.textPrimary} size={22} />
        </View>
        <View style={styles.headerText}>
          <Txt variant="labelCaps" color={colors.brand}>
            Mission active
          </Txt>
          <Txt style={styles.title}>{`Mission ${missionId}`}</Txt>
          <Txt variant="meta" color={colors.textSecondary}>{`Secteur ${secteur} · ${total} résidences`}</Txt>
        </View>
        <View style={styles.headerRight}>
          <SyncIndicator state={syncState} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Txt variant="labelCaps" color={colors.success}>
            Résidence
          </Txt>
          <Txt style={styles.statValue}>{`${index}/${total}`}</Txt>
        </View>
        <View style={styles.stat}>
          <Txt variant="labelCaps" color={colors.textSecondary}>
            Progression
          </Txt>
          <Txt style={styles.statValue}>{`${progressPct}%`}</Txt>
          <ProgressBar progress={progressPct / 100} />
        </View>
        <View style={styles.stat}>
          <Txt variant="labelCaps" color={colors.textSecondary}>
            Temps
          </Txt>
          <Txt style={styles.statValue}>{formatDuration(missionSeconds)}</Txt>
        </View>
      </View>

      {onDetails ? (
        <PressableScale onPress={onDetails} style={styles.details} accessibilityRole="button" accessibilityLabel="Détails de la mission">
          <Txt variant="body" color={colors.textSecondary}>
            Détails
          </Txt>
          <Icon icon={ChevronRight} color={colors.textSecondary} size={16} />
        </PressableScale>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  title: { fontFamily: fontFamily.extrabold, fontSize: 20, color: colors.textPrimary },
  headerRight: { alignItems: 'flex-end' },
  divider: { height: 1, backgroundColor: colors.border },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, gap: spacing.xs },
  statValue: { fontFamily: fontFamily.extrabold, fontSize: 22, color: colors.textPrimary },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
  },
});
