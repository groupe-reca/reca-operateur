import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/config/theme';

import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { ProgressBar } from '../ui/ProgressBar';
import { Txt } from '../ui/Txt';
import { formatDuration } from './PhaseTimer';

type Props = {
  missionId: string;
  secteur: string;
  index: number;
  total: number;
  progressPct: number; // 0..100
  phaseLabel: string;
  phaseSeconds: number;
  phaseColor: string;
  onDetails?: () => void;
};

// Refonte 2026-08-02 (.input/PLAN-ECRANS-OPERATEUR-RECA.md, section "Carte de
// mission compacte") — remplace la pleine `MissionCard` (3 colonnes, gros
// titre, bouton Détails bordé) sur l'écran maître. Contenu volontairement
// réduit à ce que le spec liste comme "permanent" : titre + Détails, secteur,
// puis une seule ligne résidences/progression/état+chrono. Le statut sync a
// migré dans le header (Phase 2 de cette refonte) — plus dupliqué ici.
export function MissionCardCompact({
  missionId,
  secteur,
  index,
  total,
  progressPct,
  phaseLabel,
  phaseSeconds,
  phaseColor,
  onDetails,
}: Props) {
  return (
    <GlassCard level="panel" radius="md" style={styles.card}>
      <View style={styles.titleRow}>
        <Txt variant="cardTitle" numberOfLines={1} style={styles.title}>{`Mission ${missionId}`}</Txt>
        {onDetails ? (
          <PressableScale
            onPress={onDetails}
            style={styles.details}
            accessibilityRole="button"
            accessibilityLabel="Détails de la mission"
          >
            <Txt variant="meta" color={colors.textSecondary}>
              Détails
            </Txt>
            <Icon icon={ChevronRight} color={colors.textSecondary} size={14} />
          </PressableScale>
        ) : null}
      </View>
      <Txt variant="meta" color={colors.textSecondary} numberOfLines={1}>{`Secteur ${secteur}`}</Txt>
      <View style={styles.statsRow}>
        <Txt variant="meta" color={colors.textSecondary} numberOfLines={1}>{`${index}/${total} résidences`}</Txt>
        <Txt variant="meta" color={colors.textSecondary} numberOfLines={1}>{`${progressPct} %`}</Txt>
        <Txt variant="meta" color={phaseColor} numberOfLines={1}>{`${phaseLabel} · ${formatDuration(phaseSeconds)}`}</Txt>
      </View>
      <ProgressBar progress={progressPct / 100} color={phaseColor} height={3} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1 },
  details: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
});
