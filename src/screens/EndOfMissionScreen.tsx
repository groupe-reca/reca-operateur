import { Check, TriangleAlert } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfficialLogo } from '@/components/brand/OfficialLogo';
import { formatElapsedWithHours } from '@/components/mission/PhaseTimer';
import { SyncIndicator } from '@/components/mission/SyncIndicator';
import { GlassCard } from '@/components/ui/GlassCard';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { colors, radii, spacing } from '@/config/theme';

import type { EndOfMissionState } from './deriveEndOfMissionState';

// Sprint 018 — docs/11-Roadmap.md "Fin de mission": résumé, résidences
// terminées, problèmes, durées, état de synchronisation, confirmation
// locale, opérations en attente. Presentation-only (same pattern as
// MissionScreen/LoginScreen) — no Supabase/State Machine access here, the
// caller (LiveMissionScreen) owns the `onClose` command.
type Props = {
  state: EndOfMissionState;
  onClose: () => void;
  closing: boolean;
  closed: boolean;
  closeError: string | null;
};

export function EndOfMissionScreen({ state, onClose, closing, closed, closeError }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <OfficialLogo width={120} />

      <GlassCard level="panel" radius="lg" style={styles.card}>
        <Txt variant="cardTitle">Fin de mission</Txt>
        <Txt variant="body" color={colors.textSecondary}>
          {state.secteur} · {state.date ?? '—'}
        </Txt>

        <View style={styles.statsRow}>
          <Stat label="Résidences" value={`${state.completedCount}/${state.total}`} />
          <Stat label="Durée" value={formatElapsedWithHours(state.missionDurationSeconds)} />
          <Stat label="Problèmes" value={String(state.problemItems.length)} />
        </View>
      </GlassCard>

      {state.problemItems.length > 0 ? (
        <GlassCard level="panel" radius="lg" style={styles.card}>
          <Txt variant="cardTitle">Résidences à reprendre</Txt>
          {state.problemItems.map((item, index) => (
            <View key={`${item.address}-${index}`} style={styles.problemRow}>
              <Icon icon={TriangleAlert} color={colors.warning} size={16} />
              <View style={styles.problemText}>
                <Txt variant="body">{item.address}</Txt>
                <Txt variant="meta" color={colors.textSecondary}>
                  {item.problemCode ?? 'Non complétée'}
                  {item.note ? ` · ${item.note}` : ''}
                </Txt>
              </View>
            </View>
          ))}
        </GlassCard>
      ) : null}

      <GlassCard level="panel" radius="lg" style={styles.card}>
        <View style={styles.syncRow}>
          <SyncIndicator state={state.syncState} />
          <Txt variant="meta" color={colors.textSecondary}>
            {state.pendingOperations > 0
              ? `${state.pendingOperations} opération(s) en attente`
              : 'Aucune opération en attente'}
          </Txt>
        </View>
      </GlassCard>

      {closeError ? (
        <Txt variant="meta" color={colors.danger}>
          {closeError}
        </Txt>
      ) : null}

      <PressableScale
        onPress={onClose}
        disabled={closing || closed}
        style={[styles.closeButton, { opacity: closing || closed ? 0.6 : 1 }]}
      >
        {closing ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : closed ? (
          <View style={styles.closedRow}>
            <Icon icon={Check} color={colors.textPrimary} size={18} />
            <Txt variant="body" style={styles.closeLabel}>
              Mission fermée
            </Txt>
          </View>
        ) : (
          <Txt variant="body" style={styles.closeLabel}>
            Fermer la mission
          </Txt>
        )}
      </PressableScale>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Txt variant="cardTitle">{value}</Txt>
      <Txt variant="labelCaps" color={colors.textSecondary}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  card: { width: '100%', gap: spacing.sm, padding: spacing.lg },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  stat: { alignItems: 'center', gap: spacing.xs },
  problemRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  problemText: { flex: 1, gap: 2 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  closeButton: {
    width: '100%',
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: { color: colors.textPrimary, fontWeight: '700' },
  closedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
