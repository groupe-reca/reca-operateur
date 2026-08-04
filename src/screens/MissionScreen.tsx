import { CloudSnow, Crosshair, Layers, Minus, Plus } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/controls/BottomSheet';
import { FloatingActionButton } from '@/components/controls/FloatingActionButton';
import { VoiceButton } from '@/components/controls/VoiceButton';
import { AlertCard } from '@/components/mission/AlertCard';
import { AppHeader } from '@/components/mission/AppHeader';
import { CurrentResidenceSheet } from '@/components/mission/CurrentResidenceSheet';
import { MissionCardCompact } from '@/components/mission/MissionCardCompact';
import { OfflineIndicator } from '@/components/mission/OfflineIndicator';
import { ProblemStateCard } from '@/components/mission/ProblemStateCard';
import { ResidenceTasksCard } from '@/components/mission/ResidenceTasksCard';
import { MissionMapView, type MissionMapViewHandle } from '@/components/map/MissionMapView';
import { GlassCard } from '@/components/ui/GlassCard';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Txt } from '@/components/ui/Txt';
import { colors, screenMargin, spacing } from '@/config/theme';

import type { MissionScreenState } from './missionScreenState';

// Sprint 003/004/005-006 — "Écran maître" assembled from Sprint 002's
// components, data-driven by a single MissionScreenState (Phase 03: the 4
// operational variants are just different mock objects rendered by this
// exact screen — "même structure de composants", docs/11-Roadmap.md). Fixed
// layout (no ScrollView): the map fills the remaining space between a
// pinned header block and a pinned bottom block (docs/01: "aucun écran
// blanc, seulement des panneaux"). Position/route are still simulated
// (Phase 04 Roadmap: "ne pas connecter immédiatement le GPS réel").
type Props = {
  state: MissionScreenState;
  // Sprint 017 (partie 1/N) — optional, no-arg (MissionScreenState doesn't
  // carry a missionItemId — the screen only ever deals with one highlighted
  // residence at a time, so the caller already knows which one from its own
  // context and closes over it). Default no-op keeps MissionScreenPreview's
  // static mocks working unchanged. The real App.tsx entry point wires these
  // to MissionContext's commands.
  onReportProblem?: () => void;
  onResolveProblem?: () => void;
  onSkipItem?: () => void;
  // Sprint 019 — introduced with no real destination yet (Mission/Plus/
  // Alertes are still placeholders, docs/11). Sprint "Paramètres": now
  // wired by `LiveMissionScreen.tsx` to open `SettingsScreen` — no-op
  // default keeps `MissionScreenPreview`/other callers unchanged.
  onMenu?: () => void;
};

