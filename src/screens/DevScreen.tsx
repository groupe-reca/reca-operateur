import { useState, type ReactNode } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/ui/GlassCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { colors, radii, spacing } from '@/config/theme';
import type { DevEventsSnapshot, DevStatesSnapshot, MissionContextValue } from '@/context/MissionContext';
import type { StateTransition, SyncOperation } from '@/domain/entities';

// Sprint 019 — docs/11-Roadmap.md Phase 11 "Développement" écran : simuler
// GPS/réseau, voir états/file/événements/seuils, exporter les journaux,
// tester les transitions. Access is gated by the caller (`__DEV__`, see
// LiveMissionScreen.tsx) — this component itself has no permission logic,
// same "components never contain business logic" rule as every other
// screen, the gate is just a build flag rather than a business rule.
type Props = {
  ctx: MissionContextValue;
  onClose: () => void;
};

export function DevScreen({ ctx, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [states, setStates] = useState<DevStatesSnapshot>(() => ctx.dev.getStates());
  const [events, setEvents] = useState<DevEventsSnapshot | null>(null);
  const [queue, setQueue] = useState<SyncOperation[] | null>(null);
  const [transitions, setTransitions] = useState<StateTransition[] | null>(null);
  const [lastSimulatedAddress, setLastSimulatedAddress] = useState<string | null>(null);
  const [networkForcedOffline, setNetworkForcedOffline] = useState(false);
  const [busy, setBusy] = useState(false);

  function refreshStates() {
    setStates(ctx.dev.getStates());
  }

  async function refreshEvents() {
    setEvents(ctx.dev.getEvents());
  }

  async function refreshQueue() {
    setQueue(await ctx.dev.getSyncQueue());
  }

  async function refreshTransitions() {
    setTransitions(await ctx.dev.getTransitions());
  }

  // "Tester les transitions" (docs/11) is done by driving the real GPS
  // simulator (Sprint 011-012) rather than by exposing raw State Machine
  // buttons — more faithful to what production does, invents no shortcut
  // that doesn't exist in the real app.
  const target = ctx.activeMissionItem ?? ctx.nextMissionItems[0] ?? null;
  const canSimulateGps = target !== null && target.latitude !== null && target.longitude !== null;

  async function withBusy(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
      refreshStates();
    }
  }

  async function handleMoveToTarget() {
    if (!target || target.latitude === null || target.longitude === null) return;
    await withBusy(async () => {
      await ctx.dev.gps.moveTo({ latitude: target.latitude as number, longitude: target.longitude as number });
      setLastSimulatedAddress(target.address);
    });
  }

  async function handleAdvanceTime(seconds: number) {
    await withBusy(() => ctx.dev.gps.advanceTime(seconds));
  }

  function handleLoseSignal() {
    ctx.dev.gps.loseSignal();
    refreshStates();
  }

  async function handleRecoverSignal() {
    if (!target || target.latitude === null || target.longitude === null) return;
    await withBusy(() => ctx.dev.gps.recoverSignal({ latitude: target.latitude as number, longitude: target.longitude as number }));
  }

  async function handleToggleNetwork() {
    const nextForcedOffline = !networkForcedOffline;
    await withBusy(() => ctx.dev.setNetworkOverride(nextForcedOffline ? false : null));
    setNetworkForcedOffline(nextForcedOffline);
  }

  async function handleExport() {
    const json = await ctx.dev.exportLogs();
    await Share.share({ message: json });
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <View style={styles.headerRow}>
        <Txt variant="cardTitle">Mode développement</Txt>
        <PressableScale onPress={onClose} style={styles.closeButton}>
          <Txt variant="body" color={colors.textPrimary}>
            Fermer
          </Txt>
        </PressableScale>
      </View>

      <Section title="États">
        <Row label="Mission" value={states.missionStatus ?? '—'} />
        <Row label="Phase GPS" value={states.gpsPhase ?? '—'} />
        <Row label="Synchronisation" value={states.synchronizationState.status} />
        <Row label="Connectivité" value={states.offlineState.status} />
        {Object.entries(states.itemsByStatus).map(([status, count]) => (
          <Row key={status} label={`Résidences ${status}`} value={String(count)} />
        ))}
        <PressableScale onPress={refreshStates} style={styles.secondaryButton}>
          <Txt variant="meta" color={colors.textSecondary}>
            Rafraîchir
          </Txt>
        </PressableScale>
      </Section>

      <Section title="Simuler le GPS">
        {canSimulateGps ? (
          <>
            <Row label="Cible" value={target?.address ?? '—'} />
            <View style={styles.buttonRow}>
              <DevButton label="Aller à la cible" onPress={handleMoveToTarget} disabled={busy} />
              <DevButton label="+5 s" onPress={() => handleAdvanceTime(5)} disabled={busy} />
              <DevButton label="+30 s" onPress={() => handleAdvanceTime(30)} disabled={busy} />
            </View>
            <View style={styles.buttonRow}>
              <DevButton label="Perdre le signal" onPress={handleLoseSignal} disabled={busy} />
              <DevButton label="Retrouver le signal" onPress={handleRecoverSignal} disabled={busy} />
            </View>
            {lastSimulatedAddress ? (
              <Txt variant="meta" color={colors.textSecondary}>
                Dernière position simulée : {lastSimulatedAddress}
              </Txt>
            ) : null}
          </>
        ) : (
          <Txt variant="meta" color={colors.textSecondary}>
            Aucune résidence à simuler (pas de coordonnées).
          </Txt>
        )}
      </Section>

      <Section title="Simuler le réseau">
        <DevButton
          label={networkForcedOffline ? 'Revenir en ligne (réel)' : 'Forcer hors ligne'}
          onPress={handleToggleNetwork}
          disabled={busy}
        />
      </Section>

      <Section title="Seuils GPS">
        {Object.entries(ctx.dev.thresholds).map(([key, value]) => (
          <Row key={key} label={key} value={String(value)} />
        ))}
      </Section>

      <Section title="File de synchronisation">
        <PressableScale onPress={refreshQueue} style={styles.secondaryButton}>
          <Txt variant="meta" color={colors.textSecondary}>
            Rafraîchir
          </Txt>
        </PressableScale>
        {queue === null ? null : queue.length === 0 ? (
          <Txt variant="meta" color={colors.textSecondary}>
            File vide.
          </Txt>
        ) : (
          queue.map((op) => (
            <Row key={op.id} label={`${op.entityType} · ${op.operation}`} value={`${op.status} (${op.attemptCount})`} />
          ))
        )}
      </Section>

      <Section title="Événements">
        <PressableScale onPress={refreshEvents} style={styles.secondaryButton}>
          <Txt variant="meta" color={colors.textSecondary}>
            Rafraîchir
          </Txt>
        </PressableScale>
        {events ? (
          <>
            <EventList title="GPS" items={events.gps} />
            <EventList title="Synchronisation" items={events.sync} />
            <EventList title="Hors ligne" items={events.offline} />
            <EventList title="Voix" items={events.voice} />
          </>
        ) : null}
      </Section>

      <Section title="Historique des transitions">
        <PressableScale onPress={refreshTransitions} style={styles.secondaryButton}>
          <Txt variant="meta" color={colors.textSecondary}>
            Rafraîchir
          </Txt>
        </PressableScale>
        {transitions === null ? null : transitions.length === 0 ? (
          <Txt variant="meta" color={colors.textSecondary}>
            Aucune transition.
          </Txt>
        ) : (
          transitions
            .slice(-20)
            .reverse()
            .map((t) => <Row key={t.id} label={`${t.fromState ?? '—'} → ${t.toState}`} value={t.source} />)
        )}
      </Section>

      <DevButton label="Exporter les journaux" onPress={handleExport} disabled={busy} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <GlassCard level="panel" radius="lg" style={styles.card}>
      <Txt variant="body" style={styles.sectionTitle}>
        {title}
      </Txt>
      {children}
    </GlassCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Txt variant="meta" color={colors.textSecondary}>
        {label}
      </Txt>
      <Txt variant="meta">{value}</Txt>
    </View>
  );
}

function EventList({ title, items }: { title: string; items: { type: string; at: string }[] }) {
  const recent = items.slice(-5).reverse();
  return (
    <View style={styles.eventGroup}>
      <Txt variant="meta" color={colors.textSecondary}>
        {title} ({items.length})
      </Txt>
      {recent.map((event, index) => (
        <Row key={`${event.type}-${event.at}-${index}`} label={event.type} value={event.at} />
      ))}
    </View>
  );
}

function DevButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <PressableScale onPress={onPress} disabled={disabled} style={[styles.devButton, { opacity: disabled ? 0.5 : 1 }]}>
      <Txt variant="meta" color={colors.textPrimary}>
        {label}
      </Txt>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { gap: spacing.md, paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeButton: { backgroundColor: colors.danger, borderRadius: radii.md, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  card: { gap: spacing.xs, padding: spacing.md },
  sectionTitle: { marginBottom: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  secondaryButton: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  devButton: {
    backgroundColor: colors.navigation,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  eventGroup: { gap: 2, marginTop: spacing.xs },
});
