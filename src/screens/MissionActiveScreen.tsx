import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfficialLogo } from '@/components/brand/OfficialLogo';
import { SyncIndicator } from '@/components/mission/SyncIndicator';
import { GlassCard } from '@/components/ui/GlassCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { colors, radii, spacing } from '@/config/theme';

import type { MissionActiveState } from './deriveMissionActiveState';

const ALERT_COLOR: Record<MissionActiveState['alerts'][number]['level'], string> = {
  danger: colors.danger,
  warning: colors.warning,
  info: colors.navigation,
};

const CONNECTIVITY_LABEL: Record<string, string> = {
  ONLINE: 'En ligne',
  DEGRADED: 'Réseau instable',
  OFFLINE: 'Hors ligne',
  RECOVERING: 'Reconnexion…',
};

// Sprint "Mission active" — docs/11-Roadmap.md écran « Mission active » :
// consulter la mission, démarrer, vérifier la préparation hors ligne, voir
// le nombre de résidences, voir les alertes importantes, voir l'équipement.
// Presentation-only (same pattern as EndOfMissionScreen) — no Supabase/State
// Machine access here, the caller owns `onStart`.
type Props = {
  state: MissionActiveState;
  onStart: () => void;
  starting: boolean;
  startError: string | null;
};

export function MissionActiveScreen({ state, onStart, starting, startError }: Props) {
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
        <Txt variant="cardTitle">Mission du jour</Txt>
        <Txt variant="body" color={colors.textSecondary}>
          {state.secteur} · {state.date ?? '—'}
        </Txt>

        <View style={styles.statsRow}>
          <Stat label="Résidences" value={String(state.residenceCount)} />
          <Stat label="Équipement" value={state.equipment ?? '—'} />
        </View>
      </GlassCard>

      <GlassCard level="panel" radius="lg" style={styles.card}>
        <Txt variant="cardTitle">Préparation hors ligne</Txt>
        <View style={styles.syncRow}>
          <SyncIndicator state={state.syncState} />
          <Txt variant="meta" color={colors.textSecondary}>
            {CONNECTIVITY_LABEL[state.connectivityStatus] ?? state.connectivityStatus}
          </Txt>
        </View>
        <Txt variant="meta" color={colors.textSecondary}>
          {state.residenceCount} résidence(s) déjà téléchargée(s) localement.
        </Txt>
      </GlassCard>

      <GlassCard level="panel" radius="lg" style={styles.card}>
        <Txt variant="cardTitle">Alertes importantes</Txt>
        {state.alerts.length === 0 ? (
          <Txt variant="meta" color={colors.textSecondary}>
            Aucune alerte pour cette mission.
          </Txt>
        ) : (
          state.alerts.map((alert, index) => (
            <View key={index} style={styles.alertRow}>
              <View style={[styles.alertDot, { backgroundColor: ALERT_COLOR[alert.level] }]} />
              <Txt variant="body" style={styles.alertText}>
                {alert.text}
              </Txt>
            </View>
          ))
        )}
      </GlassCard>

      {startError ? (
        <Txt variant="meta" color={colors.danger}>
          {startError}
        </Txt>
      ) : null}

      <PressableScale onPress={onStart} disabled={starting} style={[styles.startButton, { opacity: starting ? 0.6 : 1 }]}>
        {starting ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Txt variant="body" style={styles.startLabel}>
            Démarrer la tournée
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
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  alertRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText: { flex: 1 },
  startButton: {
    width: '100%',
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLabel: { color: colors.textPrimary, fontWeight: '700' },
});
