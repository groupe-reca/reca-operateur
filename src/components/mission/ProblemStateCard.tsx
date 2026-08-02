import { TriangleAlert } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/config/theme';

import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';
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
  // Refonte 2026-08-02 (.input/PLAN-ECRANS-OPERATEUR-RECA.md, "Fusion
  // Problème/Résidence") : remplace `CurrentResidenceSheet` comme contenu du
  // `BottomSheet` gestuel en état PROBLEM — plus de colonne flottante étroite
  // (220px) où les 2 boutons d'action débordaient sur petit écran (voir
  // memory.md, suivi ouvert du 2026-08-02) ; le sheet plein-bord règle ce
  // problème de facto. `bare` saute le `GlassCard` propre (même convention
  // que `CurrentResidenceSheet`).
  bare?: boolean;
};

// Structurally different from CurrentResidenceProgressCard (no phase
// checklist) per docs/11 Phase 03: problem type, residence, note, and the
// two manual actions docs/09 allows ("passage à la suivante" vs. a later
// explicit resume — never automatic).
export function ProblemStateCard({
  address,
  problemType,
  note,
  frozenSeconds,
  onNext,
  onResumeLater,
  bare = false,
}: Props) {
  const content = (
    <>
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
        {/* Pressable brut (pas PressableScale) : un Txt en enfant direct du
            Animated.View (API `Animated` classique) de PressableScale ne
            peint pas quand cet ancêtre est lui-même imbriqué dans
            l'Animated.View piloté par Reanimated de BottomSheet (bug de
            rendu confirmé sur device, texte absent bien que présent dans
            l'arbre — voir memory.md). Partout ailleurs le label est un
            frère de PressableScale (FloatingActionButton, VoiceButton),
            jamais un enfant — seul ce composant l'avait en enfant direct. */}
        {onResumeLater ? (
          <Pressable
            onPress={onResumeLater}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Reprendre plus tard"
          >
            <Txt variant="body" color={colors.textPrimary}>
              Reprendre plus tard
            </Txt>
          </Pressable>
        ) : null}
        {onNext ? (
          <Pressable
            onPress={onNext}
            style={[styles.actionButton, styles.actionPrimary]}
            accessibilityRole="button"
            accessibilityLabel="Passer à la résidence suivante"
          >
            <Txt variant="body" color={colors.textPrimary}>
              Passer à la suivante
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </>
  );

  if (bare) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <GlassCard level="panel" radius="lg" style={styles.card}>
      {content}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  block: { gap: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
  },
  actionPrimary: { backgroundColor: colors.danger, borderColor: colors.danger },
});
