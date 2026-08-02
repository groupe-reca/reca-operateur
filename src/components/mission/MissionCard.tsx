import { ChevronRight, Cloud } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, fontFamily, radii, spacing } from '@/config/theme';
import type { SyncState } from '@/types/sync';

import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { ProgressBar } from '../ui/ProgressBar';
import { Txt } from '../ui/Txt';
import { SyncIndicator } from './SyncIndicator';
import { formatElapsedWithHours } from './PhaseTimer';

type Props = {
  missionId: string;
  secteur: string;
  index: number;
  total: number;
  progressPct: number; // 0..100
  missionSeconds: number;
  syncState: SyncState;
  // Estimated total duration, e.g. "1h 45 min (est.)" — shown next to the
  // residence count, matching mock-encours.png's second meta line.
  etaLabel?: string;
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
  etaLabel,
  onDetails,
}: Props) {
  return (
    <GlassCard level="panel" radius="lg" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Txt variant="labelCaps" color={colors.brand}>
            Mission active
          </Txt>
          <Txt style={styles.title} numberOfLines={1}>{`Mission ${missionId}`}</Txt>
          <Txt variant="meta" color={colors.textSecondary} numberOfLines={1}>{`Secteur ${secteur}`}</Txt>
          <Txt variant="meta" color={colors.textSecondary} numberOfLines={1}>
            {etaLabel ? `${total} résidences · ${etaLabel}` : `${total} résidences`}
          </Txt>
        </View>
        <View style={styles.headerRight}>
          {/* Sync status moved here from the header (2026-08-02 simplification —
              see memory.md): a plain cloud when synced, the fuller
              SyncIndicator (HANDOFF §4 contract) for anything worth flagging. */}
          {syncState === 'synced' ? (
            <Icon icon={Cloud} color={colors.success} size={18} />
          ) : (
            <SyncIndicator state={syncState} />
          )}
          {onDetails ? (
            <PressableScale
              onPress={onDetails}
              style={styles.details}
              accessibilityRole="button"
              accessibilityLabel="Détails de la mission"
            >
              <Txt variant="body" color={colors.textSecondary}>
                Détails
              </Txt>
              <Icon icon={ChevronRight} color={colors.textSecondary} size={16} />
            </PressableScale>
          ) : null}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Txt variant="labelCaps" color={colors.success}>
            Résidence
          </Txt>
          <Txt style={styles.statValue} numberOfLines={1}>{`${index}/${total}`}</Txt>
        </View>
        <View style={styles.stat}>
          <Txt variant="labelCaps" color={colors.textSecondary} numberOfLines={1}>
            Progression
          </Txt>
          <Txt style={styles.statValue} numberOfLines={1}>{`${progressPct}%`}</Txt>
          <ProgressBar progress={progressPct / 100} />
        </View>
        <View style={styles.stat}>
          <Txt variant="labelCaps" color={colors.textSecondary}>
            Temps
          </Txt>
          <Txt style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatElapsedWithHours(missionSeconds)}
          </Txt>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.sm, gap: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  title: { fontFamily: fontFamily.extrabold, fontSize: 20, color: colors.textPrimary },
  headerRight: { alignItems: 'flex-end', gap: spacing.xs },
  divider: { height: 1, backgroundColor: colors.border },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, gap: spacing.xs },
  statValue: { fontFamily: fontFamily.extrabold, fontSize: 22, color: colors.textPrimary },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
});
