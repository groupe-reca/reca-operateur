import { TriangleAlert } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/config/theme';

import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { Txt } from '../ui/Txt';
import { PhaseTimer } from './PhaseTimer';

type Props = {
  address: string;
  problemType: string;
  note: string;
  // Elapsed time when the problem was reported — frozen, docs/09-State-Machine.md
  // ("arrêter les chronomètres actifs selon la politique" on ProblemReported).
  frozenSeconds: number;
  onNext?: () => void;
  onResumeLater?: () => void;
};

// Floating left column for the PROBLEM state. Structurally different from
// CurrentResidenceProgressCard (no phase checklist) per docs/11 Phase 03:
// problem type, residence, note, and the two manual actions docs/09 allows
// ("passage à la suivante" vs. a later explicit resume — never automatic).
export function ProblemStateCard({ address, problemType, note, frozenSeconds, onNext, onResumeLater }: Props) {
  return (
    <GlassCard level="panel" radius="lg" style={styles.card}>
      <View style={styles.header}>
        <Icon icon={TriangleAlert} color={colors.danger} size={18} />
        <Txt variant="labelCaps" color={colors.danger}>
          Problème
        </Txt>
      </View>
      <Txt variant="address" numberOfLines={1}>
        {address}
      </Txt>

      <View style={styles.block}>
        <Txt variant="cardTitle" color={colors.danger}>
          {problemType}
        </Txt>
        <Txt variant="body" color={colors.textSecondary}>
          {note}
        </Txt>
      </View>

      <PhaseTimer label="Temps figé" seconds={frozenSeconds} color={colors.danger} />

      <View style={styles.actions}>
        {onResumeLater ? (
          <PressableScale
            onPress={onResumeLater}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Reprendre plus tard"
          >
            <Txt variant="body" color={colors.textPrimary}>
              Reprendre plus tard
            </Txt>
          </PressableScale>
        ) : null}
        {onNext ? (
          <PressableScale
            onPress={onNext}
            style={[styles.actionButton, styles.actionPrimary]}
            accessibilityRole="button"
            accessibilityLabel="Passer à la résidence suivante"
          >
            <Txt variant="body" color={colors.textPrimary}>
              Passer à la suivante
            </Txt>
          </PressableScale>
        ) : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  block: { gap: 2 },
  actions: { gap: spacing.sm },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
  },
  actionPrimary: { backgroundColor: colors.danger, borderColor: colors.danger },
});
