import { MessageSquare, Navigation, Phone, TriangleAlert } from 'lucide-react-native';
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
  onProblem?: () => void;
  // Refonte 2026-08-02 (.input/PLAN-ECRANS-OPERATEUR-RECA.md) : quand ce
  // composant devient le contenu de la position fermée du `BottomSheet`
  // gestuel, ce dernier fournit déjà sa propre carte (glass + poignée) — un
  // second `GlassCard` imbriqué doublerait le flou/la bordure. `bare` saute
  // ce wrapper. Par défaut `false` : `ComponentGalleryScreen` continue de
  // l'afficher en carte autonome, comme les autres entrées de la galerie.
  bare?: boolean;
};

// "RÉSIDENCE ACTUELLE" panel: address + all 4 quick actions, including the
// permanent "Signaler" action (moved here from the now-removed floating
// CurrentResidenceProgressCard — no separate card duplicating the address,
// 2026-08-02 simplification, see memory.md). Info stacked full-width above
// the actions row rather than squeezed beside it, so the address never
// wraps awkwardly.
export function CurrentResidenceSheet({
  address,
  distanceLabel,
  etaLabel,
  onCall,
  onNote,
  onRoute,
  onProblem,
  bare = false,
}: Props) {
  const content = (
    <>
      <View style={styles.info}>
        <Txt variant="labelCaps" color={colors.success}>
          Résidence actuelle
        </Txt>
        <Txt variant="address" numberOfLines={1}>
          {address}
        </Txt>
        <Txt variant="meta" color={colors.textSecondary}>{`À ${distanceLabel} · ${etaLabel}`}</Txt>
      </View>
      <View style={styles.actions}>
        <FloatingActionButton icon={Phone} label="Appeler" size={48} onPress={onCall} />
        <FloatingActionButton icon={MessageSquare} label="Note" size={48} onPress={onNote} />
        <FloatingActionButton icon={Navigation} label="Itinéraire" size={48} onPress={onRoute} />
        <FloatingActionButton
          icon={TriangleAlert}
          label="Signaler"
          size={48}
          iconColor={colors.danger}
          onPress={onProblem}
        />
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
  card: { gap: spacing.sm, padding: spacing.md },
  info: { gap: spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
});