export function MissionScreen({ state, onReportProblem, onResolveProblem, onSkipItem, onMenu }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MissionMapViewHandle>(null);
  const handleRecenter = () => mapRef.current?.recenter();

  // Offline/alert banners are additive overlays (docs/02 "Map First": the map
  // is the app, everything else floats above it) — they must not push the
  // map's flow height down like MissionCard does, or a demo combining both
  // (see missionScreenMocks.ts IN_PROGRESS_MOCK) collapses the map to a
  // sliver on a short device. Measured (not guessed) so it adapts to however
  // many alerts/pills are actually rendered.
  const [topOverlayHeight, setTopOverlayHeight] = useState(0);
  const hasTopOverlay = Boolean(state.offline) || state.alerts.length > 0;
  const columnsTop = hasTopOverlay ? spacing.sm + topOverlayHeight + spacing.sm : spacing.lg;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.topSection,
          { paddingTop: insets.top + spacing.sm, paddingLeft: insets.left + screenMargin, paddingRight: insets.right + screenMargin },
        ]}
      >
        <AppHeader onMenu={onMenu ?? (() => {})} onAlerts={() => {}} alertsCount={state.alerts.length} syncState={state.mission.syncState} />
        <MissionCardCompact
          missionId={state.mission.missionId}
          secteur={state.mission.secteur}
          index={state.mission.index}
          total={state.mission.total}
          progressPct={state.mission.progressPct}
          phaseLabel={state.stateLabel}
          phaseSeconds={state.activeState === 'PROBLEM' ? (state.problem?.frozenSeconds ?? 0) : state.timerSeconds}
          phaseColor={state.color}
          onDetails={() => {}}
        />
      </View>

      <View style={styles.mapArea}>
        <MissionMapView
          ref={mapRef}
          position={state.map.position}
          residences={state.map.residences}
          routeWaypoints={state.map.routeWaypoints}
          activeState={state.activeState}
        />

        {hasTopOverlay ? (
          <View
            style={[styles.topOverlay, { left: insets.left + screenMargin, right: insets.right + screenMargin, top: spacing.sm }]}
            onLayout={(e) => setTopOverlayHeight(e.nativeEvent.layout.height)}
          >
            {state.offline ? <OfflineIndicator pendingChanges={state.offline.pendingOperations} /> : null}
            <AlertsRow alerts={state.alerts} />
          </View>
        ) : null}

        <View style={[styles.rightColumn, { right: insets.right + screenMargin, top: columnsTop }]}>
          <View style={styles.mapControls}>
            <FloatingActionButton icon={Crosshair} size={44} onPress={handleRecenter} accessibilityLabel="Recentrer" />
            <FloatingActionButton icon={Layers} size={44} onPress={() => {}} accessibilityLabel="Couches" />
            <FloatingActionButton icon={Plus} size={44} onPress={() => {}} accessibilityLabel="Zoom avant" />
            <FloatingActionButton icon={Minus} size={44} onPress={() => {}} accessibilityLabel="Zoom arrière" />
          </View>
          {/* Weather: moved from the left column (where it duplicated this
              same column's "Recentrer" FAB) to sit quietly under the map
              controls instead of floating alone over the map content. */}
          <GlassCard level="chip" radius="lg" style={styles.weatherPill}>
            <Icon icon={CloudSnow} color={colors.textSecondary} size={20} />
            <View>
              <Txt variant="cardTitle">-8°C</Txt>
              <Txt variant="meta" color={colors.textSecondary}>
                Neige modérée
              </Txt>
            </View>
          </GlassCard>
          {state.tasks ? (
            <ResidenceTasksCard stateLabel={state.stateLabel} tasks={state.tasks} estimatedTime={state.estimatedTaskTime ?? ''} />
          ) : null}
        </View>
      </View>

      <View style={[styles.bottomSection, { paddingBottom: insets.bottom }]}>
        {/* Retrait de BottomTabBar (2026-08-02, .input/PLAN-ECRANS-OPERATEUR-RECA.md) :
            Mission/Alertes/Plus n'avaient déjà aucune destination réelle
            (placeholders), leurs actions se redistribuent vers le header
            (hamburger/cloche). Annonce devient un flottant indépendant,
            centré à cheval sur la carte et la feuille résidence — même
            décalage que l'ancien slot de BottomTabBar (marginTop:-28). */}
        <View style={styles.voiceButtonFloating}>
          <VoiceButton active onPress={() => {}} />
        </View>
        {/* BottomSheet est maintenant gestuel (Phase 6 de la refonte) et
            plein-bord (pas de screenMargin horizontal — un vrai bottom sheet
            touche les bords de l'écran, contrairement à l'ancienne carte
            flottante). `bare` évite un second GlassCard imbriqué : le sheet
            fournit déjà sa propre carte/poignée. En PROBLEM, son contenu est
            remplacé par ProblemStateCard (Phase 7 — fusion Problème/
            Résidence, retire l'ancienne colonne flottante étroite). */}
        <BottomSheet initialSnap={25}>
          {state.activeState === 'PROBLEM' && state.problem ? (
            <ProblemStateCard
              address={state.address}
              problemType={state.problem.type}
              note={state.problem.note}
              frozenSeconds={state.problem.frozenSeconds}
              onNext={onSkipItem}
              onResumeLater={onResolveProblem}
              bare
            />
          ) : (
            <CurrentResidenceSheet
              address={state.address}
              distanceLabel={state.residenceDistanceLabel}
              etaLabel={state.residenceEtaLabel}
              onProblem={onReportProblem}
              bare
            />
          )}
        </BottomSheet>
      </View>
    </View>
  );
}

// HANDOFF §5: 1 alert shown in full + a "+N instructions" chip for the rest —
// never a stack of N full cards.
function AlertsRow({ alerts }: { alerts: MissionScreenState['alerts'] }) {
  if (alerts.length === 0) {
    return null;
  }
  const [primary, ...rest] = alerts;
  if (!primary) {
    return null;
  }
  return (
    <View style={styles.alertsRow}>
      <AlertCard level={primary.level} icon={primary.icon} text={primary.text} />
      {rest.length > 0 ? (
        <Pill>
          <Txt variant="meta" color={colors.textSecondary}>{`+${rest.length} instructions`}</Txt>
        </Pill>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topSection: { gap: spacing.xs, paddingBottom: spacing.xs },
  alertsRow: { gap: spacing.sm },
  // topSection is now a fixed-height block (header + MissionCard only) —
  // offline/alert overlays no longer live in its flow (see topOverlay), so
  // the map reliably keeps the bulk of the screen like mock-encours.png.
  // Small floor only: a higher minHeight can still force mapArea taller than
  // the space actually left by topSection + bottomSection on a short/narrow
  // device, pushing the bottom sheet + tab bar off-screen again (see
  // memory.md, first real-device calibration pass) — flex:1 already grows
  // to fill the remaining space on its own.
  mapArea: { flex: 1, minHeight: 60, overflow: 'hidden' },
  topOverlay: { position: 'absolute', gap: spacing.sm },
  rightColumn: { position: 'absolute', alignItems: 'flex-end', gap: spacing.md },
  mapControls: { gap: spacing.sm },
  weatherPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  bottomSection: { gap: spacing.sm },
  voiceButtonFloating: { position: 'absolute', top: -28, alignSelf: 'center', zIndex: 10 },
});
